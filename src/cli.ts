#!/usr/bin/env node
/**
 * VELOCITI CLI Tool
 * Deploy and manage tokens from the command line
 * 
 * Usage:
 *   npx @velociti/sdk deploy --name "MyToken" --symbol "MTK"
 *   npx @velociti/sdk tokens
 *   npx @velociti/sdk analytics <mintAddress>
 */

import { VelocitiClient } from './client';
import { Keypair, Connection, Transaction } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
    log(`✅ ${message}`, colors.green);
}

function error(message: string) {
    log(`❌ ${message}`, colors.red);
}

function info(message: string) {
    log(`ℹ️  ${message}`, colors.cyan);
}

function banner() {
    console.log(colors.magenta + `
╔═══════════════════════════════════════╗
║         VELOCITI CLI v0.1.0           ║
║   Solana Tax Token Launchpad          ║
╚═══════════════════════════════════════╝
` + colors.reset);
}

// Parse command line arguments
function parseArgs(args: string[]): Record<string, string | boolean> {
    const parsed: Record<string, string | boolean> = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const next = args[i + 1];
            if (next && !next.startsWith('--')) {
                parsed[key] = next;
                i++;
            } else {
                parsed[key] = true;
            }
        } else if (!parsed._command) {
            parsed._command = arg;
        } else if (!parsed._arg) {
            parsed._arg = arg;
        }
    }
    return parsed;
}

// Load API key from env or config file
function loadApiKey(): string | null {
    // Check environment variable first
    if (process.env.VELOCITI_API_KEY) {
        return process.env.VELOCITI_API_KEY;
    }

    // Check config file
    const configPath = path.join(process.env.HOME || '', '.velociti', 'config.json');
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            return config.apiKey || null;
        } catch {
            return null;
        }
    }

    return null;
}

// Load wallet keypair from file
function loadWallet(walletPath?: string): Keypair | null {
    const keyPath = walletPath ||
        process.env.VELOCITI_WALLET ||
        path.join(process.env.HOME || '', '.config', 'solana', 'id.json');

    if (!fs.existsSync(keyPath)) {
        return null;
    }

    try {
        const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
        return Keypair.fromSecretKey(Uint8Array.from(keyData));
    } catch {
        return null;
    }
}

