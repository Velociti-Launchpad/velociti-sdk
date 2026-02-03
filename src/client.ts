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
} from './types';

const DEFAULT_MAINNET_URL = 'https://velociti.fun/api/sdk';
const DEFAULT_DEVNET_URL = 'https://devnet.velociti.fun/api/sdk';

export class VelocitiClient {
    private apiKey: string;
    private baseUrl: string;
    private network: 'mainnet' | 'devnet';
    private rateLimitInfo: RateLimitInfo | null = null;

    constructor(config: VelocitiConfig) {
        if (!config.apiKey) {
            throw new Error('API key is required. Get one at velociti.fun/developers');
        }

        this.apiKey = config.apiKey;
        this.network = config.network || 'mainnet';
        this.baseUrl = config.baseUrl ||
            (this.network === 'mainnet' ? DEFAULT_MAINNET_URL : DEFAULT_DEVNET_URL);
    }

    /**
     * Make an authenticated request to the VELOCITI API
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
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
            return {
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
            };
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
    }

    /**
     * Prepare a token deployment transaction (Step 1)
     * 
     * Returns an unsigned transaction that you must sign with your wallet.
     * After signing, call submitTransaction() to complete the deployment.
     * 
     * @example
     * ```typescript
     * // Step 1: Prepare the transaction
     * const prepared = await client.prepareTokenDeploy({
     *   name: 'My Token',
     *   symbol: 'MTK',
     *   taxRate: 5,
     *   payerAddress: 'YourWalletAddress...'
     * });
     * 
     * // Step 2: Sign with your wallet (example using @solana/web3.js)
     * const tx = Transaction.from(Buffer.from(prepared.data.transaction, 'base64'));
     * const signedTx = await wallet.signTransaction(tx);
     * 
     * // Step 3: Submit the signed transaction
     * const result = await client.submitTransaction(signedTx.serialize().toString('base64'));
     * ```
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
     * 
     * This combines prepareTokenDeploy and submitTransaction.
     * You must provide a signTransaction function from your wallet.
     * 
     * @example
     * ```typescript
     * const result = await client.deployToken({
     *   name: 'My Token',
     *   symbol: 'MTK',
     *   taxRate: 5,
     *   payerAddress: wallet.publicKey.toBase58()
     * }, async (tx) => {
     *   return await wallet.signTransaction(tx);
     * });
     * ```
     */
    async deployToken(
        params: DeployTokenParams,
        signTransaction: (transaction: Uint8Array) => Promise<Uint8Array>
    ): Promise<ApiResponse<SubmitResult>> {
        // Step 1: Prepare
        const prepared = await this.prepareTokenDeploy(params);
        if (!prepared.success || !prepared.data) {
            return { success: false, error: prepared.error || 'Failed to prepare transaction' };
        }

        // Step 2: Sign
        try {
            const txBytes = Uint8Array.from(atob(prepared.data.transaction), c => c.charCodeAt(0));
            const signedBytes = await signTransaction(txBytes);
            const signedBase64 = btoa(String.fromCharCode(...signedBytes));

            // Step 3: Submit
            return this.submitTransaction(signedBase64);
        } catch (error: any) {
            return { success: false, error: `Signing failed: ${error.message}` };
        }
    }

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
     * Combines prepare + sign + submit
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
            const txBytes = Uint8Array.from(atob(prepared.data.transaction), c => c.charCodeAt(0));
            const signedBytes = await signTransaction(txBytes);
            const signedBase64 = btoa(String.fromCharCode(...signedBytes));

            return this.request<ClaimFeesResult>('/fees/submit', {
                method: 'POST',
                body: JSON.stringify({ signedTransaction: signedBase64, mintAddress }),
            });
        } catch (error: any) {
            return { success: false, error: `Signing failed: ${error.message}` };
        }
    }

    /**
     * Get unclaimed fees for a token
     */
    async getUnclaimedFees(mintAddress: string): Promise<ApiResponse<{ amount: string; valueInSol: number }>> {
        return this.request(`/fees/${mintAddress}`);
    }

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
}
