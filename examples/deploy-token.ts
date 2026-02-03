/**
 * Example: Deploy a token on VELOCITI
 * 
 * This example shows how to use the VELOCITI SDK to deploy
 * a new tax token on Solana.
 * 
 * Run with: npx ts-node examples/deploy-token.ts
 */

import { VelocitiClient } from '../src';

async function main() {
    // Initialize the client with your API key
    const client = new VelocitiClient({
        apiKey: process.env.VELOCITI_API_KEY || 'your-api-key',
        network: 'devnet', // Use 'mainnet' for production
    });

    console.log('🚀 Deploying token on VELOCITI...\n');

    // Deploy a new token
    const result = await client.deployToken({
        name: 'My AI Token',
        symbol: 'AIT',
        description: 'A token deployed by an AI agent',
        taxRate: 5, // 5% transfer tax
        socials: {
            twitter: '@myaitoken',
            website: 'https://myaitoken.com',
        },
    });

    if (!result.success) {
        console.error('❌ Deployment failed:', result.error);
        return;
    }

    console.log('✅ Token deployed successfully!\n');
    console.log('Token Info:');
    console.log(`  Name: ${result.data?.name}`);
    console.log(`  Symbol: ${result.data?.symbol}`);
    console.log(`  Mint: ${result.data?.mintAddress}`);
    console.log(`  Tax Rate: ${result.data?.taxRate}%`);
    console.log(`  Bonding Curve: ${result.data?.bondingCurvePda}`);
    console.log(`\n  View on VELOCITI: https://velociti.xyz/token/${result.data?.mintAddress}`);

    // Check rate limit status
    const rateLimit = client.getRateLimitInfo();
    if (rateLimit) {
        console.log(`\n📊 Rate Limit: ${rateLimit.remaining}/${rateLimit.limit} requests remaining`);
    }
}

main().catch(console.error);
