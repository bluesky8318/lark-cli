import { Command } from 'commander';
import { getClient, withAuthRetry } from '../utils/client.js';
import * as lark from '@larksuiteoapi/node-sdk';

export function registerSheetCommand(program: Command) {
  const sheetCmd = program
    .command('sheet')
    .description('Manage Lark Sheets');

  sheetCmd
    .command('create')
    .description('Create a new spreadsheet')
    .option('--title <title>', 'Spreadsheet title')
    .option('--folder-token <folderToken>', 'Folder token where the sheet will be created')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.sheets.spreadsheet.create({
            data: {
              title: options.title,
              folder_token: options.folderToken,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error creating sheet: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`✅ Spreadsheet created successfully.`);
          console.log(`Spreadsheet Token: ${res.data?.spreadsheet?.spreadsheet_token}`);
          console.log(`URL: ${res.data?.spreadsheet?.url}`);
        }
      } catch (error: any) {
        console.error('Failed to create sheet:', error.message);
        process.exit(1);
      }
    });

  sheetCmd
    .command('meta')
    .description('Get spreadsheet metadata')
    .requiredOption('--spreadsheet-token <spreadsheetToken>', 'Spreadsheet Token')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.sheets.spreadsheet.get({
            path: {
              spreadsheet_token: options.spreadsheetToken,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error getting sheet meta: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`✅ Spreadsheet metadata retrieved successfully.`);
          console.log(`Title: ${res.data?.spreadsheet?.title}`);
          console.log(`Owner ID: ${res.data?.spreadsheet?.owner_id}`);
          console.log(`Token: ${res.data?.spreadsheet?.spreadsheet_token}`);
          console.log(`URL: ${res.data?.spreadsheet?.url}`);
        }
      } catch (error: any) {
        console.error('Failed to get sheet meta:', error.message);
        process.exit(1);
      }
    });
}
