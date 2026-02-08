/**
 * React Hooks for VELOCITI SDK
 * 
 * Usage with Solana wallet adapter:
 * 
 * import { useVelocitiDeploy } from '@velociti/sdk/react';
 * import { useWallet } from '@solana/wallet-adapter-react';
 * 
 * function DeployButton() {
 *   const { signTransaction } = useWallet();
 *   const { deploy, loading, error } = useVelocitiDeploy('your-api-key');
 *   
 *   const handleDeploy = async () => {
 *     const result = await deploy({
 *       name: 'MyToken',
 *       symbol: 'MTK',
 *       taxRate: 5,
 *       payerAddress: wallet.publicKey.toBase58()
 *     }, signTransaction);
 *     
 *     if (result.success) {
 *       console.log('Deployed!', result.data);
 *     }
 *   };
 * }
 */

import { useState, useCallback, useMemo } from 'react';
import { VelocitiClient } from './client';
import {
    DeployTokenParams,
    TokenInfo,
    TokenAnalytics,
    ApiResponse,
    SubmitResult,
    PerpsMarketInfo,
    PerpsOracleData,
    PerpsPosition,
    OpenPerpsPositionParams,
    ClosePerpsPositionParams,
    LimitOrder,
    CreateLimitOrderParams,
    PredictionMarket,
    CreatePredictionMarketParams,
    LeaderboardTrader,
    WalletFollow,
    FollowTraderParams,
} from './types';


// React hook for token deployment
export function useVelocitiDeploy(apiKey: string, network: 'mainnet' | 'devnet' = 'devnet') {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SubmitResult | null>(null);

    const client = useMemo(() => new VelocitiClient({ apiKey, network }), [apiKey, network]);

    const deploy = useCallback(async (
        params: DeployTokenParams,
        signTransaction: (transaction: Uint8Array) => Promise<Uint8Array>
    ): Promise<ApiResponse<SubmitResult>> => {
        setLoading(true);
        setError(null);

        try {
            const response = await client.deployToken(params, signTransaction);
            if (response.success && response.data) {
                setResult(response.data);
            } else {
                setError(response.error || 'Unknown error');
            }
            return response;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [client]);

    const prepareTransaction = useCallback(async (params: DeployTokenParams) => {
        setLoading(true);
        try {
            return await client.prepareTokenDeploy(params);
        } finally {
            setLoading(false);
        }
    }, [client]);

    const submitTransaction = useCallback(async (signedTransaction: string) => {
        setLoading(true);
        try {
            return await client.submitTransaction(signedTransaction);
        } finally {
            setLoading(false);
        }
    }, [client]);

    return {
        deploy,
        prepareTransaction,
        submitTransaction,
        loading,
        error,
        result,
        client,
    };
}

// React hook for fetching token info
export function useVelocitiToken(apiKey: string, mintAddress: string, network: 'mainnet' | 'devnet' = 'devnet') {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<TokenInfo | null>(null);

    const client = useMemo(() => new VelocitiClient({ apiKey, network }), [apiKey, network]);

    const fetch = useCallback(async (): Promise<TokenInfo | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await client.getToken(mintAddress);
            if (response.success && response.data) {
                setToken(response.data);
                return response.data;
            } else {
                setError(response.error || 'Failed to fetch token');
                return null;
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
            return null;
        } finally {
            setLoading(false);
        }
    }, [client, mintAddress]);

    const refresh = useCallback(async () => {
        return fetch();
    }, [fetch]);

    return {
        fetch,
        refresh,
        loading,
        error,
        token,
    };
}

// React hook for token analytics
export function useVelocitiAnalytics(apiKey: string, mintAddress: string, network: 'mainnet' | 'devnet' = 'devnet') {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analytics, setAnalytics] = useState<TokenAnalytics | null>(null);

    const client = useMemo(() => new VelocitiClient({ apiKey, network }), [apiKey, network]);

    const fetch = useCallback(async (): Promise<TokenAnalytics | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await client.getTokenAnalytics(mintAddress);
            if (response.success && response.data) {
                setAnalytics(response.data);
                return response.data;
            } else {
                setError(response.error || 'Failed to fetch analytics');
                return null;
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
            return null;
        } finally {
            setLoading(false);
        }
    }, [client, mintAddress]);

    return {
        fetch,
        loading,
        error,
        analytics,
    };
}

