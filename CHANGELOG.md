# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-03

### Added
- **Retry Logic**: Automatic retry with exponential backoff for failed requests
  - Configurable via `enableRetry`, `maxRetries`, and `retryDelay` options
  - Handles rate limiting (429) and server errors (5xx) automatically

- **Batch Deploy**: Deploy multiple tokens in a single API call
  - `prepareBatchDeploy()` method for batch token creation
  - Maximum 10 tokens per batch

- **Token Analytics**: Get detailed analytics for any token
  - `getTokenAnalytics()` for volume, holders, trades, ATH/ATL
  - `getPriceHistory()` for historical price data

- **Webhooks**: Real-time event notifications
  - `registerWebhook()` to subscribe to token events
  - Events: token.created, token.graduated, token.trade, fees.claimed, fees.available
  - `listWebhooks()`, `deleteWebhook()`, `testWebhook()` management methods

- **CLI Tool**: Deploy from command line
  - `npx @velociti/sdk deploy --name "MyToken" --symbol "MTK"`
  - `npx @velociti/sdk tokens` - list your tokens
  - `npx @velociti/sdk analytics <mintAddress>` - view token analytics
  - `npx @velociti/sdk config --api-key YOUR_KEY` - save API key

- **React Hooks**: Easy integration with React apps
  - `useVelocitiDeploy()` - deploy tokens with wallet adapter
  - `useVelocitiToken()` - fetch token info
  - `useVelocitiAnalytics()` - fetch analytics
  - `useVelocitiMyTokens()` - list user's tokens
  - `useVelocitiFees()` - claim fees

- **Examples**:
  - `examples/trading-bot.ts` - Automated trading bot with price monitoring
  - Discord/Telegram notifications support

### Changed
- Improved error handling with more descriptive messages
- Better TypeScript types for all API responses

## [0.1.0] - 2026-02-03

### Added
- Initial release
- `VelocitiClient` class for API interaction
- `prepareTokenDeploy()` - prepare token deployment transaction
- `submitTransaction()` - submit signed transaction
- `deployToken()` - convenience method for full deployment flow
- `getToken()` - fetch token info by mint address
- `getMyTokens()` - list tokens created with API key
- `prepareClaimFees()` - prepare fee claim transaction
- `claimFees()` - claim accumulated transfer fees
- `getRateLimitInfo()` - check rate limit status
- Full TypeScript support with type definitions
- MIT License
