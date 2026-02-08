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

// ─── Perpetuals (Percolator) Types ──────────────────────────

/** Oracle price feed data from the VELOCITI Oracle */
export interface PerpsOracleData {
    /** Token mint address */
    mint: string;
    /** Spot price × 1e6 */
    priceE6: number;
    /** Time-weighted average price × 1e6 */
    twapE6: number;
    /** Price confidence interval × 1e6 */
    confidenceE6: number;
    /** Last update slot */
    lastUpdateSlot: number;
    /** Last update Unix timestamp */
    lastUpdateTs: number;
    /** Number of price updates */
    numUpdates: number;
    /** Whether the feed is currently active */
    isActive: boolean;
}

/** Real-time market statistics for a perps market */
export interface PerpsMarketStats {
    /** Total open interest in SOL */
    openInterest: number;
    /** 24-hour trading volume in SOL */
    volume24h: number;
    /** Current funding rate (positive = longs pay shorts) */
    fundingRate: number;
    /** Insurance fund balance in SOL */
    insuranceFund: number;
    /** Percentage of open interest that is long (0-100) */
    longRatio: number;
}

/** An open perpetual futures position */
export interface PerpsPosition {
    /** Unique position identifier */
    id: string;
    /** Token mint address */
    mintAddress: string;
    /** Position direction */
    side: 'long' | 'short';
    /** Position size in SOL */
    size: number;
    /** Entry price in SOL */
    entryPrice: number;
    /** Current mark price in SOL */
    currentPrice: number;
    /** Leverage multiplier */
    leverage: number;
    /** Unrealised PnL in SOL */
    pnl: number;
    /** Unrealised PnL as percentage of margin */
    pnlPercent: number;
    /** Estimated liquidation price */
    liquidationPrice: number;
    /** Collateral / margin in SOL */
    margin: number;
    /** Position open timestamp (Unix ms) */
    timestamp: number;
}

/** Parameters for opening a perps position */
export interface OpenPerpsPositionParams {
    /** Token mint address */
    mintAddress: string;
    /** Position direction */
    side: 'long' | 'short';
    /** Leverage multiplier (1-10) */
    leverage: number;
    /** Collateral amount in SOL */
    collateralAmount: number;
    /** Max slippage percentage (default 0.5) */
    slippage?: number;
    /** Wallet address of the trader */
    walletAddress: string;
}

/** Parameters for closing a perps position */
export interface ClosePerpsPositionParams {
    /** Position ID to close */
    positionId: string;
    /** Token mint address */
    mintAddress: string;
    /** Wallet address of the trader */
    walletAddress: string;
}

/** Aggregated perps market information */
export interface PerpsMarketInfo {
    /** Whether perps are enabled for this token */
    enabled: boolean;
    /** Oracle data (null if not active) */
    oracle: PerpsOracleData | null;
    /** Market statistics */
    stats: PerpsMarketStats;
    /** Maximum allowed leverage */
    maxLeverage: number;
    /** Trading fee in basis points */
    feeBps: number;
}

// ─── Limit Orders & Stop-Losses ──────────────────────────────

/** A limit order or stop-loss on the bonding curve */
export interface LimitOrder {
    id: string;
    mintAddress: string;
    walletAddress: string;
    type: 'limit_buy' | 'limit_sell' | 'stop_loss' | 'take_profit';
    side: 'buy' | 'sell';
    triggerPrice: number;
    amount: number;
    status: 'open' | 'filled' | 'cancelled' | 'expired';
    signature?: string | null;
    filledAt?: string | null;
    expiresAt?: string | null;
    createdAt: string;
    token?: { name: string; symbol: string; price: number; imageUrl?: string };
}

/** Parameters for creating a limit order */
export interface CreateLimitOrderParams {
    mintAddress: string;
    walletAddress: string;
    type: 'limit_buy' | 'limit_sell' | 'stop_loss' | 'take_profit';
    triggerPrice: number;
    amount: number;
    /** Expiry in seconds (default: 7 days) */
    expiresIn?: number;
}

// ─── Predictions Market ──────────────────────────────────────

/** A binary prediction market on a token milestone */
export interface PredictionMarket {
    id: string;
    mintAddress: string;
    question: string;
    type: 'graduation' | 'price_target' | 'volume_target';
    targetValue: number | null;
    deadline: string;
    yesPool: number;
    noPool: number;
    totalPool: number;
    betCount: number;
    status: 'open' | 'resolved_yes' | 'resolved_no' | 'cancelled';
    odds: { yes: number; no: number };
    token?: { name: string; symbol: string; price: number; imageUrl?: string };
    createdAt: string;
    resolvedAt?: string | null;
}

/** A bet on a prediction market */
export interface PredictionBet {
    id: string;
    marketId: string;
    walletAddress: string;
    side: 'yes' | 'no';
    amount: number;
    payout: number;
    claimed: boolean;
    createdAt: string;
}

/** Parameters for placing a prediction bet */
export interface PlacePredictionBetParams {
    marketId: string;
    walletAddress: string;
    side: 'yes' | 'no';
    amount: number;
}

/** Parameters for creating a prediction market */
export interface CreatePredictionMarketParams {
    mintAddress: string;
    walletAddress: string;
    type: 'graduation' | 'price_target' | 'volume_target';
    question: string;
    targetValue?: number;
    deadlineHours?: number;
}

// ─── Social / Copy-Trading ───────────────────────────────────

/** Leaderboard trader stats */
export interface LeaderboardTrader {
    rank: number;
    wallet: string;
    walletShort: string;
    tradeCount: number;
    totalVolume: number;
    followers: number;
    pnl?: number;
    winRate?: number;
}

/** A wallet follow relationship */
export interface WalletFollow {
    id: string;
    followerWallet: string;
    leaderWallet: string;
    maxTradeSize: number;
    scaleFactor: number;
    totalCopied: number;
    totalPnl: number;
    active: boolean;
    createdAt: string;
}

/** Parameters for following a trader */
export interface FollowTraderParams {
    followerWallet: string;
    leaderWallet: string;
    maxTradeSize?: number;
    scaleFactor?: number;
}

