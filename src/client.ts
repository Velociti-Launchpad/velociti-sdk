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
} from './types';

const DEFAULT_MAINNET_URL = 'https://velociti.xyz/api/sdk';
const DEFAULT_DEVNET_URL = 'https://devnet.velociti.xyz/api/sdk';

export class VelocitiClient {
    private apiKey: string;
    private baseUrl: string;
    private network: 'mainnet' | 'devnet';
    private rateLimitInfo: RateLimitInfo | null = null;

    constructor(config: VelocitiConfig) {
        if (!config.apiKey) {
            throw new Error('API key is required. Get one at velociti.xyz/developers');
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
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.json();
        return { success: true, data };
    }

    /**
     * Deploy a new token on VELOCITI
     * 
     * @example
     * ```typescript
     * const result = await client.deployToken({
     *   name: 'My Token',
     *   symbol: 'MTK',
     *   description: 'A test token',
     *   taxRate: 5,
     * });
     * ```
     */
    async deployToken(params: DeployTokenParams): Promise<ApiResponse<TokenInfo>> {
        // Validate params
        if (!params.name || params.name.length > 32) {
            return { success: false, error: 'Name is required and must be <= 32 characters' };
        }
        if (!params.symbol || params.symbol.length > 10) {
            return { success: false, error: 'Symbol is required and must be <= 10 characters' };
        }
        if (params.taxRate !== undefined && (params.taxRate < 0 || params.taxRate > 10)) {
            return { success: false, error: 'Tax rate must be between 0 and 10%' };
        }

        return this.request<TokenInfo>('/deploy', {
            method: 'POST',
            body: JSON.stringify(params),
        });
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
     * Claim accumulated transfer fees for a token
     * Only the token creator can claim fees
     * 
     * @param mintAddress - The token mint address
     * @param walletAddress - Your wallet address to receive fees
     */
    async claimFees(
        mintAddress: string,
        walletAddress: string
    ): Promise<ApiResponse<ClaimFeesResult>> {
        return this.request<ClaimFeesResult>('/fees/claim', {
            method: 'POST',
            body: JSON.stringify({ mintAddress, walletAddress }),
        });
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
