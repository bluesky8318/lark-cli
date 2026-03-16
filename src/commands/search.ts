import { Command } from 'commander';
import { getClient, withAuthRetry } from '../utils/client.js';
import * as lark from '@larksuiteoapi/node-sdk';

export function registerSearchCommand(program: Command) {
  const searchCmd = program
    .command('search')
    .description('Search for resources');

  // Search Files
  searchCmd
    .command('file')
    .description('Search for files/docs in Drive')
    .requiredOption('--query <query>', 'Search query')
    .option('--page-size <pageSize>', 'Page size', '20')
    .option('--page-token <pageToken>', 'Page token')
    .option('--user-access-token <userAccessToken>', 'User Access Token')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await (client.search as any).dataSourceItem.list({
            data: {
              search_key: options.query,
            },
            params: {
              page_size: parseInt(options.pageSize, 10),
              page_token: options.pageToken,
            }
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error searching files: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`Found ${res.data?.files?.length || 0} files.`);
          res.data?.files?.forEach((file: any) => {
            console.log(`[${file.token}] ${file.name} (${file.type})`);
          });
          if (res.data?.has_more) {
            console.log(`Has more: true, Page Token: ${res.data?.next_page_token}`);
          }
        }
      } catch (error: any) {
        console.error('Failed to search files:', error.message);
        process.exit(1);
      }
    });
}
