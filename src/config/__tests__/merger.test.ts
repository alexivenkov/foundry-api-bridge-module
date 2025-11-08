import { mergeWithDefaults } from '../merger';
import { DEFAULT_CONFIG } from '../defaults';
import type { ModuleConfig } from '../types';

describe('mergeWithDefaults', () => {
  it('returns defaults when user config is empty', () => {
    const result = mergeWithDefaults({}, DEFAULT_CONFIG);
    expect(result).toEqual(DEFAULT_CONFIG);
  });

  it('overrides top-level string value', () => {
    const userConfig = {
      apiServer: {
        url: 'http://custom:4000'
      }
    };

    const result = mergeWithDefaults(userConfig, DEFAULT_CONFIG);

    expect(result.apiServer.url).toBe('http://custom:4000');
    expect(result.apiServer.updateInterval).toBe(5000);
  });

  it('overrides nested values', () => {
    const userConfig = {
      apiServer: {
        endpoints: {
          worldData: '/custom-update'
        }
      }
    };

    const result = mergeWithDefaults(userConfig, DEFAULT_CONFIG);

    expect(result.apiServer.endpoints.worldData).toBe('/custom-update');
    expect(result.apiServer.endpoints.compendium).toBe('/update-compendium');
  });

  it('replaces array entirely', () => {
    const userConfig = {
      compendium: {
        autoLoad: ['custom.pack1', 'custom.pack2']
      }
    };

    const result = mergeWithDefaults(userConfig, DEFAULT_CONFIG);

    expect(result.compendium.autoLoad).toEqual(['custom.pack1', 'custom.pack2']);
  });

  it('overrides boolean values', () => {
    const userConfig = {
      features: {
        autoLoadCompendium: false
      }
    };

    const result = mergeWithDefaults(userConfig, DEFAULT_CONFIG);

    expect(result.features.autoLoadCompendium).toBe(false);
    expect(result.features.collectWorldData).toBe(true);
  });

  it('handles multiple overrides', () => {
    const userConfig: Partial<ModuleConfig> = {
      apiServer: {
        url: 'http://custom:4000',
        updateInterval: 10000,
        endpoints: {
          worldData: '/api/world',
          compendium: '/api/compendium'
        }
      },
      features: {
        autoLoadCompendium: false,
        collectWorldData: true,
        periodicUpdates: false
      }
    };

    const result = mergeWithDefaults(userConfig, DEFAULT_CONFIG);

    expect(result.apiServer.url).toBe('http://custom:4000');
    expect(result.apiServer.updateInterval).toBe(10000);
    expect(result.features.autoLoadCompendium).toBe(false);
    expect(result.features.periodicUpdates).toBe(false);
  });

  it('preserves defaults when user config has undefined values', () => {
    const userConfig = {
      apiServer: {
        url: undefined
      }
    };

    const result = mergeWithDefaults(userConfig, DEFAULT_CONFIG);

    expect(result.apiServer.url).toBe('http://localhost:3001');
  });
});
