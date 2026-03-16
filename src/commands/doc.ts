import { Command } from 'commander';
import { getClient, withAuthRetry } from '../utils/client.js';
import * as lark from '@larksuiteoapi/node-sdk';

export function registerDocCommand(program: Command) {
  const docCmd = program
    .command('doc')
    .description('Manage Lark Docs');

  docCmd
    .command('create')
    .description('Create a new document')
    .option('--title <title>', 'Document title')
    .option('--folder-token <folderToken>', 'Folder token where the doc will be created')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.docx.document.create({
            data: {
              title: options.title,
              folder_token: options.folderToken,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error creating doc: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`✅ Document created successfully.`);
          console.log(`Document ID: ${res.data?.document?.document_id}`);
          console.log(`Revision ID: ${res.data?.document?.revision_id}`);
        }
      } catch (error: any) {
        console.error('Failed to create doc:', error.message);
        process.exit(1);
      }
    });

  docCmd
    .command('raw-content')
    .description('Get raw text content of a document')
    .requiredOption('--document-id <documentId>', 'Document ID')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.docx.document.rawContent({
            path: {
              document_id: options.documentId,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          if (res.code === 99991668 || res.code === 99991663 || res.code === 99991664) {
             console.error(`❌ User Access Token is invalid or expired.`);
             console.error(`Please update it by running: lark-cli auth login --user-access-token <new_token>`);
             console.error(`Get new token here: https://open.feishu.cn/api-explorer/cli_a5e0b53368b8d00b?apiName=raw_content&project=docx&resource=document&version=v1`);
          } else {
            console.error(`Error getting doc content: [${res.code}] ${res.msg}`);
          }
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(res.data?.content);
        }
      } catch (error: any) {
        console.error('Failed to get doc content:', error.message);
        process.exit(1);
      }
    });
}
