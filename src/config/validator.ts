import type { ModuleConfig } from './types';

export function validateConfig(config: unknown): config is ModuleConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const c = config as Record<string, unknown>;

  return (
    hasApiServerConfig(c['apiServer']) &&
    hasFeaturesConfig(c['features']) &&
    hasCompendiumConfig(c['compendium']) &&
    hasLoggingConfig(c['logging'])
  );
}

function hasApiServerConfig(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;

  const apiServer = value as Record<string, unknown>;
  const endpoints = apiServer['endpoints'];

  return (
    typeof apiServer['url'] === 'string' &&
    typeof apiServer['updateInterval'] === 'number' &&
    typeof endpoints === 'object' &&
    endpoints !== null &&
    typeof (endpoints as Record<string, unknown>)['worldData'] === 'string' &&
    typeof (endpoints as Record<string, unknown>)['compendium'] === 'string'
  );
}

function hasFeaturesConfig(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;

  const features = value as Record<string, unknown>;

  return (
    typeof features['autoLoadCompendium'] === 'boolean' &&
    typeof features['collectWorldData'] === 'boolean' &&
    typeof features['periodicUpdates'] === 'boolean'
  );
}

function hasCompendiumConfig(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;

  const compendium = value as Record<string, unknown>;
  const autoLoad = compendium['autoLoad'];

  return (
    Array.isArray(autoLoad) &&
    autoLoad.every((item: unknown) => typeof item === 'string')
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
