import type { ModuleConfig } from '../config/types';
import { getConfig, setConfig } from '../settings/SettingsManager';
import { validateConfig } from '../config/validator';
import { DEFAULT_CONFIG } from '../config/defaults';

interface FormApplicationOptions {
  title?: string;
  id?: string;
  template?: string;
  width?: number;
  height?: number | 'auto';
  closeOnSubmit?: boolean;
  submitOnClose?: boolean;
  submitOnChange?: boolean;
  resizable?: boolean;
  classes?: string[];
}

declare class FormApplication {
  constructor(object?: unknown, options?: FormApplicationOptions);
  static get defaultOptions(): FormApplicationOptions;
  getData(): Record<string, unknown> | Promise<Record<string, unknown>>;
  activateListeners(html: JQuery): void;
  protected _updateObject(event: Event, formData: Record<string, unknown>): Promise<void>;
  close(): Promise<void>;
  render(force?: boolean): void;
}

function parseFormData(formData: Record<string, unknown>): ModuleConfig {
  const logLevel = String(formData['logging.level'] ?? DEFAULT_CONFIG.logging.level);
  const validLogLevel = ['debug', 'info', 'warn', 'error'].includes(logLevel)
    ? (logLevel as 'debug' | 'info' | 'warn' | 'error')
    : DEFAULT_CONFIG.logging.level;

  const config: ModuleConfig = {
    apiServer: {
      url: String(formData['apiServer.url'] ?? DEFAULT_CONFIG.apiServer.url),
      updateInterval: Number(formData['apiServer.updateInterval'] ?? DEFAULT_CONFIG.apiServer.updateInterval),
      endpoints: {
        worldData: String(formData['apiServer.endpoints.worldData'] ?? DEFAULT_CONFIG.apiServer.endpoints.worldData),
        compendium: String(formData['apiServer.endpoints.compendium'] ?? DEFAULT_CONFIG.apiServer.endpoints.compendium)
      }
    },
    features: {
      autoLoadCompendium: Boolean(formData['features.autoLoadCompendium']),
      collectWorldData: Boolean(formData['features.collectWorldData']),
      periodicUpdates: Boolean(formData['features.periodicUpdates'])
    },
    compendium: {
      autoLoad: (getConfig().compendium.autoLoad) || []
    },
    logging: {
      enabled: Boolean(formData['logging.enabled']),
      level: validLogLevel
    }
  };

  return config;
}

export class ApiConfigForm extends FormApplication {
  static override get defaultOptions(): FormApplicationOptions {
    return {
      ...super.defaultOptions,
      title: 'Foundry API Bridge - Configuration',
      id: 'foundry-api-bridge-config',
      template: 'modules/foundry-api-bridge/templates/config-form.html',
      width: 600,
      height: 'auto',
      closeOnSubmit: true,
      submitOnClose: false,
      submitOnChange: false,
      resizable: true,
      classes: ['foundry-api-bridge-config']
    };
  }

  override getData(): Record<string, unknown> {
    const config = getConfig();
    return {
      config
    };
  }

  override activateListeners(html: JQuery): void {
    super.activateListeners(html);
  }

  protected override async _updateObject(_event: Event, formData: Record<string, unknown>): Promise<void> {
    const newConfig = parseFormData(formData);

    if (!validateConfig(newConfig)) {
      throw new Error('Invalid configuration');
    }

    await setConfig(newConfig);

    console.log('Foundry API Bridge | Configuration saved successfully');
  }
}
