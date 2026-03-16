import { Command } from 'commander';
import { getClient, withAuthRetry } from '../utils/client.js';
import * as lark from '@larksuiteoapi/node-sdk';

export function registerMessageCommand(program: Command) {
  const messageCmd = program
    .command('message')
    .description('Manage Lark messages');

  messageCmd
    .command('send')
    .description('Send a message to a user or chat')
    .requiredOption('--receive-id <receiveId>', 'The ID of the receiver (e.g., user open_id or chat_id)')
    .requiredOption('--receive-id-type <receiveIdType>', 'Type of receive_id: open_id, user_id, union_id, email, chat_id')
    .requiredOption('--content <content>', 'Message content (JSON string)')
    .option('--msg-type <msgType>', 'Message type: text, post, image, file, audio, media, sticker, interactive, share_chat, share_user', 'text')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.im.message.create({
            params: {
              receive_id_type: options.receiveIdType,
            },
            data: {
              receive_id: options.receiveId,
              content: options.content,
              msg_type: options.msgType,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error sending message: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`✅ Message sent successfully. Message ID: ${res.data?.message_id}`);
        }
      } catch (error: any) {
        console.error('Failed to send message:', error.message);
        process.exit(1);
      }
    });

  messageCmd
    .command('list')
    .description('List messages in a chat')
    .requiredOption('--container-id <containerId>', 'Container ID (e.g. chat_id)')
    .option('--container-id-type <containerIdType>', 'Container ID type', 'chat')
    .option('--page-size <pageSize>', 'Page size', '50')
    .option('--page-token <pageToken>', 'Page token')
    .option('--start-time <startTime>', 'Start time (unix timestamp)')
    .option('--end-time <endTime>', 'End time (unix timestamp)')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.im.message.list({
            params: {
              container_id_type: options.containerIdType,
              container_id: options.containerId,
              start_time: options.startTime,
              end_time: options.endTime,
              page_token: options.pageToken,
              page_size: parseInt(options.pageSize, 10),
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error listing messages: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`Found ${res.data?.items?.length || 0} messages.`);
          res.data?.items?.forEach((msg: any) => {
            console.log(`[${msg.message_id}] ${msg.sender?.id} (${msg.msg_type}): ${msg.body?.content}`);
          });
        }
      } catch (error: any) {
        console.error('Failed to list messages:', error.message);
        process.exit(1);
      }
    });

  messageCmd
    .command('reply')
    .description('Reply to a specific message')
    .requiredOption('--message-id <messageId>', 'The ID of the message to reply to')
    .requiredOption('--content <content>', 'Message content (JSON string)')
    .option('--msg-type <msgType>', 'Message type: text, post, image, file, audio, media, sticker, interactive, share_chat, share_user', 'text')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.im.message.reply({
            path: {
              message_id: options.messageId,
            },
            data: {
              content: options.content,
              msg_type: options.msgType,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error replying to message: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`✅ Replied successfully. Message ID: ${res.data?.message_id}`);
        }
      } catch (error: any) {
        console.error('Failed to reply to message:', error.message);
        process.exit(1);
      }
    });
}
