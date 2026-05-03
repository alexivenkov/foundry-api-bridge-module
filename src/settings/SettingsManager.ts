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

  game.settings.register(MODULE_ID, 'wsUrl', {
    name: 'MCP WebSocket URL',
    hint: 'WebSocket URL for MCP server (Claude / AI assistants integration)',
    scope: 'world',
    config: true,
    type: String,
    default: 'wss://foundry-mcp.com/ws',
    requiresReload: true
  });

  game.settings.register(MODULE_ID, 'apiUrl', {
    name: 'API WebSocket URL',
    hint: 'WebSocket URL for public Foundry API (REST/WS integrations for bots, dashboards, etc.)',
    scope: 'world',
    config: true,
    type: String,
    default: 'wss://api.foundry-mcp.com/v1/connect',
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

  game.settings.register(MODULE_ID, 'allowScriptMacros', {
    name: 'Allow Script Macros',
    hint: 'CRITICAL SECURITY: When enabled, the API can create, modify, and execute script-type macros (arbitrary JavaScript with GM privileges). Only enable if you trust all clients connecting via this module.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    requiresReload: false
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
    hint: 'Configure WebSocket and logging settings',
    icon: 'fas fa-cog',
    type: ApiConfigForm as unknown as new () => FormApplication,
    restricted: true
  });
}

export function getWsUrl(): string {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  return game.settings.get(MODULE_ID, 'wsUrl') as string;
}

export function getApiUrl(): string {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  return game.settings.get(MODULE_ID, 'apiUrl') as string;
}

export function getApiKey(): string {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  return game.settings.get(MODULE_ID, 'apiKey') as string;
}

export function getAllowScriptMacros(): boolean {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  return game.settings.get(MODULE_ID, 'allowScriptMacros') as boolean;
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
