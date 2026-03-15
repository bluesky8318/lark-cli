import { Command } from 'commander';
import { updateConfig } from '../utils/config.js';

export function registerAuthCommand(program: Command) {
  const authCmd = program
    .command('auth')
    .description('Manage Lark authentication credentials');

  authCmd
    .command('login')
    .description('Configure Lark App ID and App Secret')
    .requiredOption('--app-id <appId>', 'Lark App ID')
    .requiredOption('--app-secret <appSecret>', 'Lark App Secret')
    .action((options) => {
      const { appId, appSecret } = options;
      updateConfig({ appId, appSecret });
      console.log('✅ Authentication credentials saved successfully to ~/.lark-cli/config.json');
    });
    
  authCmd
    .command('status')
    .description('Check current authentication status')
    .action(() => {
      const { getConfig } = require('../utils/config');
      const config = getConfig();
      const envAppId = process.env.LARK_APP_ID;
      
      const activeAppId = envAppId || config.appId;
      
      if (activeAppId) {
        console.log(`✅ Authenticated. Active App ID: ${activeAppId}`);
        if (envAppId) {
          console.log('ℹ️  Using credentials from environment variables.');
        } else {
          console.log('ℹ️  Using credentials from config file.');
        }
      } else {
        console.log('❌ Not authenticated. Run "lark-cli auth login --app-id <id> --app-secret <secret>"');
      }
    });
}
