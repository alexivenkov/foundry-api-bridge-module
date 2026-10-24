import { DEFAULT_CONFIG } from '@/config/defaults';
import type { ModuleConfig } from '@/config/types';

jest.mock('@/ui/ApiConfigForm', () => ({
  ApiConfigForm: class MockApiConfigForm {}
}));

import {
  registerSettings,
  registerMenu,
  getConfig,
  setConfig,
  getWsUrl,
  getApiUrl,
  getAllowScriptMacros,
  migrateLegacyApiKey,
  setApiKey,
  reportInvalidApiKey,
  INVALID_API_KEY_MESSAGE
} from '@/settings/SettingsManager';

const mockWorldStorage = { getSetting: jest.fn() };
const mockSettings = {
  register: jest.fn(),
  registerMenu: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  storage: new Map<string, unknown>([['world', mockWorldStorage]])
};
const mockNotifications = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

(global as unknown as Record<string, unknown>)['game'] = {
  settings: mockSettings
};
(global as unknown as Record<string, unknown>)['ui'] = {
  notifications: mockNotifications
};

function registeredApiKeyOnChange(): (value: unknown) => void {
  registerSettings();
  const apiKeyCall = mockSettings.register.mock.calls.find(([, key]) => key === 'apiKey');
  const config = apiKeyCall?.[2] as { onChange?: (value: unknown) => void } | undefined;
  if (!config?.onChange) {
    throw new Error('apiKey setting has no onChange');
  }
  return config.onChange;
}

