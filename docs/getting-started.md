# Getting Started with @velociti/sdk

The official SDK for deploying and managing tokens on VELOCITI - the Solana tax token launchpad.

## Installation

```bash
npm install @velociti/sdk
```

## Get Your API Key

1. Visit [velociti.fun/developers](https://velociti.fun/developers)
2. Fill out the access request form
3. Wait for approval (usually within 24 hours)
4. Your API key will be sent to your email

## Quick Start

```typescript
import { VelocitiClient } from '@velociti/sdk';

// Initialize the client
const client = new VelocitiClient({
  apiKey: 'your-api-key',
  network: 'mainnet' // or 'devnet'
});

// Step 1: Prepare the transaction
const prepared = await client.prepareTokenDeploy({
  name: 'My Token',
  symbol: 'MTK',
  description: 'A token deployed via SDK',
  taxRate: 5, // 5% transfer tax
  payerAddress: 'YourWalletAddress...' // You pay the fees
});

if (!prepared.success) {
  console.error(prepared.error);
  return;
}

console.log('Estimated fee:', prepared.data.estimatedFee, 'SOL');
console.log('Mint address:', prepared.data.mintAddress);

// Step 2: Sign with your wallet
const tx = Transaction.from(Buffer.from(prepared.data.transaction, 'base64'));
const signedTx = await wallet.signTransaction(tx);

// Step 3: Submit the signed transaction
const result = await client.submitTransaction(signedTx.serialize().toString('base64'));

if (result.success) {
  console.log('Token deployed!', result.data.signature);
}
```

## Authentication Flow

All API requests require an approved API key passed in the `X-API-Key` header. The SDK handles this automatically.

```
┌─────────────────────────────────────────────┐
│  1. Request API key at velociti.fun/developers
│  2. Wait for approval (email notification)
│  3. Use key in SDK: new VelocitiClient({ apiKey })
│  4. SDK sends key in X-API-Key header
│  5. Server validates and rate-limits requests
└─────────────────────────────────────────────┘
```

## Rate Limits

| Tier | Requests/Day | Deploys/Day | Price |
|------|-------------|-------------|-------|
| Free | 100 | 5 | $0 |
| Pro | 1,000 | 50 | $49/mo |
| Enterprise | Unlimited | Unlimited | Contact |

## Transaction Flow

The SDK uses a prepare/sign/submit flow so **you pay all blockchain fees**:

1. **Prepare** - API builds the transaction with all program addresses (hidden from you)
2. **Sign** - You sign with your wallet (you become the fee payer)
3. **Submit** - API sends the signed transaction to Solana

This means:
- ✅ You control your wallet
- ✅ You pay ~0.02 SOL per deploy
- ✅ No private keys leave your device
- ✅ Program addresses stay private

## API Methods

### `prepareTokenDeploy(params)`
Prepare a token deployment transaction.

### `submitTransaction(signedTx)`
Submit a signed transaction.

### `getToken(mintAddress)`
Get token info by mint address.

### `getMyTokens()`
Get all tokens created with your API key.

### `prepareClaimFees(mintAddress, walletAddress)`
Prepare a fee claim transaction.

### `getRateLimitInfo()`
Check your current rate limit status.

## Support

- Website: [velociti.fun](https://velociti.fun)
- GitHub: [Velociti-Launchpad/velociti-sdk](https://github.com/Velociti-Launchpad/velociti-sdk)
- API Docs: [velociti.fun/developers](https://velociti.fun/developers)
