import * as lark from '@larksuiteoapi/node-sdk';
import { getConfig } from './config.js';

let clientInstance: lark.Client | null = null;

export function getClient(): lark.Client {
  if (clientInstance) {
    return clientInstance;
  }

  const config = getConfig();
  const appId = process.env.LARK_APP_ID || config.appId;
  const appSecret = process.env.LARK_APP_SECRET || config.appSecret;

  if (!appId || !appSecret) {
    console.error('Error: Lark App ID and App Secret are not configured.');
    console.error('Please run "lark-cli auth login" or set LARK_APP_ID and LARK_APP_SECRET environment variables.');
    process.exit(1);
  }

  clientInstance = new lark.Client({
    appId,
    appSecret,
    disableTokenCache: false,
  });

  return clientInstance;
}

// Re-export auth utils for easier access in commands
export { withAuthRetry } from './auth.js';
