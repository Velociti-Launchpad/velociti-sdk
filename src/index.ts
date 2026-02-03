/**
 * VELOCITI SDK
 * Official SDK for deploying and managing tokens on VELOCITI
 * 
 * @example
 * ```typescript
 * import { VelocitiClient } from '@velociti/sdk';
 * 
 * const client = new VelocitiClient({
 *   apiKey: 'your-api-key',
 *   network: 'devnet'
 * });
 * 
 * const token = await client.deployToken({
 *   name: 'My Token',
 *   symbol: 'MTK',
 *   taxRate: 5
 * });
 * ```
 * 
 * @packageDocumentation
 */

export { VelocitiClient } from './client';
export * from './types';

// React hooks (for client-side use)
export * from './react';
