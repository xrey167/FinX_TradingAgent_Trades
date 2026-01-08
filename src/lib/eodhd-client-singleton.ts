/**
 * EODHD Client Singleton
 * Ensures cache and rate limits are shared across all tool calls
 */

import { EODHDClient } from './eodhd-client.ts';

let clientInstance: EODHDClient | null = null;

/**
 * Get singleton EODHD client instance
 * Ensures cache and rate limits are shared across all tool calls
 *
 * Note: Uses EODHD_API_KEY environment variable. The singleton pattern
 * means the API key is set once at initialization and cannot be changed
 * without calling resetEODHDClient().
 */
export function getEODHDClient(): EODHDClient {
  if (!clientInstance) {
    const token = process.env.EODHD_API_KEY;
    if (!token) {
      throw new Error('EODHD_API_KEY environment variable not configured. Set it in .env file.');
    }
    clientInstance = new EODHDClient({ apiToken: token });
  }
  return clientInstance;
}

/**
 * Reset singleton (useful for testing)
 */
export function resetEODHDClient(): void {
  clientInstance = null;
}
