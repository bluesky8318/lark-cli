import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.lark-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface Config {
  appId?: string;
  appSecret?: string;
  [key: string]: any;
}

export function getConfig(): Config {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return fs.readJsonSync(CONFIG_FILE);
    } catch (error) {
      console.error('Failed to read config file:', error);
      return {};
    }
  }
  return {};
}

export function saveConfig(config: Config) {
  try {
    fs.ensureDirSync(CONFIG_DIR);
    fs.writeJsonSync(CONFIG_FILE, config, { spaces: 2 });
  } catch (error) {
    console.error('Failed to save config file:', error);
  }
}

export function updateConfig(updates: Partial<Config>) {
  const currentConfig = getConfig();
  const newConfig = { ...currentConfig, ...updates };
  saveConfig(newConfig);
}