// Save API key to config
function saveApiKey(apiKey: string) {
    const configDir = path.join(process.env.HOME || '', '.velociti');
    const configPath = path.join(configDir, 'config.json');

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    let config: Record<string, string> = {};
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    config.apiKey = apiKey;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Commands
async function deploy(args: Record<string, string | boolean>) {
    const apiKey = loadApiKey();
    if (!apiKey) {
        error('No API key found. Run: velociti config --api-key YOUR_KEY');
        process.exit(1);
    }

    const wallet = loadWallet(args.wallet as string);
    if (!wallet) {
        error('No wallet found. Set VELOCITI_WALLET or use --wallet path/to/keypair.json');
        process.exit(1);
    }

    const name = args.name as string;
    const symbol = args.symbol as string;
    const description = args.description as string || '';
    const taxRate = parseFloat(args.tax as string) || 5;
    const network = (args.network as string) === 'mainnet' ? 'mainnet' : 'devnet';

    if (!name || !symbol) {
        error('Missing required arguments: --name and --symbol');
        process.exit(1);
    }

    info(`Deploying token: ${name} (${symbol})`);
    info(`Network: ${network}`);
    info(`Tax rate: ${taxRate}%`);
    info(`Wallet: ${wallet.publicKey.toBase58()}`);

    const client = new VelocitiClient({ apiKey, network });

    const prepared = await client.prepareTokenDeploy({
        name,
        symbol,
        description,
        taxRate,
        payerAddress: wallet.publicKey.toBase58(),
    });

    if (!prepared.success || !prepared.data) {
        error(`Failed to prepare: ${prepared.error}`);
        process.exit(1);
    }

    info(`Estimated fee: ${prepared.data.estimatedFee} SOL`);
    info(`Mint address: ${prepared.data.mintAddress}`);

    // Sign transaction
    const tx = Transaction.from(Buffer.from(prepared.data.transaction, 'base64'));
    tx.sign(wallet);
    const signedTx = tx.serialize().toString('base64');

    // Submit
    info('Submitting transaction...');
    const result = await client.submitTransaction(signedTx);

    if (result.success) {
        success(`Token deployed successfully!`);
        log(`  Signature: ${result.data?.signature}`, colors.cyan);
        log(`  View: https://velociti.fun/token/${prepared.data.mintAddress}`, colors.cyan);
    } else {
        error(`Deployment failed: ${result.error}`);
        process.exit(1);
    }
}

async function listTokens(args: Record<string, string | boolean>) {
    const apiKey = loadApiKey();
    if (!apiKey) {
        error('No API key found. Run: velociti config --api-key YOUR_KEY');
        process.exit(1);
    }

    const network = (args.network as string) === 'mainnet' ? 'mainnet' : 'devnet';
    const client = new VelocitiClient({ apiKey, network });

    info('Fetching your tokens...');
    const result = await client.getMyTokens();

    if (!result.success || !result.data) {
        error(`Failed: ${result.error}`);
        process.exit(1);
    }

    if (result.data.length === 0) {
        info('No tokens found. Deploy one with: velociti deploy --name "MyToken" --symbol "MTK"');
        return;
    }

    console.log('\nYour tokens:\n');
    for (const token of result.data) {
        console.log(colors.bright + token.name + colors.reset + ` (${token.symbol})`);
        console.log(`  Mint: ${token.mintAddress}`);
        console.log(`  Price: ${token.priceInSol} SOL ($${token.priceInUsd.toFixed(4)})`);
        console.log(`  Progress: ${token.progress}%${token.isGraduated ? ' ✅ Graduated' : ''}`);
        console.log('');
    }
}

async function analytics(args: Record<string, string | boolean>) {
    const apiKey = loadApiKey();
    if (!apiKey) {
        error('No API key found. Run: velociti config --api-key YOUR_KEY');
        process.exit(1);
    }

    const mintAddress = args._arg as string;
    if (!mintAddress) {
        error('Usage: velociti analytics <mintAddress>');
        process.exit(1);
    }

    const network = (args.network as string) === 'mainnet' ? 'mainnet' : 'devnet';
    const client = new VelocitiClient({ apiKey, network });

    info(`Fetching analytics for ${mintAddress}...`);
    const result = await client.getTokenAnalytics(mintAddress);

    if (!result.success || !result.data) {
        error(`Failed: ${result.error}`);
        process.exit(1);
    }

    const data = result.data;
    console.log('\n' + colors.bright + 'Token Analytics' + colors.reset);
    console.log('═'.repeat(40));
    console.log(`24h Volume:     ${data.volume24h} SOL`);
    console.log(`24h Change:     ${data.priceChange24h > 0 ? '+' : ''}${data.priceChange24h.toFixed(2)}%`);
    console.log(`Holders:        ${data.holders}`);
    console.log(`Total Trades:   ${data.trades}`);
    console.log(`All-Time High:  ${data.allTimeHigh} SOL`);
    console.log(`All-Time Low:   ${data.allTimeLow} SOL`);
    console.log('');
}

async function configCmd(args: Record<string, string | boolean>) {
    if (args['api-key']) {
        saveApiKey(args['api-key'] as string);
        success('API key saved to ~/.velociti/config.json');
    } else {
        const apiKey = loadApiKey();
        if (apiKey) {
            info(`Current API key: ${apiKey.slice(0, 12)}...`);
        } else {
            info('No API key configured');
            info('Set one with: velociti config --api-key YOUR_KEY');
        }
    }
}

function help() {
    console.log(`
${colors.bright}Commands:${colors.reset}

  ${colors.cyan}deploy${colors.reset}     Deploy a new token
             --name "Token Name"    (required)
             --symbol "SYM"         (required)
             --description "..."    (optional)
             --tax 5                (optional, default: 5%)
             --network devnet        (optional, default: devnet)
             --wallet path/to/key   (optional)

  ${colors.cyan}tokens${colors.reset}     List your deployed tokens

  ${colors.cyan}analytics${colors.reset}  Get token analytics
             velociti analytics <mintAddress>

  ${colors.cyan}config${colors.reset}     Configure CLI
             --api-key YOUR_KEY     Save API key

  ${colors.cyan}help${colors.reset}       Show this help message

${colors.bright}Environment:${colors.reset}

  VELOCITI_API_KEY    Your API key
  VELOCITI_WALLET     Path to wallet keypair file

${colors.bright}Examples:${colors.reset}

  velociti config --api-key vel_abc123...
  velociti deploy --name "Moon Token" --symbol "MOON" --tax 3
  velociti tokens
  velociti analytics 7xKXtg...
`);
}

// Main
async function main() {
    const args = parseArgs(process.argv.slice(2));
    const command = args._command as string;

    if (!command || command === 'help' || args.help) {
        banner();
        help();
        return;
    }

    banner();

    switch (command) {
        case 'deploy':
            await deploy(args);
            break;
        case 'tokens':
        case 'list':
            await listTokens(args);
            break;
        case 'analytics':
            await analytics(args);
            break;
        case 'config':
            await configCmd(args);
            break;
        default:
            error(`Unknown command: ${command}`);
            help();
            process.exit(1);
    }
}

main().catch(err => {
    error(err.message);
    process.exit(1);
});
