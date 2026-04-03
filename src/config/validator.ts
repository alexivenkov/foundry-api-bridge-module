import type { ModuleConfig } from '@/config/types';

export function validateConfig(config: unknown): config is ModuleConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const c = config as Record<string, unknown>;

  return (
    hasWebSocketConfig(c['webSocket']) &&
    hasLoggingConfig(c['logging'])
  );
}

function hasWebSocketConfig(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;

  const ws = value as Record<string, unknown>;

  return (
    typeof ws['enabled'] === 'boolean' &&
    typeof ws['reconnectInterval'] === 'number' &&
    typeof ws['maxReconnectAttempts'] === 'number'
  );
}

function hasLoggingConfig(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;

  const logging = value as Record<string, unknown>;
  const validLevels = ['debug', 'info', 'warn', 'error'];
  const level = logging['level'];

  return (
    typeof logging['enabled'] === 'boolean' &&
    typeof level === 'string' &&
    validLevels.includes(level)
  );
}
