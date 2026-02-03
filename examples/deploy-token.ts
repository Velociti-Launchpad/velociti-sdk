/**
 * Example: Deploy a token on VELOCITI
 * 
 * This example shows the 2-step flow:
 * 1. Prepare transaction (API builds it with all program addresses)
 * 2. Sign & submit (you pay the fees)
 * 
 * Run with: npx ts-node examples/deploy-token.ts
 */

import { VelocitiClient } from '../src';
import { Keypair, Transaction } from '@solana/web3.js';

async function main() {
    // Initialize the client with your API key
    const client = new VelocitiClient({
        apiKey: process.env.VELOCITI_API_KEY || 'your-api-key',
        network: 'devnet',
    });

    // Your wallet (in production, use wallet adapter)
    const wallet = Keypair.generate(); // Demo only!

    console.log('🚀 Preparing token deployment...\n');
    console.log(`   Wallet: ${wallet.publicKey.toBase58()}`);

    // Step 1: Prepare the transaction
    // The API builds the full transaction with all program addresses,
    // PDAs, and accounts. You don't need to know any internal details!
    const prepared = await client.prepareTokenDeploy({
        name: 'My AI Token',
        symbol: 'AIT',
        description: 'A token deployed by an AI agent',
        taxRate: 5,
        payerAddress: wallet.publicKey.toBase58(), // You pay the fees
        socials: {
            twitter: '@myaitoken',
            website: 'https://myaitoken.com',
        },
    });

    if (!prepared.success || !prepared.data) {
        console.error('❌ Prepare failed:', prepared.error);
        return;
    }

    console.log('\n📋 Transaction prepared:');
    console.log(`   Mint Address: ${prepared.data.mintAddress}`);
    console.log(`   Estimated Fee: ${prepared.data.estimatedFee} SOL`);

    // Step 2: Sign the transaction with your wallet
    const tx = Transaction.from(Buffer.from(prepared.data.transaction, 'base64'));
    tx.sign(wallet); // In production: await walletAdapter.signTransaction(tx)

    // Step 3: Submit the signed transaction
    const signedBase64 = tx.serialize().toString('base64');
    const result = await client.submitTransaction(signedBase64);

    if (!result.success) {
        console.error('❌ Deployment failed:', result.error);
        return;
    }

    console.log('\n✅ Token deployed successfully!');
    console.log(`   Signature: ${result.data?.signature}`);
    console.log(`   View: https://velociti.fun/token/${prepared.data.mintAddress}`);

    // Check rate limit
    const rateLimit = client.getRateLimitInfo();
    if (rateLimit) {
        console.log(`\n📊 Rate Limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`);
    }
}

main().catch(console.error);
