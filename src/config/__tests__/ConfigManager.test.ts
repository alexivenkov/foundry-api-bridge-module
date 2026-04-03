import { ConfigManager } from '@/config/ConfigManager';
import { DEFAULT_CONFIG } from '@/config/defaults';
import type { ModuleConfig } from '@/config/types';
import { getConfig, setConfig } from '@/settings/SettingsManager';

jest.mock('@/settings/SettingsManager');

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
        webSocket: { ...DEFAULT_CONFIG.webSocket, reconnectInterval: 3000 }
      };

      mockGetConfig.mockReturnValue(settingsConfig);

      ConfigManager.initialize();

      expect(ConfigManager.isInitialized()).toBe(true);
      expect(ConfigManager.getConfig().webSocket.reconnectInterval).toBe(3000);
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
        webSocket: { ...DEFAULT_CONFIG.webSocket, maxReconnectAttempts: 20 }
      };

      await ConfigManager.updateConfig(newConfig);

      expect(mockSetConfig).toHaveBeenCalledWith(newConfig);
      expect(ConfigManager.getConfig().webSocket.maxReconnectAttempts).toBe(20);
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
