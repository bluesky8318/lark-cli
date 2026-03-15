import { Command } from 'commander';
import { getClient } from '../utils/client.js';

export function registerCalendarCommand(program: Command) {
  const calendarCmd = program
    .command('calendar')
    .description('Manage Lark calendars and events');

  // Calendar List Command
  calendarCmd
    .command('list')
    .description('List calendars')
    .option('--page-size <pageSize>', 'Page size', '20')
    .option('--page-token <pageToken>', 'Page token')
    .action(async (options) => {
      try {
        const client = getClient();
        const res = await client.calendar.calendar.list({
          params: {
            page_size: parseInt(options.pageSize, 10),
            page_token: options.pageToken,
          },
        });

        if (res.code !== 0) {
          console.error(`Error listing calendars: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`Found ${res.data?.calendars?.length || 0} calendars.`);
          res.data?.calendars?.forEach((cal) => {
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
    .option('--page-size <pageSize>', 'Page size', '20')
    .option('--page-token <pageToken>', 'Page token')
    .action(async (options) => {
      try {
        const client = getClient();
        const res = await client.calendar.calendarEvent.list({
          path: {
            calendar_id: options.calendarId,
          },
          params: {
            start_time: options.startTime,
            end_time: options.endTime,
            page_size: parseInt(options.pageSize, 10),
            page_token: options.pageToken,
          },
        });

        if (res.code !== 0) {
          console.error(`Error listing events: [${res.code}] ${res.msg}`);
          process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          console.log(`Found ${res.data?.items?.length || 0} events.`);
          res.data?.items?.forEach((event) => {
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
    .action(async (options) => {
      try {
        const client = getClient();
        
        const attendeeList = options.attendees ? options.attendees.split(',').map((id: string) => ({
            type: 'user',
            user_id: id 
        })) : [];

        const res = await client.calendar.calendarEvent.create({
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
            },
            attendees: attendeeList.length > 0 ? attendeeList : undefined
          },
        });

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
    .action(async (options) => {
      try {
        const client = getClient();
        const userIds = options.userIds.split(',');
        
        // Use batch interface to query multiple users
        const res = await client.calendar.freebusy.batch({
          params: {
            user_id_type: 'user_id', 
          },
          data: {
            time_min: options.startTime,
            time_max: options.endTime,
            user_ids: userIds
          }
        });

        if (res.code !== 0) {
            console.error(`Error querying freebusy: [${res.code}] ${res.msg}`);
            process.exit(1);
        }

        if (program.opts().json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
            console.log('Freebusy information:');
            res.data?.freebusy_lists?.forEach((list) => {
                console.log(`User: ${list.user_id}`);
                list.freebusy_items?.forEach((item) => {
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
