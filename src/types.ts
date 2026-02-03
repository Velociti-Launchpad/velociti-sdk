/**
 * VELOCITI SDK Types
 * TypeScript type definitions for the SDK
 */

/** SDK Configuration */
export interface VelocitiConfig {
    /** Your API key from velociti.fun/developers */
    apiKey: string;
    /** Network to use: 'mainnet' or 'devnet' */
    network?: 'mainnet' | 'devnet';
    /** Custom API base URL (optional) */
    baseUrl?: string;
    /** Enable retry logic for failed requests */
    enableRetry?: boolean;
    /** Max retry attempts (default: 3) */
    maxRetries?: number;
    /** Retry delay in ms (default: 1000) */
    retryDelay?: number;
}

/** Token deployment configuration */
export interface DeployTokenParams {
    /** Token name (max 32 characters) */
    name: string;
    /** Token symbol (max 10 characters) */
    symbol: string;
    /** Token description */
    description?: string;
    /** Image URL (IPFS, Arweave, or HTTPS) */
    image?: string;
    /** Transfer tax rate (0-10%) */
    taxRate?: number;
    /** Payer wallet address (required - will sign and pay fees) */
    payerAddress: string;
    /** Social links */
    socials?: {
        twitter?: string;
        telegram?: string;
        website?: string;
    };
}

/** Batch deploy parameters */
export interface BatchDeployParams {
    /** Array of tokens to deploy */
    tokens: DeployTokenParams[];
    /** Single payer for all tokens */
    payerAddress: string;
}

/** Batch deploy result */
export interface BatchDeployResult {
    /** Individual results for each token */
    results: Array<{
        index: number;
        success: boolean;
        mintAddress?: string;
        error?: string;
    }>;
    /** Total estimated fee for all tokens */
    totalEstimatedFee: number;
}

/** Prepared transaction ready for signing */
export interface PreparedTransaction {
    /** Base64 encoded serialized transaction */
    transaction: string;
    /** Estimated SOL fee for the transaction */
    estimatedFee: number;
    /** Token mint address that will be created */
    mintAddress: string;
    /** Message to display to user */
    message: string;
    /** Blockhash used (expires after ~60 seconds) */
    blockhash: string;
    /** Last valid block height */
    lastValidBlockHeight: number;
}

/** Token information returned from API */
export interface TokenInfo {
    /** Token mint address */
    mintAddress: string;
    /** Token name */
    name: string;
    /** Token symbol */
    symbol: string;
    /** Token description */
    description?: string;
    /** Token image URL */
    imageUrl?: string;
    /** Current price in SOL */
    priceInSol: number;
    /** Current price in USD */
    priceInUsd: number;
    /** Market cap in USD */
    marketCapUsd: number;
    /** Graduation progress (0-100) */
    progress: number;
    /** Whether token has graduated to Raydium */
    isGraduated: boolean;
    /** Transfer tax rate */
    taxRate: number;
    /** Creator wallet address */
    creator: string;
    /** Bonding curve PDA */
    bondingCurvePda: string;
    /** Total supply */
    totalSupply: string;
    /** Created at timestamp */
    createdAt: string;
}

/** Token analytics data */
export interface TokenAnalytics {
    /** Token mint address */
    mintAddress: string;
    /** Price history (hourly for last 24h) */
    priceHistory: Array<{
        timestamp: number;
        price: number;
        volume: number;
    }>;
    /** 24h volume in SOL */
    volume24h: number;
    /** 24h price change percentage */
    priceChange24h: number;
    /** Number of unique holders */
    holders: number;
    /** Total number of trades */
    trades: number;
    /** All-time high price in SOL */
    allTimeHigh: number;
    /** All-time low price in SOL */
    allTimeLow: number;
}

/** Fee claiming result */
export interface ClaimFeesResult {
    /** Transaction signature */
    signature: string;
    /** Amount claimed in tokens */
    amountClaimed: string;
    /** SOL value of claimed fees */
    valueInSol: number;
}

/** Submit signed transaction result */
export interface SubmitResult {
    /** Whether submission was successful */
    success: boolean;
    /** Transaction signature */
    signature?: string;
    /** Token info if deployment confirmed */
    token?: TokenInfo;
    /** Error message if failed */
    error?: string;
}

/** Webhook configuration */
export interface WebhookConfig {
    /** Webhook URL to receive events */
    url: string;
    /** Events to subscribe to */
    events: WebhookEvent[];
    /** Optional secret for signature verification */
    secret?: string;
}

/** Webhook event types */
export type WebhookEvent =
    | 'token.created'
    | 'token.graduated'
    | 'token.trade'
    | 'fees.claimed'
    | 'fees.available';

/** Webhook payload */
export interface WebhookPayload {
    /** Event type */
    event: WebhookEvent;
    /** Event timestamp */
    timestamp: number;
    /** Event data */
    data: {
        mintAddress: string;
        [key: string]: unknown;
    };
    /** Signature for verification */
    signature?: string;
}

/** API response wrapper */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/** Rate limit information */
export interface RateLimitInfo {
    /** Remaining requests in current window */
    remaining: number;
    /** Total limit for current tier */
    limit: number;
    /** Reset timestamp (Unix ms) */
    reset: number;
}
