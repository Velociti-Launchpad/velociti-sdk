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

import { VelocitiClient } from './client';
import { DeployTokenParams, TokenInfo, TokenAnalytics, ApiResponse, SubmitResult } from './types';

// React hook for token deployment
export function useVelocitiDeploy(apiKey: string, network: 'mainnet' | 'devnet' = 'devnet') {
    let loading = false;
    let error: string | null = null;
    let result: SubmitResult | null = null;

    const client = new VelocitiClient({ apiKey, network });

    async function deploy(
        params: DeployTokenParams,
        signTransaction: (transaction: Uint8Array) => Promise<Uint8Array>
    ): Promise<ApiResponse<SubmitResult>> {
        loading = true;
        error = null;

        try {
            const response = await client.deployToken(params, signTransaction);
            if (response.success && response.data) {
                result = response.data;
            } else {
                error = response.error || 'Unknown error';
            }
            return response;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            error = message;
            return { success: false, error: message };
        } finally {
            loading = false;
        }
    }

    async function prepareTransaction(params: DeployTokenParams) {
        loading = true;
        try {
            return await client.prepareTokenDeploy(params);
        } finally {
            loading = false;
        }
    }

    async function submitTransaction(signedTransaction: string) {
        loading = true;
        try {
            return await client.submitTransaction(signedTransaction);
        } finally {
            loading = false;
        }
    }

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
    let loading = false;
    let error: string | null = null;
    let token: TokenInfo | null = null;

    const client = new VelocitiClient({ apiKey, network });

    async function fetch(): Promise<TokenInfo | null> {
        loading = true;
        error = null;

        try {
            const response = await client.getToken(mintAddress);
            if (response.success && response.data) {
                token = response.data;
                return token;
            } else {
                error = response.error || 'Failed to fetch token';
                return null;
            }
        } catch (e) {
            error = e instanceof Error ? e.message : 'Unknown error';
            return null;
        } finally {
            loading = false;
        }
    }

    async function refresh() {
        return fetch();
    }

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
    let loading = false;
    let error: string | null = null;
    let analytics: TokenAnalytics | null = null;

    const client = new VelocitiClient({ apiKey, network });

    async function fetch(): Promise<TokenAnalytics | null> {
        loading = true;
        error = null;

        try {
            const response = await client.getTokenAnalytics(mintAddress);
            if (response.success && response.data) {
                analytics = response.data;
                return analytics;
            } else {
                error = response.error || 'Failed to fetch analytics';
                return null;
            }
        } catch (e) {
            error = e instanceof Error ? e.message : 'Unknown error';
            return null;
        } finally {
            loading = false;
        }
    }

    return {
        fetch,
        loading,
        error,
        analytics,
    };
}

// React hook for listing user's tokens
export function useVelocitiMyTokens(apiKey: string, network: 'mainnet' | 'devnet' = 'devnet') {
    let loading = false;
    let error: string | null = null;
    let tokens: TokenInfo[] = [];

    const client = new VelocitiClient({ apiKey, network });

    async function fetch(): Promise<TokenInfo[]> {
        loading = true;
        error = null;

        try {
            const response = await client.getMyTokens();
            if (response.success && response.data) {
                tokens = response.data;
                return tokens;
            } else {
                error = response.error || 'Failed to fetch tokens';
                return [];
            }
        } catch (e) {
            error = e instanceof Error ? e.message : 'Unknown error';
            return [];
        } finally {
            loading = false;
        }
    }

    return {
        fetch,
        loading,
        error,
        tokens,
    };
}

// React hook for fee claiming
export function useVelocitiFees(apiKey: string, mintAddress: string, network: 'mainnet' | 'devnet' = 'mainnet') {
    let loading = false;
    let error: string | null = null;

    const client = new VelocitiClient({ apiKey, network });

    async function getUnclaimedFees() {
        loading = true;
        try {
            return await client.getUnclaimedFees(mintAddress);
        } finally {
            loading = false;
        }
    }

    async function claim(
        walletAddress: string,
        signTransaction: (transaction: Uint8Array) => Promise<Uint8Array>
    ) {
        loading = true;
        error = null;

        try {
            return await client.claimFees(mintAddress, walletAddress, signTransaction);
        } catch (e) {
            error = e instanceof Error ? e.message : 'Unknown error';
            return { success: false, error };
        } finally {
            loading = false;
        }
    }

    return {
        getUnclaimedFees,
        claim,
        loading,
        error,
    };
}
