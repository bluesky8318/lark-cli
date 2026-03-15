
import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import * as lark from '@larksuiteoapi/node-sdk';

export function registerTaskCommand(program: Command) {
  const taskCmd = program
    .command('task')
    .description('Manage Lark tasks');

  // Task List
  taskCmd
    .command('list')
    .description('List tasks')
    .option('--page-size <pageSize>', 'Page size', '50')
    .option('--page-token <pageToken>', 'Page token')
    .option('--start-time <startTime>', 'Start time (unix timestamp)')
    .option('--end-time <endTime>', 'End time (unix timestamp)')
    .option('--task-completed <taskCompleted>', 'Filter by completion status (true/false)')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();
        const config = require('../utils/config').getConfig();
        const userAccessToken = options.userAccessToken || config.userAccessToken;

        const res = await client.task.task.list({
          params: {
            page_size: parseInt(options.pageSize, 10),
            page_token: options.pageToken,
            start_create_time: options.startTime,
            end_create_time: options.endTime,
            task_completed: options.taskCompleted === 'true' ? true : options.taskCompleted === 'false' ? false : undefined,
          },
        }, userAccessToken ? lark.withUserAccessToken(userAccessToken) : undefined);

        if (res.code !== 0) {
          console.error(`Error listing tasks: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`Found ${res.data?.items?.length || 0} tasks.`);
          res.data?.items?.forEach((task) => {
            const status = task.complete_time ? 'Completed' : 'Pending';
            console.log(`[${task.id}] ${status} - ${task.summary}`);
          });
        }
      } catch (error: any) {
        console.error('Failed to list tasks:', error.message);
        process.exit(1);
      }
    });

  // Task Create
  taskCmd
    .command('create')
    .description('Create a new task')
    .requiredOption('--summary <summary>', 'Task summary')
    .option('--description <description>', 'Task description')
    .option('--due <due>', 'Due time (unix timestamp or ISO string)')
    .option('--collaborator-ids <collaboratorIds>', 'Collaborator IDs (comma-separated)')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();
        const config = require('../utils/config').getConfig();
        const userAccessToken = options.userAccessToken || config.userAccessToken;

        const res = await client.task.task.create({
          data: {
            summary: options.summary,
            description: options.description,
            due: options.due ? {
                time: options.due,
            } : undefined,
            collaborator_ids: options.collaboratorIds ? options.collaboratorIds.split(',') : undefined,
            origin: {
              platform_i18n_name: JSON.stringify({ "zh_cn": "Lark CLI", "en_us": "Lark CLI" }),
              href: {
                url: "https://www.larksuite.com",
                title: "Lark CLI",
              }
            }
          },
        }, userAccessToken ? lark.withUserAccessToken(userAccessToken) : undefined);

        if (res.code !== 0) {
          console.error(`Error creating task: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`✅ Task created successfully. Task ID: ${res.data?.task?.id}`);
        }
      } catch (error: any) {
        console.error('Failed to create task:', error.message);
        process.exit(1);
      }
    });

  // Task Complete
  taskCmd
    .command('complete')
    .description('Complete a task')
    .requiredOption('--task-id <taskId>', 'The ID of the task to complete')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();
        const config = require('../utils/config').getConfig();
        const userAccessToken = options.userAccessToken || config.userAccessToken;

        const res = await client.task.task.complete({
          path: {
            task_id: options.taskId,
          },
        }, userAccessToken ? lark.withUserAccessToken(userAccessToken) : undefined);

        if (res.code !== 0) {
          console.error(`Error completing task: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`✅ Task completed successfully. Task ID: ${options.taskId}`);
        }
      } catch (error: any) {
        console.error('Failed to complete task:', error.message);
        process.exit(1);
      }
    });
}
