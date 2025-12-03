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

  // Parse selected compendia from checkboxes
  const autoLoad: string[] = [];
  Object.keys(formData).forEach(key => {
    if (key.startsWith('compendium.') && formData[key] === true) {
      const packId = key.replace('compendium.', '');
      autoLoad.push(packId);
    }
  });

  const urlRaw = formData['apiServer.url'];
  const worldDataRaw = formData['apiServer.endpoints.worldData'];
  const compendiumRaw = formData['apiServer.endpoints.compendium'];

  const wsUrlRaw = formData['webSocket.url'];

  const config: ModuleConfig = {
    apiServer: {
      url: typeof urlRaw === 'string' ? urlRaw : DEFAULT_CONFIG.apiServer.url,
      updateInterval: Number(formData['apiServer.updateInterval'] ?? DEFAULT_CONFIG.apiServer.updateInterval),
      endpoints: {
        worldData: typeof worldDataRaw === 'string' ? worldDataRaw : DEFAULT_CONFIG.apiServer.endpoints.worldData,
        compendium: typeof compendiumRaw === 'string' ? compendiumRaw : DEFAULT_CONFIG.apiServer.endpoints.compendium
      }
    },
    webSocket: {
      enabled: Boolean(formData['webSocket.enabled'] ?? DEFAULT_CONFIG.webSocket.enabled),
      url: typeof wsUrlRaw === 'string' ? wsUrlRaw : DEFAULT_CONFIG.webSocket.url,
      reconnectInterval: Number(formData['webSocket.reconnectInterval'] ?? DEFAULT_CONFIG.webSocket.reconnectInterval),
      maxReconnectAttempts: Number(formData['webSocket.maxReconnectAttempts'] ?? DEFAULT_CONFIG.webSocket.maxReconnectAttempts)
    },
    features: {
      autoLoadCompendium: Boolean(formData['features.autoLoadCompendium']),
      collectWorldData: Boolean(formData['features.collectWorldData']),
      periodicUpdates: Boolean(formData['features.periodicUpdates'])
    },
    compendium: {
      autoLoad
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

    // Collect available compendia with document counts
    const availableCompendia: Array<{
      id: string;
      label: string;
      type: string;
      isChecked: boolean;
      documentCount: number;
    }> = [];

    if (game.packs) {
      game.packs.forEach(pack => {
        availableCompendia.push({
          id: pack.collection,
          label: pack.metadata.label,
          type: pack.metadata.type,
          isChecked: config.compendium.autoLoad.includes(pack.collection),
          documentCount: pack.index.size
        });
      });

      // Sort by: checked first, then by label
      availableCompendia.sort((a, b) => {
        if (a.isChecked !== b.isChecked) {
          return a.isChecked ? -1 : 1;
        }
        return a.label.localeCompare(b.label);
      });
    }

    return {
      config,
      availableCompendia
    };
  }

  override activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Update counter on checkbox change
    const updateCounter = (): void => {
      const checkboxes = html.find('.compendium-checkbox');
      const checked = checkboxes.filter(':checked').length;
      const total = checkboxes.length;
      const counter = html.find('#compendiumCounter');
      counter.text(`${String(checked)} of ${String(total)} selected`);
    };

    // Initial counter update
    updateCounter();

    // Search functionality
    const searchInput = html.find('#compendiumSearch');
    const compendiumItems = html.find('.compendium-item');

    searchInput.on('input', (event) => {
      const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

      compendiumItems.each((_, item) => {
        const $item = $(item);
        const name = ($item.data('name') as string || '').toLowerCase();
        const id = ($item.data('id') as string || '').toLowerCase();
        const type = ($item.data('type') as string || '').toLowerCase();

        const matches = name.includes(searchTerm) ||
                       id.includes(searchTerm) ||
                       type.includes(searchTerm);

        if (matches) {
          $item.removeClass('hidden');
        } else {
          $item.addClass('hidden');
        }
      });
    });

    // Select All button
    html.find('#selectAllBtn').on('click', () => {
      const visibleCheckboxes = html.find('.compendium-item:not(.hidden) .compendium-checkbox');
      visibleCheckboxes.prop('checked', true);
      updateCounter();
    });

    // Deselect All button
    html.find('#deselectAllBtn').on('click', () => {
      const visibleCheckboxes = html.find('.compendium-item:not(.hidden) .compendium-checkbox');
      visibleCheckboxes.prop('checked', false);
      updateCounter();
    });

    // Update counter when any checkbox changes
    html.find('.compendium-checkbox').on('change', () => {
      updateCounter();
    });
  }

  protected override async _updateObject(_event: Event, formData: Record<string, unknown>): Promise<void> {
    const newConfig = parseFormData(formData);

    if (!validateConfig(newConfig)) {
      throw new Error('Invalid configuration');
    }

    await setConfig(newConfig);

    console.log('Foundry API Bridge | Configuration saved successfully');

    // Trigger compendium auto-load if enabled and compendia are selected
    if (newConfig.features.autoLoadCompendium && newConfig.compendium.autoLoad.length > 0) {
      console.log('Foundry API Bridge | Triggering compendium auto-load...');

      try {
        await window.FoundryAPIBridge.autoLoadCompendium();
        if (ui.notifications) {
          ui.notifications.info(`Successfully loaded ${String(newConfig.compendium.autoLoad.length)} compendium pack(s)`);
        }
      } catch (error: unknown) {
        console.error('Foundry API Bridge | Error during auto-load:', error);
        if (ui.notifications) {
          ui.notifications.error('Failed to load compendia. Check console for details.');
        }
      }
    }
  }
}
