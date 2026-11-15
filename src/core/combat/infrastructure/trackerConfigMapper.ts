import type { CombatTrackerConfig, TurnMarkerConfig } from '@/core/combat/domain';

// Defaults of the setting's schema (`CombatConfiguration.registerSettings`,
// Foundry 13–14). Before 13 the setting is a plain object, stored as `{}`
// until the tracker configuration is first saved.
const DEFAULT_ANIMATION = 'spin';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonBlankString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function toTurnMarker(value: unknown): TurnMarkerConfig {
  const marker = isRecord(value) ? value : {};
  return {
    enabled: booleanOr(marker['enabled'], true),
    animation: nonBlankString(marker['animation']) ?? DEFAULT_ANIMATION,
    src: nonBlankString(marker['src']),
    disposition: booleanOr(marker['disposition'], false)
  };
}

export function toTrackerConfig(stored: unknown, withTurnMarker: boolean): CombatTrackerConfig {
  const value = isRecord(stored) ? stored : {};
  const config: CombatTrackerConfig = {
    resource: nonBlankString(value['resource']),
    skipDefeated: booleanOr(value['skipDefeated'], false)
  };
  return withTurnMarker ? { ...config, turnMarker: toTurnMarker(value['turnMarker']) } : config;
}

/**
 * The whole value to store: the current one with every field the context
 * knows replaced, so nothing else in it is lost where the core keeps it as a
 * plain object. Blank is how the core stores "no resource" and "default marker".
 */
export function toFoundryTrackerConfig(stored: unknown, config: CombatTrackerConfig): Record<string, unknown> {
  const current = isRecord(stored) ? stored : {};
  const value: Record<string, unknown> = {
    ...current,
    resource: config.resource ?? '',
    skipDefeated: config.skipDefeated
  };
  if (config.turnMarker !== undefined) {
    const marker = config.turnMarker;
    value['turnMarker'] = {
      ...(isRecord(current['turnMarker']) ? current['turnMarker'] : {}),
      enabled: marker.enabled,
      animation: marker.animation,
      src: marker.src ?? '',
      disposition: marker.disposition
    };
  }
  return value;
}
