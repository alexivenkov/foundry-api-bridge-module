import type { ModuleConfig } from '@/config/types';
import { DEFAULT_CONFIG } from '@/config/defaults';

const MODULE_ID = 'foundry-api-bridge';
const CONFIG_KEY = 'config';

export function registerSettings(): void {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  game.settings.register(MODULE_ID, CONFIG_KEY, {
    name: 'Module Configuration',
    scope: 'world',
    config: false,
    type: Object,
    default: DEFAULT_CONFIG
  });

  game.settings.register(MODULE_ID, 'serverUrl', {
    name: 'Server URL',
    hint: 'Base URL of the external server for REST API requests',
    scope: 'world',
    config: true,
    type: String,
    default: 'http://localhost:3001',
    requiresReload: true
  });

  game.settings.register(MODULE_ID, 'wsUrl', {
    name: 'WebSocket URL',
    hint: 'URL for WebSocket connection to the external server',
    scope: 'world',
    config: true,
    type: String,
    default: 'ws://localhost:3001/ws',
    requiresReload: true
  });

  game.settings.register(MODULE_ID, 'apiKey', {
    name: 'API Key',
    hint: 'API key for server authorization (format: pk_...)',
    scope: 'world',
    config: true,
    type: String,
    default: '',
    requiresReload: true
  });
}

export async function registerMenu(): Promise<void> {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }

  const { ApiConfigForm } = await import('@/ui/ApiConfigForm');

  game.settings.registerMenu(MODULE_ID, 'configMenu', {
    name: 'Configure Module',
    label: 'Configure',
    hint: 'Configure update interval and compendium auto-load settings',
    icon: 'fas fa-cog',
    type: ApiConfigForm as unknown as new () => FormApplication,
    restricted: true
  });
}

export function getServerUrl(): string {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  return game.settings.get(MODULE_ID, 'serverUrl') as string;
}

export function getWsUrl(): string {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  return game.settings.get(MODULE_ID, 'wsUrl') as string;
}

export function getApiKey(): string {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  return game.settings.get(MODULE_ID, 'apiKey') as string;
}

export async function setServerUrl(url: string): Promise<void> {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  await game.settings.set(MODULE_ID, 'serverUrl', url);
}

export async function setWsUrl(url: string): Promise<void> {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  await game.settings.set(MODULE_ID, 'wsUrl', url);
}

export async function setApiKey(key: string): Promise<void> {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  await game.settings.set(MODULE_ID, 'apiKey', key);
}

export function getConfig(): ModuleConfig {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  const config = game.settings.get(MODULE_ID, CONFIG_KEY);
  return config as ModuleConfig;
}

export async function setConfig(config: ModuleConfig): Promise<void> {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  await game.settings.set(MODULE_ID, CONFIG_KEY, config);
}

export async function resetToDefaults(): Promise<void> {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  await game.settings.set(MODULE_ID, CONFIG_KEY, DEFAULT_CONFIG);
}
