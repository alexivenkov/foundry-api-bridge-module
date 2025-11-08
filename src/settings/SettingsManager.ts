import type { ModuleConfig } from '../config/types';
import { DEFAULT_CONFIG } from '../config/defaults';

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
}

export async function registerMenu(): Promise<void> {
  if (!game.settings) {
    throw new Error('game.settings is not available');
  }

  const { ApiConfigForm } = await import('../ui/ApiConfigForm');

  game.settings.registerMenu(MODULE_ID, 'configMenu', {
    name: 'Configure Module',
    label: 'Configure',
    hint: 'Configure API server URL, update interval, and compendium auto-load settings',
    icon: 'fas fa-cog',
    type: ApiConfigForm as unknown as new () => FormApplication,
    restricted: true
  });
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
