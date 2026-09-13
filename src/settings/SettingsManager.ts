import type { ModuleConfig } from '@/config/types';
import { DEFAULT_CONFIG } from '@/config/defaults';

const MODULE_ID = 'foundry-api-bridge';
const CONFIG_KEY = 'config';
const LEGACY_API_KEY_SETTING = `${MODULE_ID}.apiKey`;

interface LegacySettingDocument {
  value: unknown;
  delete(): Promise<unknown>;
}

interface WorldSettingsStorage {
  getSetting?(key: string): LegacySettingDocument | undefined;
}

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

  // Client scope on purpose: a world-scoped setting is readable by every user
  // of the world from the browser console. The key lives in the GM's browser.
  game.settings.register(MODULE_ID, 'apiKey', {
    name: 'API Key',
    hint: 'API key for server authorization (format: pk_...). Stored in this browser only.',
    scope: 'client',
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

export type ApiKeyMigrationOutcome = 'migrated' | 'deleted' | 'none';

/**
 * Up to 8.12.0 the API key was a world-scoped setting, which every user of the
 * world could read from the browser console. It is client-scoped since 8.12.1.
 * This copies a key still stored in the world settings into this browser and
 * deletes the world copy. GM only; safe to call on every start.
 */
export async function migrateLegacyApiKey(): Promise<ApiKeyMigrationOutcome> {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }
  const storage = (game.settings as unknown as { storage?: Map<string, unknown> }).storage;
  const world = storage?.get('world') as WorldSettingsStorage | undefined;
  const legacy = world?.getSetting?.(LEGACY_API_KEY_SETTING);
  if (!legacy) {
    return 'none';
  }

  const legacyKey = readLegacyValue(legacy.value);
  let outcome: ApiKeyMigrationOutcome = 'deleted';
  if (legacyKey !== '' && getApiKey() === '') {
    await game.settings.set(MODULE_ID, 'apiKey', legacyKey);
    outcome = 'migrated';
  }
  await legacy.delete();
  return outcome;
}

// Setting documents hold the value either parsed or as its JSON text,
// depending on the Foundry generation; accept both.
function readLegacyValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed.startsWith('"')) return trimmed;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return typeof parsed === 'string' ? parsed.trim() : '';
  } catch {
    return '';
  }
}
