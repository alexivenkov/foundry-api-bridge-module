import { ConfigManager } from '../ConfigManager';
import { loadConfigFromUrl } from '../loader';
import { DEFAULT_CONFIG } from '../defaults';
import type { ModuleConfig } from '../types';
import { getConfig, setConfig } from '../../settings/SettingsManager';

jest.mock('../loader');
jest.mock('../../settings/SettingsManager');

const mockLoadConfigFromUrl = loadConfigFromUrl as jest.MockedFunction<typeof loadConfigFromUrl>;
const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
const mockSetConfig = setConfig as jest.MockedFunction<typeof setConfig>;

describe('ConfigManager', () => {
  beforeEach(() => {
    ConfigManager.reset();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize with config from game.settings', () => {
      const settingsConfig: ModuleConfig = {
        ...DEFAULT_CONFIG,
        apiServer: { ...DEFAULT_CONFIG.apiServer, url: 'http://test:3000' }
      };

      mockGetConfig.mockReturnValue(settingsConfig);

      ConfigManager.initialize();

      expect(ConfigManager.isInitialized()).toBe(true);
      expect(ConfigManager.getConfig().apiServer.url).toBe('http://test:3000');
    });
  });

  describe('migrateFromFile', () => {
    beforeEach(() => {
      mockGetConfig.mockReturnValue(DEFAULT_CONFIG);
      ConfigManager.initialize();
    });

    it('should migrate valid config from file to settings', async () => {
      const fileConfig: ModuleConfig = {
        ...DEFAULT_CONFIG,
        apiServer: { ...DEFAULT_CONFIG.apiServer, url: 'http://migrated:3000' }
      };

      mockLoadConfigFromUrl.mockResolvedValue(fileConfig);

      await ConfigManager.migrateFromFile('config.json');

      expect(mockSetConfig).toHaveBeenCalledWith(fileConfig);
      expect(ConfigManager.getConfig().apiServer.url).toBe('http://migrated:3000');
    });

    it('should merge partial config when migrating', async () => {
      const partialConfig = {
        apiServer: { url: 'http://partial:3000' }
      };

      mockLoadConfigFromUrl.mockResolvedValue(partialConfig);

      await ConfigManager.migrateFromFile('config.json');

      expect(mockSetConfig).toHaveBeenCalled();
      const savedConfig = mockSetConfig.mock.calls[0]?.[0] as ModuleConfig;
      expect(savedConfig.apiServer.url).toBe('http://partial:3000');
      expect(savedConfig.apiServer.updateInterval).toBe(5000);
    });

    it('should handle migration errors gracefully', async () => {
      mockLoadConfigFromUrl.mockRejectedValue(new Error('File not found'));

      await expect(ConfigManager.migrateFromFile('missing.json')).resolves.not.toThrow();

      expect(mockSetConfig).not.toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    beforeEach(() => {
      mockGetConfig.mockReturnValue(DEFAULT_CONFIG);
      ConfigManager.initialize();
    });

    it('should update config when valid', async () => {
      const newConfig: ModuleConfig = {
        ...DEFAULT_CONFIG,
        apiServer: { ...DEFAULT_CONFIG.apiServer, url: 'http://updated:3000' }
      };

      await ConfigManager.updateConfig(newConfig);

      expect(mockSetConfig).toHaveBeenCalledWith(newConfig);
      expect(ConfigManager.getConfig().apiServer.url).toBe('http://updated:3000');
    });

    it('should throw error when config is invalid', async () => {
      const invalidConfig = { invalid: 'config' } as unknown as ModuleConfig;

      await expect(ConfigManager.updateConfig(invalidConfig)).rejects.toThrow('Invalid configuration');

      expect(mockSetConfig).not.toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should throw error when not initialized', () => {
      expect(() => ConfigManager.getConfig()).toThrow('ConfigManager not initialized');
    });

    it('should return config after initialization', () => {
      mockGetConfig.mockReturnValue(DEFAULT_CONFIG);

      ConfigManager.initialize();

      expect(ConfigManager.getConfig()).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('isInitialized', () => {
    it('should return false when not initialized', () => {
      expect(ConfigManager.isInitialized()).toBe(false);
    });

    it('should return true after initialization', () => {
      mockGetConfig.mockReturnValue(DEFAULT_CONFIG);

      ConfigManager.initialize();

      expect(ConfigManager.isInitialized()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset initialization state', () => {
      mockGetConfig.mockReturnValue(DEFAULT_CONFIG);

      ConfigManager.initialize();
      expect(ConfigManager.isInitialized()).toBe(true);

      ConfigManager.reset();
      expect(ConfigManager.isInitialized()).toBe(false);
    });
  });
});
