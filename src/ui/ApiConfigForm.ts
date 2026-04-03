import type { ModuleConfig } from '@/config/types';
import { getConfig, setConfig } from '@/settings/SettingsManager';
import { validateConfig } from '@/config/validator';
import { DEFAULT_CONFIG } from '@/config/defaults';

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
  const logLevelRaw = formData['logging.level'];
  const logLevel = typeof logLevelRaw === 'string' ? logLevelRaw : DEFAULT_CONFIG.logging.level;
  const validLogLevel = ['debug', 'info', 'warn', 'error'].includes(logLevel)
    ? (logLevel as 'debug' | 'info' | 'warn' | 'error')
    : DEFAULT_CONFIG.logging.level;

  return {
    webSocket: {
      enabled: Boolean(formData['webSocket.enabled'] ?? DEFAULT_CONFIG.webSocket.enabled),
      reconnectInterval: Number(formData['webSocket.reconnectInterval'] ?? DEFAULT_CONFIG.webSocket.reconnectInterval),
      maxReconnectAttempts: Number(formData['webSocket.maxReconnectAttempts'] ?? DEFAULT_CONFIG.webSocket.maxReconnectAttempts)
    },
    logging: {
      enabled: Boolean(formData['logging.enabled']),
      level: validLogLevel
    }
  };
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
    return { config };
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
    console.log('Foundry API Bridge | Configuration saved');
  }
}
