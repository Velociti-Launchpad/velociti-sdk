/**
 * Node.js Trading Bot Example
 * 
 * This example shows how to build an automated trading bot
 * that monitors token prices and executes trades via the VELOCITI SDK.
 * 
 * Features:
 * - Price monitoring with polling
 * - Automatic fee claiming
 * - Webhook integration
 * - Discord/Telegram notifications
 */

import { VelocitiClient } from '@velociti/sdk';
import { Keypair, Transaction } from '@solana/web3.js';
import * as fs from 'fs';

// Configuration
const CONFIG = {
    apiKey: process.env.VELOCITI_API_KEY || 'your-api-key',
    network: 'mainnet' as const,
    walletPath: process.env.WALLET_PATH || '~/.config/solana/id.json',

    // Monitoring settings
    pollIntervalMs: 30000, // Check every 30 seconds

    // Token to monitor (set this after deploying)
    mintAddress: process.env.MINT_ADDRESS || '',

    // Auto-claim settings
    autoClaimFees: true,
    minClaimThreshold: 0.1, // Minimum SOL value before claiming

    // Notification settings
    discordWebhook: process.env.DISCORD_WEBHOOK || '',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
};

// Initialize client
const client = new VelocitiClient({
    apiKey: CONFIG.apiKey,
    network: CONFIG.network,
    enableRetry: true,
    maxRetries: 3,
});

// Load wallet
function loadWallet(): Keypair {
    const keyPath = CONFIG.walletPath.replace('~', process.env.HOME || '');
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(keyData));
}

// Sign transaction helper
async function signTransaction(wallet: Keypair, txBytes: Uint8Array): Promise<Uint8Array> {
    const tx = Transaction.from(txBytes);
    tx.sign(wallet);
    return tx.serialize();
}

// Send Discord notification
async function notifyDiscord(message: string) {
    if (!CONFIG.discordWebhook) return;

    try {
        await fetch(CONFIG.discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message }),
        });
    } catch (err) {
        console.error('Discord notification failed:', err);
    }
}

// Send Telegram notification
async function notifyTelegram(message: string) {
    if (!CONFIG.telegramBotToken || !CONFIG.telegramChatId) return;

    try {
        await fetch(`https://api.telegram.org/bot${CONFIG.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CONFIG.telegramChatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });
    } catch (err) {
        console.error('Telegram notification failed:', err);
    }
}

// Send notification to all channels
async function notify(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`);
    await Promise.all([
        notifyDiscord(message),
        notifyTelegram(message),
    ]);
}

// Monitor token prices
async function monitorToken() {
    if (!CONFIG.mintAddress) {
        console.log('No mint address configured. Set MINT_ADDRESS env var.');
        return;
    }

    console.log(`\n📊 Fetching token info for ${CONFIG.mintAddress}...`);

    const tokenResult = await client.getToken(CONFIG.mintAddress);
    if (!tokenResult.success || !tokenResult.data) {
        console.error('Failed to fetch token:', tokenResult.error);
        return;
    }

    const token = tokenResult.data;
    console.log(`
Token: ${token.name} (${token.symbol})
Price: ${token.priceInSol} SOL ($${token.priceInUsd.toFixed(4)})
Market Cap: $${token.marketCapUsd.toFixed(2)}
Progress: ${token.progress}%
Graduated: ${token.isGraduated ? 'Yes ✅' : 'No'}
    `);

    // Check for graduation
    if (token.isGraduated) {
        await notify(`🎓 ${token.name} has graduated to Raydium!`);
    }

    // Fetch analytics
    const analyticsResult = await client.getTokenAnalytics(CONFIG.mintAddress);
    if (analyticsResult.success && analyticsResult.data) {
        const analytics = analyticsResult.data;
        console.log(`
24h Volume: ${analytics.volume24h} SOL
24h Change: ${analytics.priceChange24h > 0 ? '+' : ''}${analytics.priceChange24h.toFixed(2)}%
Holders: ${analytics.holders}
Trades: ${analytics.trades}
        `);

        // Alert on significant price change
        if (Math.abs(analytics.priceChange24h) > 20) {
            const direction = analytics.priceChange24h > 0 ? '📈' : '📉';
            await notify(`${direction} ${token.name} moved ${analytics.priceChange24h.toFixed(1)}% in 24h!`);
        }
    }
}

// Auto-claim fees
async function checkAndClaimFees(wallet: Keypair) {
    if (!CONFIG.autoClaimFees || !CONFIG.mintAddress) return;

    console.log('\n💰 Checking unclaimed fees...');

    const feesResult = await client.getUnclaimedFees(CONFIG.mintAddress);
    if (!feesResult.success || !feesResult.data) {
        console.log('No fees to claim or error:', feesResult.error);
        return;
    }

    const { amount, valueInSol } = feesResult.data;
    console.log(`Unclaimed: ${amount} tokens (~${valueInSol} SOL)`);

    if (valueInSol >= CONFIG.minClaimThreshold) {
        console.log('Claiming fees...');

        const claimResult = await client.claimFees(
            CONFIG.mintAddress,
            wallet.publicKey.toBase58(),
            (txBytes) => signTransaction(wallet, txBytes)
        );

        if (claimResult.success && claimResult.data) {
            await notify(`💰 Claimed ${claimResult.data.amountClaimed} tokens (~${claimResult.data.valueInSol} SOL)!`);
        } else {
            console.error('Claim failed:', claimResult.error);
        }
    }
}

// Deploy a new token
async function deployToken(wallet: Keypair, name: string, symbol: string, taxRate = 5) {
    console.log(`\n🚀 Deploying token: ${name} (${symbol})`);

    const result = await client.deployToken(
        {
            name,
            symbol,
            description: 'Deployed via VELOCITI Bot',
            taxRate,
            payerAddress: wallet.publicKey.toBase58(),
        },
        (txBytes) => signTransaction(wallet, txBytes)
    );

    if (result.success && result.data) {
        await notify(`✅ Deployed ${name} (${symbol})!\nView: https://velociti.fun/token/${result.data.signature}`);
        return result.data;
    } else {
        console.error('Deploy failed:', result.error);
        return null;
    }
}

// Main loop
async function main() {
    console.log(`
╔═══════════════════════════════════════╗
║       VELOCITI Trading Bot            ║
║       velociti.fun                    ║
╚═══════════════════════════════════════╝
    `);

    const wallet = loadWallet();
    console.log(`Wallet: ${wallet.publicKey.toBase58()}`);

    // Validate API key
    const validation = await client.validateApiKey();
    if (!validation.success) {
        console.error('Invalid API key!');
        process.exit(1);
    }
    console.log(`API Key valid. Tier: ${validation.data?.tier}`);

    // Check rate limits
    const rateLimit = client.getRateLimitInfo();
    if (rateLimit) {
        console.log(`Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`);
    }

    // Start monitoring loop
    console.log(`\nStarting monitoring (every ${CONFIG.pollIntervalMs / 1000}s)...`);

    while (true) {
        try {
            await monitorToken();
            await checkAndClaimFees(wallet);
        } catch (err) {
            console.error('Error in monitoring loop:', err);
        }

        await new Promise(resolve => setTimeout(resolve, CONFIG.pollIntervalMs));
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    process.exit(0);
});

main().catch(console.error);
