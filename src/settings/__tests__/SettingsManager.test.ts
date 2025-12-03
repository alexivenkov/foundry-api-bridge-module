import { DEFAULT_CONFIG } from '@/config/defaults';
import type { ModuleConfig } from '@/config/types';

jest.mock('@/ui/ApiConfigForm', () => ({
  ApiConfigForm: class MockApiConfigForm {}
}));

import { registerSettings, registerMenu, getConfig, setConfig, resetToDefaults } from '@/settings/SettingsManager';

const mockSettings = {
  register: jest.fn(),
  registerMenu: jest.fn(),
  get: jest.fn(),
  set: jest.fn()
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
          hint: 'Configure API server URL, update interval, and compendium auto-load settings',
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
        apiServer: {
          ...DEFAULT_CONFIG.apiServer,
          url: 'http://test.com'
        }
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
        apiServer: {
          ...DEFAULT_CONFIG.apiServer,
          url: 'http://new-server.com'
        }
      };

      mockSettings.set.mockResolvedValue(newConfig);

      await setConfig(newConfig);

      expect(mockSettings.set).toHaveBeenCalledWith('foundry-api-bridge', 'config', newConfig);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset config to DEFAULT_CONFIG', async () => {
      mockSettings.set.mockResolvedValue(DEFAULT_CONFIG);

      await resetToDefaults();

      expect(mockSettings.set).toHaveBeenCalledWith('foundry-api-bridge', 'config', DEFAULT_CONFIG);
    });
  });
});
