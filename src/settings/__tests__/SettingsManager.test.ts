import { DEFAULT_CONFIG } from '@/config/defaults';
import type { ModuleConfig } from '@/config/types';

jest.mock('@/ui/ApiConfigForm', () => ({
  ApiConfigForm: class MockApiConfigForm {}
}));

import { registerSettings, registerMenu, getConfig, setConfig, getWsUrl, getApiUrl, getAllowScriptMacros, migrateLegacyApiKey } from '@/settings/SettingsManager';

const mockWorldStorage = { getSetting: jest.fn() };
const mockSettings = {
  register: jest.fn(),
  registerMenu: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  storage: new Map<string, unknown>([['world', mockWorldStorage]])
};

(global as unknown as Record<string, unknown>)['game'] = {
  settings: mockSettings
};

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
