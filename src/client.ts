/**
 * VELOCITI SDK Client
 * Main client class for interacting with the VELOCITI API
 */

import {
    VelocitiConfig,
    DeployTokenParams,
    TokenInfo,
    ClaimFeesResult,
    ApiResponse,
    RateLimitInfo,
    PreparedTransaction,
    SubmitResult,
    BatchDeployParams,
    BatchDeployResult,
    TokenAnalytics,
    WebhookConfig,
} from './types';

const DEFAULT_MAINNET_URL = 'https://velociti.fun/api/sdk';
const DEFAULT_DEVNET_URL = 'https://velociti.fun/api/sdk'; // Same URL, network param handled internally

export class VelocitiClient {
    private apiKey: string;
    private baseUrl: string;
    private network: 'mainnet' | 'devnet';
    private rateLimitInfo: RateLimitInfo | null = null;
    private enableRetry: boolean;
    private maxRetries: number;
    private retryDelay: number;

    constructor(config: VelocitiConfig) {
        if (!config.apiKey) {
            throw new Error('API key is required. Get one at velociti.fun/developers');
        }

        this.apiKey = config.apiKey;
        this.network = config.network || 'devnet';
        this.baseUrl = config.baseUrl ||
            (this.network === 'mainnet' ? DEFAULT_MAINNET_URL : DEFAULT_DEVNET_URL);

        // Retry configuration
        this.enableRetry = config.enableRetry ?? true;
        this.maxRetries = config.maxRetries ?? 3;
        this.retryDelay = config.retryDelay ?? 1000;
    }

