
import { Command } from 'commander';
import { getClient, withAuthRetry } from '../utils/client.js';
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
    .option('--task-completed <taskCompleted>', 'Filter by completion status (true/false, default: false)', 'false')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const res = await withAuthRetry(async (token) => {
          return await client.task.task.list({
            params: {
              page_size: parseInt(options.pageSize, 10),
              page_token: options.pageToken,
              start_create_time: options.startTime,
              end_create_time: options.endTime,
              task_completed: options.taskCompleted === 'true',
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error listing tasks: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`Found ${res.data?.items?.length || 0} tasks.`);
          
          let tasks = res.data?.items || [];
          
          // Filter: Only show parent tasks (no parent_task_id)
          tasks = tasks.filter((t: any) => !t.parent_task_id);

          // Sort tasks by due date (ascending)
          // Tasks without due date or with 1970 timestamp (0 or close to 0) will be put at the end
          tasks.sort((a: any, b: any) => {
            const getTimestamp = (t: any) => {
                const time = t.due?.time ? parseInt(t.due.time) : 0;
                // Treat 0 or very small timestamps (like 1970-01-01) as "no due date" for sorting purposes
                // Let's say anything before 2000 (946684800) is considered invalid/no-date
                if (time < 946684800) return Number.MAX_SAFE_INTEGER;
                return time;
            };

            const timeA = getTimestamp(a);
            const timeB = getTimestamp(b);
            return timeA - timeB;
          });

          tasks.forEach((task: any) => {
            const status = task.complete_time ? 'Completed' : 'Pending';
            const timestamp = task.due?.time ? parseInt(task.due.time) : 0;
            const dueTime = timestamp > 946684800 ? new Date(timestamp * 1000).toLocaleString() : 'No Due Date';
            console.log(`[${task.id}] [${status}] [Due: ${dueTime}] ${task.summary}`);
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

        const res = await withAuthRetry(async (token) => {
          return await client.task.task.create({
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
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

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

        const res = await withAuthRetry(async (token) => {
          return await client.task.task.complete({
            path: {
              task_id: options.taskId,
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

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
