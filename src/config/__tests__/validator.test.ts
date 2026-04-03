import { validateConfig } from '@/config/validator';
import type { ModuleConfig } from '@/config/types';

const validConfig: ModuleConfig = {
  webSocket: {
    enabled: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10
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

  it('returns false when webSocket is missing', () => {
    const invalid = { ...validConfig, webSocket: undefined };
    expect(validateConfig(invalid)).toBe(false);
  });

  it('returns false when webSocket.enabled is not boolean', () => {
    const invalid = {
      ...validConfig,
      webSocket: { ...validConfig.webSocket, enabled: 'yes' }
    };
    expect(validateConfig(invalid)).toBe(false);
  });

  it('returns false when logging is missing', () => {
    const invalid = { ...validConfig, logging: undefined };
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
