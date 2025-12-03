import type { ModuleConfig } from '@/config/types';
import { DEFAULT_CONFIG } from '@/config/defaults';
import { loadConfigFromUrl } from '@/config/loader';
import { validateConfig } from '@/config/validator';
import { mergeWithDefaults } from '@/config/merger';
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

  static async migrateFromFile(configUrl: string): Promise<void> {
    try {
      const loadedConfig = await loadConfigFromUrl(configUrl);

      if (validateConfig(loadedConfig)) {
        await setSettingsConfig(loadedConfig);
        if (this.instance) {
          this.instance.config = loadedConfig;
        }
      } else {
        const partialConfig = loadedConfig as Partial<ModuleConfig>;
        const mergedConfig = mergeWithDefaults(partialConfig, DEFAULT_CONFIG);
        await setSettingsConfig(mergedConfig);
        if (this.instance) {
          this.instance.config = mergedConfig;
        }
      }
    } catch (error) {
      console.warn('Failed to migrate config from file:', error);
    }
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
