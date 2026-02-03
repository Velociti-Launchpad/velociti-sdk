# Getting Started with VELOCITI SDK

This guide will help you set up and deploy your first token using the VELOCITI SDK.

## Prerequisites

- Node.js 18+
- npm or yarn
- A VELOCITI API key

## Step 1: Get Your API Key

1. Visit [velociti.fun/developers](https://velociti.fun/developers)
2. Fill out the access request form with:
   - Your name and email
   - Project name and description
   - Intended use case
3. Wait for approval (usually within 24 hours)
4. Check your email for your API key

## Step 2: Install the SDK

```bash
npm install @velociti/sdk
```

## Step 3: Initialize the Client

```typescript
import { VelocitiClient } from '@velociti/sdk';

const client = new VelocitiClient({
  apiKey: process.env.VELOCITI_API_KEY,
  network: 'devnet' // Start with devnet for testing
});
```

## Step 4: Deploy Your First Token

```typescript
const result = await client.deployToken({
  name: 'My First Token',
  symbol: 'MFT',
  description: 'My first token on VELOCITI',
  taxRate: 5, // 5% transfer tax
});

if (result.success) {
  console.log('Token deployed!', result.data?.mintAddress);
} else {
  console.error('Failed:', result.error);
}
```

## Step 5: Monitor and Claim Fees

```typescript
// Check unclaimed fees
const fees = await client.getUnclaimedFees(result.data.mintAddress);
console.log('Unclaimed fees:', fees.data?.amount);

// Claim fees to your wallet
const claim = await client.claimFees(
  result.data.mintAddress,
  'YourWalletAddress...'
);
```

## Next Steps

- Explore the [API Reference](./api-reference.md)
- Check out [examples](../examples/)
- Join our [Discord](https://discord.gg/velociti) for support
