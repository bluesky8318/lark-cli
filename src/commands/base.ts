import { Command } from 'commander';
import { getClient, withAuthRetry } from '../utils/client.js';
import * as lark from '@larksuiteoapi/node-sdk';

export function registerBaseCommand(program: Command) {
  const baseCmd = program
    .command('base')
    .description('Manage Lark Bitable (Base)');

  baseCmd
    .command('list')
    .description('List Bitable apps in a folder')
    .option('--folder-token <folderToken>', 'Folder token')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.drive.file.list({
            params: {
              folder_token: options.folderToken || '',
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error listing bases: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          const bases = res.data?.files?.filter((f: any) => f.type === 'bitable') || [];
          console.log(`Found ${bases.length} Bitable apps.`);
          bases.forEach((b: any) => {
            console.log(`[${b.token}] ${b.name}`);
          });
        }
      } catch (error: any) {
        console.error('Failed to list bases:', error.message);
        process.exit(1);
      }
    });

  const tableCmd = baseCmd
    .command('table')
    .description('Manage tables within a Bitable app');

  tableCmd
    .command('list')
    .description('List tables in a Bitable app')
    .requiredOption('--app-token <appToken>', 'Bitable App Token')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.bitable.appTable.list({
            path: {
              app_token: options.appToken,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error listing tables: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`Found ${res.data?.items?.length || 0} tables.`);
          res.data?.items?.forEach((t: any) => {
            console.log(`[${t.table_id}] ${t.name}`);
          });
        }
      } catch (error: any) {
        console.error('Failed to list tables:', error.message);
        process.exit(1);
      }
    });

  const recordCmd = baseCmd
    .command('record')
    .description('Manage records within a Bitable table');

  recordCmd
    .command('list')
    .description('List records in a Bitable table')
    .requiredOption('--app-token <appToken>', 'Bitable App Token')
    .requiredOption('--table-id <tableId>', 'Table ID')
    .option('--page-size <pageSize>', 'Page size', '50')
    .option('--page-token <pageToken>', 'Page token')
    .option('--filter <filter>', 'Filter string (JSON)')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        let filterObj = undefined;
        if (options.filter) {
          try {
            filterObj = JSON.parse(options.filter);
          } catch (e) {
            console.error('Invalid filter JSON string');
            process.exit(1);
          }
        }

        const res = await withAuthRetry(async (token) => {
          return await client.bitable.appTableRecord.search({
            path: {
              app_token: options.appToken,
              table_id: options.tableId,
            },
            params: {
              page_size: parseInt(options.pageSize, 10),
              page_token: options.pageToken,
            },
            data: {
              filter: filterObj,
            }
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error listing records: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`Found ${res.data?.items?.length || 0} records.`);
          res.data?.items?.forEach((r: any) => {
            console.log(`[${r.record_id}] ${JSON.stringify(r.fields)}`);
          });
        }
      } catch (error: any) {
        console.error('Failed to list records:', error.message);
        process.exit(1);
      }
    });

  recordCmd
    .command('create')
    .description('Create a record in a Bitable table')
    .requiredOption('--app-token <appToken>', 'Bitable App Token')
    .requiredOption('--table-id <tableId>', 'Table ID')
    .requiredOption('--fields <fields>', 'Fields JSON string')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        let fieldsObj = {};
        try {
          fieldsObj = JSON.parse(options.fields);
        } catch (e) {
          console.error('Invalid fields JSON string');
          process.exit(1);
        }

        const res = await withAuthRetry(async (token) => {
          return await client.bitable.appTableRecord.create({
            path: {
              app_token: options.appToken,
              table_id: options.tableId,
            },
            data: {
              fields: fieldsObj,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error creating record: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`✅ Record created successfully.`);
          console.log(`Record ID: ${res.data?.record?.record_id}`);
        }
      } catch (error: any) {
        console.error('Failed to create record:', error.message);
        process.exit(1);
      }
    });
}
