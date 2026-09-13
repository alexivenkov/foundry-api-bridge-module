import type { ModuleConfig } from '@/config/types';
import { validateConfig } from '@/config/validator';
import { DEFAULT_CONFIG } from '@/config/defaults';
import { getConfig as getSettingsConfig, setConfig as setSettingsConfig } from '@/settings/SettingsManager';

export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private config: ModuleConfig;

  private constructor(config: ModuleConfig) {
    this.config = config;
  }

  static initialize(): ConfigManager {
    const config = normalizeLegacyDefaults(getSettingsConfig());
    this.instance = new ConfigManager(config);
    return this.instance;
  }

  static async updateConfig(newConfig: ModuleConfig): Promise<void> {
    if (!validateConfig(newConfig)) {
      throw new Error('Invalid configuration');
    }

    await setSettingsConfig(newConfig);
    if (this.instance) {
      this.instance.config = newConfig;
    }
  }

  static getConfig(): ModuleConfig {
    if (!this.instance) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }
    return this.instance.config;
  }

  static isInitialized(): boolean {
    return this.instance !== null;
  }

  static reset(): void {
    this.instance = null;
  }
}

const LEGACY_DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Before 8.12.1 the stored default was 10 attempts with no delay ceiling,
 * which gave up after roughly 85 minutes. With the 60 s ceiling the same 10
 * attempts would give up after about 5 minutes, so a stored old default is
 * read as the new default (unlimited). A value the user changed on purpose
 * is kept as is. Nothing is written back.
 */
export function normalizeLegacyDefaults(config: ModuleConfig): ModuleConfig {
  const ws = config.webSocket;
  const isLegacyDefault =
    ws.maxReconnectAttempts === LEGACY_DEFAULT_MAX_RECONNECT_ATTEMPTS &&
    ws.reconnectInterval === DEFAULT_CONFIG.webSocket.reconnectInterval;
  if (!isLegacyDefault) {
    return config;
  }
  return {
    ...config,
    webSocket: { ...ws, maxReconnectAttempts: DEFAULT_CONFIG.webSocket.maxReconnectAttempts }
  };
}