    /**
     * Sleep helper for retry logic
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Make an authenticated request to the VELOCITI API with retry logic
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        let lastError: Error | null = null;
        const attempts = this.enableRetry ? this.maxRetries : 1;

        for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
                const url = `${this.baseUrl}${endpoint}`;

                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.apiKey,
                        ...options.headers,
                    },
                });

                // Update rate limit info from headers
                const remaining = response.headers.get('X-RateLimit-Remaining');
                const limit = response.headers.get('X-RateLimit-Limit');
                const reset = response.headers.get('X-RateLimit-Reset');

                if (remaining && limit && reset) {
                    this.rateLimitInfo = {
                        remaining: parseInt(remaining, 10),
                        limit: parseInt(limit, 10),
                        reset: parseInt(reset, 10),
                    };
                }

                if (response.status === 429) {
                    // Rate limited - retry with exponential backoff
                    if (attempt < attempts) {
                        await this.sleep(this.retryDelay * Math.pow(2, attempt - 1));
                        continue;
                    }
                    return {
                        success: false,
                        error: 'Rate limit exceeded. Please try again later.',
                    };
                }

                if (response.status >= 500 && attempt < attempts) {
                    // Server error - retry
                    await this.sleep(this.retryDelay * Math.pow(2, attempt - 1));
                    continue;
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({})) as { error?: string };
                    return {
                        success: false,
                        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
                    };
                }

                const data = await response.json() as T;
                return { success: true, data };

            } catch (error) {
                lastError = error as Error;
                if (attempt < attempts) {
                    await this.sleep(this.retryDelay * Math.pow(2, attempt - 1));
                    continue;
                }
            }
        }

        return {
            success: false,
            error: lastError?.message || 'Request failed after retries',
        };
    }

    /**
     * Prepare a token deployment transaction (Step 1)
     * 
     * Returns an unsigned transaction that you must sign with your wallet.
     * After signing, call submitTransaction() to complete the deployment.
     */
    async prepareTokenDeploy(params: DeployTokenParams): Promise<ApiResponse<PreparedTransaction>> {
        // Validate params
        if (!params.name || params.name.length > 32) {
            return { success: false, error: 'Name is required and must be <= 32 characters' };
        }
        if (!params.symbol || params.symbol.length > 10) {
            return { success: false, error: 'Symbol is required and must be <= 10 characters' };
        }
        if (!params.payerAddress) {
            return { success: false, error: 'Payer wallet address is required' };
        }
        if (params.taxRate !== undefined && (params.taxRate < 0 || params.taxRate > 10)) {
            return { success: false, error: 'Tax rate must be between 0 and 10%' };
        }

        return this.request<PreparedTransaction>('/deploy/prepare', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Submit a signed transaction (Step 2)
     * 
     * @param signedTransaction - Base64 encoded signed transaction
     */
    async submitTransaction(signedTransaction: string): Promise<ApiResponse<SubmitResult>> {
        return this.request<SubmitResult>('/deploy/submit', {
            method: 'POST',
            body: JSON.stringify({ signedTransaction }),
        });
    }

    /**
     * Convenience method: Deploy token in one call (requires wallet adapter)
     */
    async deployToken(
        params: DeployTokenParams,
        signTransaction: (transaction: Uint8Array) => Promise<Uint8Array>
    ): Promise<ApiResponse<SubmitResult>> {
        const prepared = await this.prepareTokenDeploy(params);
        if (!prepared.success || !prepared.data) {
            return { success: false, error: prepared.error || 'Failed to prepare transaction' };
        }

        try {
            const txBytes = Uint8Array.from(atob(prepared.data.transaction), (c: string) => c.charCodeAt(0));
            const signedBytes = await signTransaction(txBytes);
            const signedBase64 = btoa(String.fromCharCode(...signedBytes));
            return this.submitTransaction(signedBase64);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: `Signing failed: ${message}` };
        }
    }

    // ============================================
    // BATCH DEPLOY
    // ============================================

    /**
     * Prepare multiple token deployments in batch
     */
    async prepareBatchDeploy(params: BatchDeployParams): Promise<ApiResponse<BatchDeployResult>> {
        if (!params.tokens || params.tokens.length === 0) {
            return { success: false, error: 'At least one token is required' };
        }
        if (params.tokens.length > 10) {
            return { success: false, error: 'Maximum 10 tokens per batch' };
        }
        if (!params.payerAddress) {
            return { success: false, error: 'Payer address is required' };
        }

        return this.request<BatchDeployResult>('/deploy/batch', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // ============================================
    // TOKEN ANALYTICS
    // ============================================

    /**
     * Get token information by mint address
     */
    async getToken(mintAddress: string): Promise<ApiResponse<TokenInfo>> {
        return this.request<TokenInfo>(`/tokens/${mintAddress}`);
    }

    /**
     * Get all tokens created with this API key
     */
    async getMyTokens(): Promise<ApiResponse<TokenInfo[]>> {
        return this.request<TokenInfo[]>('/tokens/mine');
    }

    /**
     * Get detailed analytics for a token
     */
    async getTokenAnalytics(mintAddress: string): Promise<ApiResponse<TokenAnalytics>> {
        return this.request<TokenAnalytics>(`/tokens/${mintAddress}/analytics`);
    }

    /**
     * Get price history for a token
     * @param mintAddress - Token mint address
     * @param period - Time period: '1h', '24h', '7d', '30d'
     */
    async getPriceHistory(
        mintAddress: string,
        period: '1h' | '24h' | '7d' | '30d' = '24h'
    ): Promise<ApiResponse<TokenAnalytics['priceHistory']>> {
        return this.request(`/tokens/${mintAddress}/price-history?period=${period}`);
    }

    // ============================================
    // FEE CLAIMING
    // ============================================

    /**
     * Prepare fee claim transaction
     */
    async prepareClaimFees(
        mintAddress: string,
        walletAddress: string
    ): Promise<ApiResponse<PreparedTransaction>> {
        return this.request<PreparedTransaction>('/fees/prepare', {
            method: 'POST',
            body: JSON.stringify({ mintAddress, walletAddress }),
        });
    }

    /**
     * Claim accumulated transfer fees for a token
     */
    async claimFees(
        mintAddress: string,
        walletAddress: string,
        signTransaction: (transaction: Uint8Array) => Promise<Uint8Array>
    ): Promise<ApiResponse<ClaimFeesResult>> {
        const prepared = await this.prepareClaimFees(mintAddress, walletAddress);
        if (!prepared.success || !prepared.data) {
            return { success: false, error: prepared.error || 'Failed to prepare claim' };
        }

        try {
            const txBytes = Uint8Array.from(atob(prepared.data.transaction), (c: string) => c.charCodeAt(0));
            const signedBytes = await signTransaction(txBytes);
            const signedBase64 = btoa(String.fromCharCode(...signedBytes));

            return this.request<ClaimFeesResult>('/fees/submit', {
                method: 'POST',
                body: JSON.stringify({ signedTransaction: signedBase64, mintAddress }),
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: `Signing failed: ${message}` };
        }
    }

    /**
     * Get unclaimed fees for a token
     */
    async getUnclaimedFees(mintAddress: string): Promise<ApiResponse<{ amount: string; valueInSol: number }>> {
        return this.request(`/fees/${mintAddress}`);
    }

    // ============================================
    // WEBHOOKS
    // ============================================

    /**
     * Register a webhook to receive events
     */
    async registerWebhook(config: WebhookConfig): Promise<ApiResponse<{ id: string }>> {
        return this.request('/webhooks', {
            method: 'POST',
            body: JSON.stringify(config),
        });
    }

    /**
     * List all registered webhooks
     */
    async listWebhooks(): Promise<ApiResponse<Array<WebhookConfig & { id: string }>>> {
        return this.request('/webhooks');
    }

    /**
     * Delete a webhook
     */
    async deleteWebhook(webhookId: string): Promise<ApiResponse<{ deleted: boolean }>> {
        return this.request(`/webhooks/${webhookId}`, {
            method: 'DELETE',
        });
    }

    /**
     * Test a webhook endpoint
     */
    async testWebhook(webhookId: string): Promise<ApiResponse<{ sent: boolean }>> {
        return this.request(`/webhooks/${webhookId}/test`, {
            method: 'POST',
        });
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get current rate limit status
     */
    getRateLimitInfo(): RateLimitInfo | null {
        return this.rateLimitInfo;
    }

    /**
     * Get the current network
     */
    getNetwork(): 'mainnet' | 'devnet' {
        return this.network;
    }

    /**
     * Check if API key is valid
     */
    async validateApiKey(): Promise<ApiResponse<{ valid: boolean; tier: string }>> {
        return this.request('/auth/validate');
    }
}
