import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const HOME_CONFIG_DIR = path.join(os.homedir(), '.lark-cli');
const HOME_CONFIG_FILE = path.join(HOME_CONFIG_DIR, 'config.json');

const LOCAL_CONFIG_DIR = path.join(process.cwd(), '.lark-cli');
const LOCAL_CONFIG_FILE = path.join(LOCAL_CONFIG_DIR, 'config.json');

export interface Config {
  appId?: string;
  appSecret?: string;
  userAccessToken?: string;
  userInfo?: {
    name?: string;
    en_name?: string;
    avatar_url?: string;
    open_id?: string;
    union_id?: string;
    user_id?: string;
    tenant_key?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

function getConfigFile(): string {
  if (fs.existsSync(LOCAL_CONFIG_FILE)) {
    return LOCAL_CONFIG_FILE;
  }
  return HOME_CONFIG_FILE;
}

export function getConfig(): Config {
  const configFile = getConfigFile();
  if (fs.existsSync(configFile)) {
    try {
      return fs.readJsonSync(configFile);
    } catch (error) {
      console.error(`Failed to read config file (${configFile}):`, error);
      return {};
    }
  }
  return {};
}

export function saveConfig(config: Config) {
  try {
    // If local config exists, save to it. Otherwise save to home config.
    // Or if we want to support creating local config explicitly, we might need a flag.
    // For now, let's stick to the behavior: priority to existing local, default to home for new.
    const targetFile = fs.existsSync(LOCAL_CONFIG_FILE) ? LOCAL_CONFIG_FILE : HOME_CONFIG_FILE;
    const targetDir = path.dirname(targetFile);
    
    fs.ensureDirSync(targetDir);
    fs.writeJsonSync(targetFile, config, { spaces: 2 });
    // console.log(`Config saved to ${targetFile}`);
  } catch (error) {
    console.error('Failed to save config file:', error);
  }
}

export function updateConfig(updates: Partial<Config>) {
  const currentConfig = getConfig();
  const newConfig = { ...currentConfig, ...updates };
  saveConfig(newConfig);
}
