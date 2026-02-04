/**
 * VELOCITI SDK Stream Client
 * Real-time event streaming via Server-Sent Events (SSE)
 * 
 * Provides cross-platform real-time updates for:
 * - Price changes
 * - Trade activity
 * - New comments
 * - Portfolio updates
 * - Trending tokens
 */

export type StreamTopic =
    | `prices/${string}`       // Real-time price updates for a token
    | `trades/${string}`       // Trade activity for a token  
    | `comments/${string}`     // New comments on a token
    | `portfolio/${string}`    // Portfolio updates for a wallet
    | `feed/trending`          // Trending tokens feed
    | `feed/new`;              // New token launches

export interface StreamEvent<T = unknown> {
    topic: StreamTopic;
    data: T;
    timestamp: number;
}

export interface PriceUpdate {
    mintAddress: string;
    price: number;
    previousPrice: number;
    change: number;
    changePercent: number;
    timestamp: number;
}

export interface TradeUpdate {
    mintAddress: string;
    type: 'buy' | 'sell';
    price: number;
    solAmount: number;
    tokenAmount: number;
    wallet: string;
    signature: string;
    timestamp: number;
}

export interface CommentUpdate {
    mintAddress: string;
    id: string;
    content: string;
    author: string;
    timestamp: number;
}

export interface PortfolioUpdate {
    wallet: string;
    totalValue: number;
    holdings: Array<{
        mintAddress: string;
        balance: number;
        value: number;
        pnl: number;
    }>;
}

export interface TrendingUpdate {
    tokens: Array<{
        mintAddress: string;
        name: string;
        symbol: string;
        price: number;
        trendingScore: number;
    }>;
}

export interface VelocitiStreamConfig {
    /** API key for authentication */
    apiKey?: string;
    /** Base URL for the stream endpoint */
    baseUrl?: string;
    /** Auto-reconnect on disconnect (default: true) */
    autoReconnect?: boolean;
    /** Reconnect delay in ms (default: 1000) */
    reconnectDelay?: number;
    /** Maximum reconnect attempts (default: 10) */
    maxReconnectAttempts?: number;
}

type EventCallback<T> = (data: T) => void;
type ErrorCallback = (error: Error) => void;
type ConnectionCallback = () => void;

const DEFAULT_STREAM_URL = 'https://velociti.fun/api/stream';

/**
 * VELOCITI Stream Client
 * 
 * Connects to the VELOCITI real-time event stream via SSE.
 * Supports multiple concurrent topic subscriptions with automatic reconnection.
 * 
 * @example
 * ```ts
 * const stream = new VelocitiStream({ apiKey: 'your-api-key' });
 * 
 * // Subscribe to price updates
 * stream.onPrice('mint123', (update) => {
 *   console.log(`Price: ${update.price} SOL`);
 * });
 * 
 * // Subscribe to trades
 * stream.onTrade('mint123', (trade) => {
 *   console.log(`${trade.type} @ ${trade.price} SOL`);
 * });
 * 
 * // Connect to start receiving events
 * await stream.connect();
 * ```
 */
export class VelocitiStream {
    private config: Required<VelocitiStreamConfig>;
    private eventSource: EventSource | null = null;
    private topics: Set<StreamTopic> = new Set();
    private listeners: Map<StreamTopic, Set<EventCallback<any>>> = new Map();
    private onErrorCallbacks: Set<ErrorCallback> = new Set();
    private onConnectCallbacks: Set<ConnectionCallback> = new Set();
    private onDisconnectCallbacks: Set<ConnectionCallback> = new Set();
    private reconnectAttempts = 0;
    private isConnecting = false;
    private isConnected = false;

    constructor(config: VelocitiStreamConfig = {}) {
        this.config = {
            apiKey: config.apiKey || '',
            baseUrl: config.baseUrl || DEFAULT_STREAM_URL,
            autoReconnect: config.autoReconnect ?? true,
            reconnectDelay: config.reconnectDelay ?? 1000,
            maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
        };
    }

