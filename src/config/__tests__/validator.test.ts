import { validateConfig } from '../validator';
import type { ModuleConfig } from '../types';

const validConfig: ModuleConfig = {
  apiServer: {
    url: 'http://localhost:3001',
    updateInterval: 5000,
    endpoints: {
      worldData: '/update',
      compendium: '/update-compendium'
    }
  },
  features: {
    autoLoadCompendium: true,
    collectWorldData: true,
    periodicUpdates: true
  },
  compendium: {
    autoLoad: ['dnd5e.monsters']
  },
  logging: {
    enabled: true,
    level: 'info'
  }
};

describe('validateConfig', () => {
  it('returns true for valid config', () => {
    expect(validateConfig(validConfig)).toBe(true);
  });

  it('returns false for null', () => {
    expect(validateConfig(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(validateConfig('string')).toBe(false);
    expect(validateConfig(123)).toBe(false);
    expect(validateConfig([])).toBe(false);
  });

  it('returns false when apiServer is missing', () => {
    const invalid = { ...validConfig, apiServer: undefined };
    expect(validateConfig(invalid)).toBe(false);
  });

  it('returns false when apiServer.url is not string', () => {
    const invalid = {
      ...validConfig,
      apiServer: { ...validConfig.apiServer, url: 123 }
    };
    expect(validateConfig(invalid)).toBe(false);
  });

  it('returns false when features.autoLoadCompendium is not boolean', () => {
    const invalid = {
      ...validConfig,
      features: { ...validConfig.features, autoLoadCompendium: 'yes' }
    };
    expect(validateConfig(invalid)).toBe(false);
  });

  it('returns false when compendium.autoLoad is not array', () => {
    const invalid = {
      ...validConfig,
      compendium: { autoLoad: 'not-array' }
    };
    expect(validateConfig(invalid)).toBe(false);
  });

  it('returns false when compendium.autoLoad contains non-string', () => {
    const invalid = {
      ...validConfig,
      compendium: { autoLoad: ['valid', 123, 'valid2'] }
    };
    expect(validateConfig(invalid)).toBe(false);
  });

  it('returns false when logging.level is invalid', () => {
    const invalid = {
      ...validConfig,
      logging: { enabled: true, level: 'invalid' }
    };
    expect(validateConfig(invalid)).toBe(false);
  });

  it('returns true when logging.level is any valid level', () => {
    expect(validateConfig({ ...validConfig, logging: { enabled: true, level: 'debug' } })).toBe(true);
    expect(validateConfig({ ...validConfig, logging: { enabled: true, level: 'info' } })).toBe(true);
    expect(validateConfig({ ...validConfig, logging: { enabled: true, level: 'warn' } })).toBe(true);
    expect(validateConfig({ ...validConfig, logging: { enabled: true, level: 'error' } })).toBe(true);
  });
});