describe('SettingsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerSettings', () => {
    it('should register config setting with correct parameters', () => {
      registerSettings();

      expect(mockSettings.register).toHaveBeenCalledWith(
        'foundry-api-bridge',
        'config',
        {
          name: 'Module Configuration',
          scope: 'world',
          config: false,
          type: Object,
          default: DEFAULT_CONFIG
        }
      );
    });

    it('should register wsUrl, apiUrl and apiKey settings', () => {
      registerSettings();

      expect(mockSettings.register).toHaveBeenCalledWith(
        'foundry-api-bridge',
        'wsUrl',
        expect.objectContaining({
          name: 'MCP WebSocket URL',
          hint: 'WebSocket URL for MCP server (Claude / AI assistants integration)',
          type: String,
          default: 'wss://foundry-mcp.com/ws',
          requiresReload: true
        })
      );
      expect(mockSettings.register).toHaveBeenCalledWith(
        'foundry-api-bridge',
        'apiUrl',
        expect.objectContaining({
          name: 'API WebSocket URL',
          hint: 'WebSocket URL for public Foundry API (REST/WS integrations for bots, dashboards, etc.)',
          scope: 'world',
          config: true,
          type: String,
          default: 'wss://api.foundry-mcp.com/v1/connect',
          requiresReload: true
        })
      );
      expect(mockSettings.register).toHaveBeenCalledWith(
        'foundry-api-bridge',
        'apiKey',
        expect.objectContaining({ name: 'API Key', type: String, scope: 'client', requiresReload: true })
      );
    });

    it('never registers the API key as a world setting (players can read those)', () => {
      registerSettings();

      const apiKeyCall = mockSettings.register.mock.calls.find(([, key]) => key === 'apiKey');
      expect(apiKeyCall?.[2]).toEqual(expect.objectContaining({ scope: 'client' }));
    });

    describe('apiKey onChange', () => {
      let errorSpy: jest.SpyInstance;

      beforeEach(() => {
        errorSpy = jest.spyOn(console, 'error').mockImplementation();
      });

      afterEach(() => {
        errorSpy.mockRestore();
      });

      it('shows a permanent error notification right after an invalid key is saved', () => {
        const onChange = registeredApiKeyOnChange();

        onChange('abc');

        expect(mockNotifications.error).toHaveBeenCalledWith(INVALID_API_KEY_MESSAGE, { permanent: true });
        expect(errorSpy).toHaveBeenCalledWith(
          'Foundry API Bridge | API key rejected (prefix): expected a key starting with "pk_"'
        );
      });

      it('stays quiet for a valid key, even one pasted with a line break inside', () => {
        const onChange = registeredApiKeyOnChange();

        onChange('pk_aB3-_x9Qz0LmNo\nPqRsTuVwXyZ1234567');

        expect(mockNotifications.error).not.toHaveBeenCalled();
        expect(errorSpy).not.toHaveBeenCalled();
      });

      it('stays quiet when the field is cleared', () => {
        const onChange = registeredApiKeyOnChange();

        onChange('');
        onChange(undefined);

        expect(mockNotifications.error).not.toHaveBeenCalled();
      });
    });

    it('should register allowScriptMacros boolean setting (default false)', () => {
      registerSettings();

      expect(mockSettings.register).toHaveBeenCalledWith(
        'foundry-api-bridge',
        'allowScriptMacros',
        expect.objectContaining({
          name: 'Allow Script Macros',
          scope: 'world',
          config: true,
          type: Boolean,
          default: false,
          requiresReload: false
        })
      );
    });
  });

  describe('getAllowScriptMacros', () => {
    it('returns false when setting is false', () => {
      mockSettings.get.mockReturnValue(false);

      const result = getAllowScriptMacros();

      expect(mockSettings.get).toHaveBeenCalledWith('foundry-api-bridge', 'allowScriptMacros');
      expect(result).toBe(false);
    });

    it('returns true when setting is true', () => {
      mockSettings.get.mockReturnValue(true);

      const result = getAllowScriptMacros();

      expect(result).toBe(true);
    });
  });

  describe('getWsUrl', () => {
    it('returns the registered wsUrl value', () => {
      mockSettings.get.mockReturnValue('wss://custom-mcp.example/ws');

      const result = getWsUrl();

      expect(mockSettings.get).toHaveBeenCalledWith('foundry-api-bridge', 'wsUrl');
      expect(result).toBe('wss://custom-mcp.example/ws');
    });
  });

  describe('getApiUrl', () => {
    it('returns the registered apiUrl value', () => {
      mockSettings.get.mockReturnValue('wss://custom-api.example/v1/connect');

      const result = getApiUrl();

      expect(mockSettings.get).toHaveBeenCalledWith('foundry-api-bridge', 'apiUrl');
      expect(result).toBe('wss://custom-api.example/v1/connect');
    });

    it('returns default when not explicitly set', () => {
      mockSettings.get.mockReturnValue('wss://api.foundry-mcp.com/v1/connect');

      const result = getApiUrl();

      expect(result).toBe('wss://api.foundry-mcp.com/v1/connect');
    });
  });

  describe('registerMenu', () => {
    it('should register settings menu with correct parameters', async () => {
      await registerMenu();

      expect(mockSettings.registerMenu).toHaveBeenCalledWith(
        'foundry-api-bridge',
        'configMenu',
        expect.objectContaining({
          name: 'Configure Module',
          label: 'Configure',
          icon: 'fas fa-cog',
          restricted: true
        })
      );
    });
  });

  describe('getConfig', () => {
    it('should retrieve config from game.settings', () => {
      const mockConfig: ModuleConfig = {
        ...DEFAULT_CONFIG,
        webSocket: { ...DEFAULT_CONFIG.webSocket, reconnectInterval: 3000 }
      };

      mockSettings.get.mockReturnValue(mockConfig);

      const result = getConfig();

      expect(mockSettings.get).toHaveBeenCalledWith('foundry-api-bridge', 'config');
      expect(result).toEqual(mockConfig);
    });

    it('should return default config when nothing is saved', () => {
      mockSettings.get.mockReturnValue(DEFAULT_CONFIG);

      const result = getConfig();

      expect(result).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('setConfig', () => {
    it('should save config to game.settings', async () => {
      const newConfig: ModuleConfig = {
        ...DEFAULT_CONFIG,
        webSocket: { ...DEFAULT_CONFIG.webSocket, maxReconnectAttempts: 20 }
      };

      mockSettings.set.mockResolvedValue(newConfig);

      await setConfig(newConfig);

      expect(mockSettings.set).toHaveBeenCalledWith('foundry-api-bridge', 'config', newConfig);
    });
  });

  describe('setApiKey', () => {
    it('writes the key to the client-scoped setting', async () => {
      mockSettings.set.mockResolvedValue(undefined);

      await setApiKey('pk_cleaned');

      expect(mockSettings.set).toHaveBeenCalledWith('foundry-api-bridge', 'apiKey', 'pk_cleaned');
    });
  });

  describe('reportInvalidApiKey', () => {
    it('logs the reason and detail and shows the permanent notification', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      reportInvalidApiKey({ ok: false, reason: 'length', detail: 'length 8, expected 20..64' });

      expect(errorSpy).toHaveBeenCalledWith('Foundry API Bridge | API key rejected (length): length 8, expected 20..64');
      expect(mockNotifications.error).toHaveBeenCalledWith(INVALID_API_KEY_MESSAGE, { permanent: true });
      errorSpy.mockRestore();
    });
  });

  describe('migrateLegacyApiKey', () => {
    beforeEach(() => {
      mockSettings.set.mockResolvedValue(undefined);
    });

    it('returns none when the world has no legacy key document', async () => {
      mockWorldStorage.getSetting.mockReturnValue(undefined);

      await expect(migrateLegacyApiKey()).resolves.toBe('none');

      expect(mockWorldStorage.getSetting).toHaveBeenCalledWith('foundry-api-bridge.apiKey');
      expect(mockSettings.set).not.toHaveBeenCalled();
    });

    it('moves a world key into client storage and deletes the world copy', async () => {
      const legacy = { value: 'pk_legacy123', delete: jest.fn().mockResolvedValue(undefined) };
      mockWorldStorage.getSetting.mockReturnValue(legacy);
      mockSettings.get.mockReturnValue('');

      await expect(migrateLegacyApiKey()).resolves.toBe('migrated');

      expect(mockSettings.set).toHaveBeenCalledWith('foundry-api-bridge', 'apiKey', 'pk_legacy123');
      expect(legacy.delete).toHaveBeenCalledTimes(1);
    });

    it('accepts a JSON-encoded legacy value', async () => {
      const legacy = { value: '"pk_json456"', delete: jest.fn().mockResolvedValue(undefined) };
      mockWorldStorage.getSetting.mockReturnValue(legacy);
      mockSettings.get.mockReturnValue('');

      await expect(migrateLegacyApiKey()).resolves.toBe('migrated');

      expect(mockSettings.set).toHaveBeenCalledWith('foundry-api-bridge', 'apiKey', 'pk_json456');
    });

    it('keeps the key already stored in this browser and only deletes the world copy', async () => {
      const legacy = { value: 'pk_old', delete: jest.fn().mockResolvedValue(undefined) };
      mockWorldStorage.getSetting.mockReturnValue(legacy);
      mockSettings.get.mockReturnValue('pk_current');

      await expect(migrateLegacyApiKey()).resolves.toBe('deleted');

      expect(mockSettings.set).not.toHaveBeenCalled();
      expect(legacy.delete).toHaveBeenCalledTimes(1);
    });

    it('deletes an empty legacy document without writing anything', async () => {
      const legacy = { value: '', delete: jest.fn().mockResolvedValue(undefined) };
      mockWorldStorage.getSetting.mockReturnValue(legacy);
      mockSettings.get.mockReturnValue('');

      await expect(migrateLegacyApiKey()).resolves.toBe('deleted');

      expect(mockSettings.set).not.toHaveBeenCalled();
      expect(legacy.delete).toHaveBeenCalledTimes(1);
    });

    it('returns none when the world storage API is missing', async () => {
      const storage = mockSettings.storage;
      mockSettings.storage = new Map();

      await expect(migrateLegacyApiKey()).resolves.toBe('none');

      mockSettings.storage = storage;
    });
  });
});
