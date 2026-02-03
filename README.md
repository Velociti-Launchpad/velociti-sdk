# VELOCITI SDK

Official SDK for deploying and managing tax tokens on [VELOCITI](https://velociti.xyz) - the Solana Token-2022 launchpad with built-in transfer taxes.

## Features

- 🚀 **Deploy tokens** with configurable transfer taxes
- 💰 **Claim fees** accumulated from token transfers
- 📊 **Track tokens** and monitor performance
- ⚡ **Rate-limited API** with tiered access

## Installation

```bash
npm install @velociti/sdk
# or
yarn add @velociti/sdk
```

## Quick Start

```typescript
import { VelocitiClient } from '@velociti/sdk';

const client = new VelocitiClient({
  apiKey: 'your-api-key', // Get at velociti.xyz/developers
  network: 'mainnet'      // or 'devnet'
});

// Deploy a new token
const token = await client.deployToken({
  name: 'My Token',
  symbol: 'MTK',
  description: 'A token with built-in tax',
  taxRate: 5, // 5% transfer tax
  socials: {
    twitter: '@mytoken',
    website: 'https://mytoken.com'
  }
});

console.log(`Token deployed: ${token.data?.mintAddress}`);
```

## API Reference

### `VelocitiClient`

#### Constructor

```typescript
new VelocitiClient({
  apiKey: string;           // Required: Your API key
  network?: 'mainnet' | 'devnet';  // Optional: Default 'mainnet'
  baseUrl?: string;         // Optional: Custom API URL
})
```

### Methods

#### `deployToken(params)`

Deploy a new token on VELOCITI.

```typescript
await client.deployToken({
  name: string;          // Token name (max 32 chars)
  symbol: string;        // Token symbol (max 10 chars)
  description?: string;  // Token description
  image?: string;        // Image URL (IPFS/Arweave/HTTPS)
  taxRate?: number;      // Transfer tax 0-10% (default: 5)
  socials?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  }
});
```

#### `getToken(mintAddress)`

Get token information.

```typescript
const token = await client.getToken('TokenMintAddress...');
```

#### `getMyTokens()`

Get all tokens created with your API key.

```typescript
const tokens = await client.getMyTokens();
```

#### `claimFees(mintAddress, walletAddress)`

Claim accumulated transfer fees.

```typescript
const result = await client.claimFees(
  'TokenMintAddress...',
  'YourWalletAddress...'
);
```

#### `getUnclaimedFees(mintAddress)`

Check unclaimed fees for a token.

```typescript
const fees = await client.getUnclaimedFees('TokenMintAddress...');
console.log(`Unclaimed: ${fees.data?.amount} tokens`);
```

## Rate Limits

| Tier | Requests/Day | Token Deploys/Day | Price |
|------|--------------|-------------------|-------|
| Free | 100 | 5 | $0 |
| Pro | 1,000 | 50 | $49/mo |
| Enterprise | Unlimited | Unlimited | Contact |

Check your rate limit status:

```typescript
const rateLimit = client.getRateLimitInfo();
console.log(`${rateLimit.remaining}/${rateLimit.limit} remaining`);
```

## Get Your API Key

1. Visit [velociti.xyz/developers](https://velociti.xyz/developers)
2. Fill out the access request form
3. Wait for approval (usually within 24 hours)
4. Receive your API key via email

## Links

- [VELOCITI Website](https://velociti.xyz)
- [Documentation](https://docs.velociti.xyz)
- [Twitter](https://twitter.com/velocitixyz)
- [Discord](https://discord.gg/velociti)

## License

MIT
