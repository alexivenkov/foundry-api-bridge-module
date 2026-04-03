import type { ModuleConfig } from '@/config/types';
import { validateConfig } from '@/config/validator';
import { getConfig as getSettingsConfig, setConfig as setSettingsConfig } from '@/settings/SettingsManager';

export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private config: ModuleConfig;

  private constructor(config: ModuleConfig) {
    this.config = config;
  }

  static initialize(): ConfigManager {
    const config = getSettingsConfig();
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
