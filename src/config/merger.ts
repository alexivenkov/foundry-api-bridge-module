import type { ModuleConfig, DeepPartial } from '@/config/types';

export function mergeWithDefaults(
  userConfig: DeepPartial<ModuleConfig>,
  defaults: ModuleConfig
): ModuleConfig {
  return deepMerge(defaults, userConfig) as ModuleConfig;
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (!isObject(target) || !isObject(source)) {
    return source !== undefined ? source : target;
  }

  const result: Record<string, unknown> = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (Array.isArray(sourceValue)) {
      result[key] = sourceValue;
    } else if (isObject(sourceValue) && isObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  }

  return result;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