// React hook for listing user's tokens
export function useVelocitiMyTokens(apiKey: string, network: 'mainnet' | 'devnet' = 'devnet') {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tokens, setTokens] = useState<TokenInfo[]>([]);

    const client = useMemo(() => new VelocitiClient({ apiKey, network }), [apiKey, network]);

    const fetch = useCallback(async (): Promise<TokenInfo[]> => {
        setLoading(true);
        setError(null);

        try {
            const response = await client.getMyTokens();
            if (response.success && response.data) {
                setTokens(response.data);
                return response.data;
            } else {
                setError(response.error || 'Failed to fetch tokens');
                return [];
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
            return [];
        } finally {
            setLoading(false);
        }
    }, [client]);

    return {
        fetch,
        loading,
        error,
        tokens,
    };
}

// React hook for fee claiming
export function useVelocitiFees(apiKey: string, mintAddress: string, network: 'mainnet' | 'devnet' = 'mainnet') {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const client = useMemo(() => new VelocitiClient({ apiKey, network }), [apiKey, network]);

    const getUnclaimedFees = useCallback(async () => {
        setLoading(true);
        try {
            return await client.getUnclaimedFees(mintAddress);
        } finally {
            setLoading(false);
        }
    }, [client, mintAddress]);

    const claim = useCallback(async (
        walletAddress: string,
        signTransaction: (transaction: Uint8Array) => Promise<Uint8Array>
    ) => {
        setLoading(true);
        setError(null);

        try {
            return await client.claimFees(mintAddress, walletAddress, signTransaction);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [client, mintAddress]);

    return {
        getUnclaimedFees,
        claim,
        loading,
        error,
    };
}

// React hook for perpetual futures trading
export function useVelocitiPerps(apiKey: string, mintAddress: string, network: 'mainnet' | 'devnet' = 'devnet') {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [market, setMarket] = useState<PerpsMarketInfo | null>(null);
    const [oracle, setOracle] = useState<PerpsOracleData | null>(null);
    const [positions, setPositions] = useState<PerpsPosition[]>([]);

    const client = useMemo(() => new VelocitiClient({ apiKey, network }), [apiKey, network]);

    const fetchMarket = useCallback(async (): Promise<PerpsMarketInfo | null> => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.getPerpsMarket(mintAddress);
            if (response.success && response.data) {
                setMarket(response.data);
                return response.data;
            } else {
                setError(response.error || 'Failed to fetch perps market');
                return null;
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
            return null;
        } finally {
            setLoading(false);
        }
    }, [client, mintAddress]);

    const fetchOracle = useCallback(async (): Promise<PerpsOracleData | null> => {
        try {
            const response = await client.getPerpsOracleData(mintAddress);
            if (response.success && response.data) {
                setOracle(response.data);
                return response.data;
            }
            return null;
        } catch {
            return null;
        }
    }, [client, mintAddress]);

    const fetchPositions = useCallback(async (walletAddress: string): Promise<PerpsPosition[]> => {
        setLoading(true);
        try {
            const response = await client.getPerpsPositions(mintAddress, walletAddress);
            if (response.success && response.data) {
                setPositions(response.data);
                return response.data;
            }
            return [];
        } catch {
            return [];
        } finally {
            setLoading(false);
        }
    }, [client, mintAddress]);

    const openPosition = useCallback(async (
        params: OpenPerpsPositionParams,
        signTransaction: (transaction: Uint8Array) => Promise<Uint8Array>
    ) => {
        setLoading(true);
        setError(null);
        try {
            return await client.openPosition(params, signTransaction);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [client]);

    const closePosition = useCallback(async (
        params: ClosePerpsPositionParams,
        signTransaction: (transaction: Uint8Array) => Promise<Uint8Array>
    ) => {
        setLoading(true);
        setError(null);
        try {
            return await client.closePosition(params, signTransaction);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [client]);

    return {
        fetchMarket,
        fetchOracle,
        fetchPositions,
        openPosition,
        closePosition,
        market,
        oracle,
        positions,
        loading,
        error,
    };
}

// React hook for limit orders & stop-losses
export function useVelocitiLimitOrders(apiKey: string, network: 'mainnet' | 'devnet' = 'devnet') {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orders, setOrders] = useState<LimitOrder[]>([]);

    const client = useMemo(() => new VelocitiClient({ apiKey, network }), [apiKey, network]);

    const createOrder = useCallback(async (params: CreateLimitOrderParams) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.createLimitOrder(params);
            if (!response.success) setError(response.error || 'Failed to create order');
            return response;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [client]);

    const cancelOrder = useCallback(async (orderId: string, walletAddress: string) => {
        setLoading(true);
        try {
            return await client.cancelLimitOrder(orderId, walletAddress);
        } finally {
            setLoading(false);
        }
    }, [client]);

    const fetchOrders = useCallback(async (walletAddress: string, mintAddress?: string) => {
        setLoading(true);
        try {
            const response = await client.getLimitOrders(walletAddress, mintAddress);
            if (response.success && response.data) {
                setOrders(response.data.orders);
            }
            return response;
        } finally {
            setLoading(false);
        }
    }, [client]);

    return { createOrder, cancelOrder, fetchOrders, orders, loading, error };
}

// React hook for prediction markets
export function useVelocitiPredictions(apiKey: string, network: 'mainnet' | 'devnet' = 'devnet') {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [markets, setMarkets] = useState<PredictionMarket[]>([]);

    const client = useMemo(() => new VelocitiClient({ apiKey, network }), [apiKey, network]);

    const createMarket = useCallback(async (params: CreatePredictionMarketParams) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.createPredictionMarket(params);
            if (!response.success) setError(response.error || 'Failed to create market');
            return response;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [client]);

    const fetchMarkets = useCallback(async (mintAddress?: string) => {
        setLoading(true);
        try {
            const response = await client.getPredictionMarkets(mintAddress);
            if (response.success && response.data) {
                setMarkets(response.data.markets);
            }
            return response;
        } finally {
            setLoading(false);
        }
    }, [client]);

    const placeBet = useCallback(async (marketId: string, walletAddress: string, side: 'yes' | 'no', amount: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.placePredictionBet({ marketId, walletAddress, side, amount });
            if (!response.success) setError(response.error || 'Failed to place bet');
            return response;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [client]);

    return { createMarket, fetchMarkets, placeBet, markets, loading, error };
}

// React hook for copy-trading
export function useVelocitiCopyTrade(apiKey: string, network: 'mainnet' | 'devnet' = 'devnet') {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardTrader[]>([]);
    const [follows, setFollows] = useState<WalletFollow[]>([]);

    const client = useMemo(() => new VelocitiClient({ apiKey, network }), [apiKey, network]);

    const followTrader = useCallback(async (params: FollowTraderParams) => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.followTrader(params);
            if (!response.success) setError(response.error || 'Failed to follow');
            return response;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [client]);

    const unfollowTrader = useCallback(async (followerWallet: string, leaderWallet: string) => {
        setLoading(true);
        try {
            return await client.unfollowTrader(followerWallet, leaderWallet);
        } finally {
            setLoading(false);
        }
    }, [client]);

    const fetchLeaderboard = useCallback(async (sortBy?: string, period?: string) => {
        setLoading(true);
        try {
            const response = await client.getLeaderboard(sortBy, period);
            if (response.success && response.data) {
                setLeaderboard(response.data.leaderboard);
            }
            return response;
        } finally {
            setLoading(false);
        }
    }, [client]);

    const fetchFollows = useCallback(async (walletAddress: string) => {
        setLoading(true);
        try {
            const response = await client.getFollows(walletAddress);
            if (response.success && response.data) {
                setFollows(response.data.follows);
            }
            return response;
        } finally {
            setLoading(false);
        }
    }, [client]);

    return { followTrader, unfollowTrader, fetchLeaderboard, fetchFollows, leaderboard, follows, loading, error };
}
