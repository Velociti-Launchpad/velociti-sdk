/**
 * VELOCITI SDK Types
 * TypeScript type definitions for the SDK
 */

/** SDK Configuration */
export interface VelocitiConfig {
    /** Your API key from velociti.xyz/developers */
    apiKey: string;
    /** Network to use: 'mainnet' or 'devnet' */
    network?: 'mainnet' | 'devnet';
    /** Custom API base URL (optional) */
    baseUrl?: string;
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
    /** Social links */
    socials?: {
        twitter?: string;
        telegram?: string;
        website?: string;
    };
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

/** Fee claiming result */
export interface ClaimFeesResult {
    /** Transaction signature */
    signature: string;
    /** Amount claimed in tokens */
    amountClaimed: string;
    /** SOL value of claimed fees */
    valueInSol: number;
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
