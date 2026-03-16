import { Command } from 'commander';
import { getClient, withAuthRetry } from '../utils/client.js';
import * as lark from '@larksuiteoapi/node-sdk';

export function registerCalendarCommand(program: Command) {
  const calendarCmd = program
    .command('calendar')
    .description('Manage Lark calendars and events');

  // Calendar List Command
  calendarCmd
    .command('list')
    .description('List calendars')
    .option('--page-size <pageSize>', 'Page size (min 50)', '50')
    .option('--page-token <pageToken>', 'Page token')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        if (!options.userAccessToken) {
            // We check this here but withAuthRetry will also handle it if token is missing from config
            // However, withAuthRetry relies on config or passed token.
            // If we want to enforce "auth user" if missing, withAuthRetry does that.
            // But let's keep the explicit check if we want to fail fast?
            // Actually, the requirement is to auto-auth. So we should remove the fail-fast check
            // unless we want to force user to have run auth at least once?
            // No, `withAuthRetry` handles "no token found" by starting auth.
            // So we can remove the explicit check here and let withAuthRetry handle it.
        }

        // Construct params conditionally to avoid passing undefined values
        // which might trigger field validation errors in the SDK.
        const params: any = {};
        if (options.pageSize) {
            params.page_size = parseInt(options.pageSize, 10);
        } else {
            // Default to 50 if not specified (API requirement: min 50)
            // Wait, option default is already '50', so options.pageSize will be '50'
            // But let's be safe.
            params.page_size = 50;
        }
        if (options.pageToken) {
            params.page_token = options.pageToken;
        }

        const res = await withAuthRetry(async (token) => {
          return await client.calendar.calendar.list({
            params: params,
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error listing calendars: [${res.code}] ${res.msg}`);
          const errData = (res as any).error;
          if (errData) console.error(JSON.stringify(errData, null, 2));
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`Found ${res.data?.calendar_list?.length || 0} calendars.`);
          res.data?.calendar_list?.forEach((cal: any) => {
            console.log(`[${cal.calendar_id}] ${cal.summary} (${cal.type})`);
          });
        }
      } catch (error: any) {
        console.error('Failed to list calendars:', error.message);
        process.exit(1);
      }
    });

  // Event List Command
  calendarCmd
    .command('event-list')
    .description('List events in a calendar')
    .requiredOption('--calendar-id <calendarId>', 'Calendar ID')
    .option('--start-time <startTime>', 'Start time (unix timestamp)')
    .option('--end-time <endTime>', 'End time (unix timestamp)')
    .option('--page-size <pageSize>', 'Page size (min 50)', '50')
    .option('--page-token <pageToken>', 'Page token')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const params: any = {};
        if (options.pageSize) params.page_size = parseInt(options.pageSize, 10);
        if (options.startTime) params.start_time = options.startTime;
        if (options.endTime) params.end_time = options.endTime;
        if (options.pageToken) params.page_token = options.pageToken;

        const res = await withAuthRetry(async (token) => {
          return await client.calendar.calendarEvent.list({
            path: {
              calendar_id: options.calendarId,
            },
            params: params,
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error listing events: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`Found ${res.data?.items?.length || 0} events.`);
          res.data?.items?.forEach((event: any) => {
            console.log(`[${event.event_id}] ${event.summary} (${event.start_time?.timestamp || event.start_time?.date} - ${event.end_time?.timestamp || event.end_time?.date})`);
          });
        }
      } catch (error: any) {
        console.error('Failed to list events:', error.message);
        process.exit(1);
      }
    });

  // Event Create Command
  calendarCmd
    .command('event-create')
    .description('Create an event in a calendar')
    .requiredOption('--calendar-id <calendarId>', 'Calendar ID')
    .requiredOption('--summary <summary>', 'Event summary')
    .requiredOption('--start-time <startTime>', 'Start time (unix timestamp)')
    .requiredOption('--end-time <endTime>', 'End time (unix timestamp)')
    .option('--description <description>', 'Event description')
    .option('--attendees <attendees>', 'Comma-separated list of user IDs to invite')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const attendeeList = options.attendees ? options.attendees.split(',').map((id: string) => ({
            type: 'user',
            user_id: id 
        })) : [];

        const res = await withAuthRetry(async (token) => {
          return await client.calendar.calendarEvent.create({
            path: {
              calendar_id: options.calendarId,
            },
            data: {
              summary: options.summary,
              description: options.description,
              start_time: {
                  timestamp: options.startTime
              },
              end_time: {
                  timestamp: options.endTime
              }
            },
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
          console.error(`Error creating event: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`✅ Event created successfully. Event ID: ${res.data?.event?.event_id}`);
        }
      } catch (error: any) {
        console.error('Failed to create event:', error.message);
        process.exit(1);
      }
    });

  // Freebusy Command
  calendarCmd
    .command('freebusy')
    .description('Query free/busy status')
    .requiredOption('--start-time <startTime>', 'Start time (ISO 8601)')
    .requiredOption('--end-time <endTime>', 'End time (ISO 8601)')
    .requiredOption('--user-ids <userIds>', 'Comma-separated list of user IDs to query')
    .option('--user-access-token <userAccessToken>', 'User Access Token for authentication')
    .action(async (options) => {
      try {
        const client = getClient();

        const userIds = options.userIds.split(',');
        
        // Use batch interface to query multiple users
        const res = await withAuthRetry(async (token) => {
          return await client.calendar.freebusy.batch({
            params: {
              user_id_type: 'user_id', 
            },
            data: {
              time_min: options.startTime,
              time_max: options.endTime,
              user_ids: userIds
            }
          }, lark.withUserAccessToken(token));
        }, { userAccessToken: options.userAccessToken });

        if (res.code !== 0) {
            console.error(`Error querying freebusy: [${res.code}] ${res.msg}`);
            process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
            console.log('Freebusy information:');
            res.data?.freebusy_lists?.forEach((list: any) => {
                console.log(`User: ${list.user_id}`);
                list.freebusy_items?.forEach((item: any) => {
                    console.log(`  ${item.start_time} - ${item.end_time}`);
                });
            });
        }

      } catch (error: any) {
        console.error('Failed to query freebusy:', error.message);
        process.exit(1);
      }
    });
}