    /**
     * Connect to the stream and start receiving events
     */
    async connect(): Promise<void> {
        if (this.isConnected || this.isConnecting) {
            return;
        }

        this.isConnecting = true;

        return new Promise((resolve, reject) => {
            try {
                const url = this.buildStreamUrl();
                this.eventSource = new EventSource(url);

                this.eventSource.onopen = () => {
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.onConnectCallbacks.forEach(cb => cb());
                    resolve();
                };

                this.eventSource.onmessage = (event) => {
                    try {
                        const parsed = JSON.parse(event.data);
                        if (parsed.type === 'ping') return; // Ignore keepalive

                        const topic = parsed.topic as StreamTopic;
                        const listeners = this.listeners.get(topic);
                        if (listeners) {
                            listeners.forEach(cb => cb(parsed.data));
                        }
                    } catch (e) {
                        console.error('[VelocitiStream] Failed to parse event:', e);
                    }
                };

                this.eventSource.onerror = (error) => {
                    this.isConnected = false;
                    this.isConnecting = false;

                    const err = new Error('Stream connection error');
                    this.onErrorCallbacks.forEach(cb => cb(err));
                    this.onDisconnectCallbacks.forEach(cb => cb());

                    // Attempt reconnect if enabled
                    if (this.config.autoReconnect &&
                        this.reconnectAttempts < this.config.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        setTimeout(() => this.connect(), this.config.reconnectDelay);
                    } else if (!this.isConnected) {
                        reject(err);
                    }
                };
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    /**
     * Disconnect from the stream
     */
    disconnect(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnected = false;
        this.isConnecting = false;
        this.onDisconnectCallbacks.forEach(cb => cb());
    }

    /**
     * Subscribe to price updates for a token
     */
    onPrice(mintAddress: string, callback: EventCallback<PriceUpdate>): () => void {
        return this.subscribe(`prices/${mintAddress}`, callback);
    }

    /**
     * Subscribe to trade activity for a token
     */
    onTrade(mintAddress: string, callback: EventCallback<TradeUpdate>): () => void {
        return this.subscribe(`trades/${mintAddress}`, callback);
    }

    /**
     * Subscribe to new comments on a token
     */
    onComment(mintAddress: string, callback: EventCallback<CommentUpdate>): () => void {
        return this.subscribe(`comments/${mintAddress}`, callback);
    }

    /**
     * Subscribe to portfolio updates for a wallet
     */
    onPortfolio(walletAddress: string, callback: EventCallback<PortfolioUpdate>): () => void {
        return this.subscribe(`portfolio/${walletAddress}`, callback);
    }

    /**
     * Subscribe to trending tokens feed
     */
    onTrending(callback: EventCallback<TrendingUpdate>): () => void {
        return this.subscribe('feed/trending', callback);
    }

    /**
     * Subscribe to new token launches
     */
    onNewTokens(callback: EventCallback<{ mintAddress: string; name: string; symbol: string }>): () => void {
        return this.subscribe('feed/new', callback);
    }

    /**
     * Generic topic subscription
     */
    subscribe<T>(topic: StreamTopic, callback: EventCallback<T>): () => void {
        this.topics.add(topic);

        if (!this.listeners.has(topic)) {
            this.listeners.set(topic, new Set());
        }
        this.listeners.get(topic)!.add(callback);

        // If already connected, need to reconnect with new topics
        if (this.isConnected) {
            this.reconnect();
        }

        // Return unsubscribe function
        return () => {
            const topicListeners = this.listeners.get(topic);
            if (topicListeners) {
                topicListeners.delete(callback);
                if (topicListeners.size === 0) {
                    this.topics.delete(topic);
                    this.listeners.delete(topic);
                    if (this.isConnected) {
                        this.reconnect();
                    }
                }
            }
        };
    }

    /**
     * Register error handler
     */
    onError(callback: ErrorCallback): () => void {
        this.onErrorCallbacks.add(callback);
        return () => this.onErrorCallbacks.delete(callback);
    }

    /**
     * Register connect handler
     */
    onConnect(callback: ConnectionCallback): () => void {
        this.onConnectCallbacks.add(callback);
        return () => this.onConnectCallbacks.delete(callback);
    }

    /**
     * Register disconnect handler
     */
    onDisconnect(callback: ConnectionCallback): () => void {
        this.onDisconnectCallbacks.add(callback);
        return () => this.onDisconnectCallbacks.delete(callback);
    }

    /**
     * Check if currently connected
     */
    get connected(): boolean {
        return this.isConnected;
    }

    /**
     * Get list of active topic subscriptions
     */
    get activeTopics(): StreamTopic[] {
        return Array.from(this.topics);
    }

    private buildStreamUrl(): string {
        const topics = Array.from(this.topics).join(',');
        const params = new URLSearchParams({ topics });
        if (this.config.apiKey) {
            params.set('apiKey', this.config.apiKey);
        }
        return `${this.config.baseUrl}?${params.toString()}`;
    }

    private reconnect(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnected = false;
        this.connect().catch(console.error);
    }
}

// Export singleton for convenience
let defaultStream: VelocitiStream | null = null;

/**
 * Get the default stream instance
 */
export function getStream(config?: VelocitiStreamConfig): VelocitiStream {
    if (!defaultStream || config) {
        defaultStream = new VelocitiStream(config);
    }
    return defaultStream;
}
