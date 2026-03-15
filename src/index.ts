#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import { registerAuthCommand } from './commands/auth.js';
import { registerMessageCommand } from './commands/message.js';
import { registerDocCommand } from './commands/doc.js';
import { registerBaseCommand } from './commands/base.js';
import { registerCalendarCommand } from './commands/calendar.js';
import { registerTaskCommand } from './commands/task.js';
import { registerSheetCommand } from './commands/sheet.js';

// Load environment variables from .env file if present
dotenv.config();

const program = new Command();

program
  .name('lark-cli')
  .description('Lark/Feishu CLI tool for AI Agents')
  .version('1.0.0');

// Global options
program.option('--json', 'Output in JSON format');

// Register commands
registerAuthCommand(program);
registerMessageCommand(program);
registerDocCommand(program);
registerBaseCommand(program);
registerCalendarCommand(program);
registerTaskCommand(program);
registerSheetCommand(program);

program.parse(process.argv);

// Export for potential programmatic usage
export { program };
