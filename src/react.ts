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
import { DeployTokenParams, TokenInfo, TokenAnalytics, ApiResponse, SubmitResult } from './types';

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
