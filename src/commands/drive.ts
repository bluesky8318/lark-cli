import { Command } from 'commander';
import { getClient, withAuthRetry } from '../utils/client.js';
import * as lark from '@larksuiteoapi/node-sdk';
import fs from 'fs';
import path from 'path';

export function registerDriveCommand(program: Command) {
  const driveCmd = program
    .command('drive')
    .description('Manage Lark Drive files and folders');

  // List Files
  driveCmd
    .command('list')
    .description('List files in a folder')
    .option('--folder-token <folderToken>', 'Folder token (default: root)')
    .option('--page-size <pageSize>', 'Page size', '50')
    .option('--page-token <pageToken>', 'Page token')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.drive.file.list({
            params: {
              folder_token: options.folderToken,
              page_size: parseInt(options.pageSize, 10),
              page_token: options.pageToken,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error listing files: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`Found ${res.data?.files?.length || 0} files.`);
          res.data?.files?.forEach((file: any) => {
            console.log(`[${file.token}] ${file.name} (${file.type})`);
          });
        }
      } catch (error: any) {
        console.error('Failed to list files:', error.message);
        process.exit(1);
      }
    });

  // Upload File
  driveCmd
    .command('upload')
    .description('Upload a file to a folder')
    .requiredOption('--file-path <filePath>', 'Path to the file to upload')
    .requiredOption('--parent-token <parentToken>', 'Parent folder token')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        if (!fs.existsSync(options.filePath)) {
            console.error(`Error: File not found at ${options.filePath}`);
            process.exit(1);
        }

        const fileName = path.basename(options.filePath);
        const fileContent = fs.readFileSync(options.filePath);
        const fileSize = fs.statSync(options.filePath).size;

        const res = await withAuthRetry(async (token) => {
          return await client.drive.file.uploadAll({
            data: {
              file_name: fileName,
              parent_type: 'explorer',
              parent_node: options.parentToken,
              size: fileSize,
              file: fileContent,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error uploading file: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`✅ File uploaded successfully. File Token: ${res.data?.file_token}`);
        }
      } catch (error: any) {
        console.error('Failed to upload file:', error.message);
        process.exit(1);
      }
    });

  // Download File
  driveCmd
    .command('download')
    .description('Download a file')
    .requiredOption('--file-token <fileToken>', 'File token')
    .requiredOption('--output-path <outputPath>', 'Path to save the downloaded file')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.drive.file.download({
            path: {
              file_token: options.fileToken,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
            console.error(`Error downloading file: [${res.code}] ${res.msg}`);
            process.exit(1);
        }

        // res.writeFile handles writing the buffer/stream to file
        await res.writeFile(options.outputPath);

        if (program.opts().json) {
            console.log(JSON.stringify({ success: true, path: options.outputPath }, null, 2));
        } else {
            console.log(`✅ File downloaded successfully to ${options.outputPath}`);
        }

      } catch (error: any) {
        console.error('Failed to download file:', error.message);
        process.exit(1);
      }
    });

  // Create Folder
  driveCmd
    .command('create-folder')
    .description('Create a new folder')
    .requiredOption('--name <name>', 'Folder name')
    .requiredOption('--parent-token <parentToken>', 'Parent folder token')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          // Note: create folder is generally under drive.file.createFolder or similar in some SDK versions
          // The exact path depends on SDK version, fallback to generic approach or check SDK docs
          // Usually it's drive.file.createFolder
          return await client.drive.file.createFolder({
            data: {
              name: options.name,
              folder_token: options.parentToken,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error creating folder: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`✅ Folder created successfully. Token: ${res.data?.token}`);
          console.log(`URL: ${res.data?.url}`);
        }
      } catch (error: any) {
        console.error('Failed to create folder:', error.message);
        process.exit(1);
      }
    });
}
