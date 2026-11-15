export const TRACKER_CONFIG_NAMESPACE = 'core';
/** `Combat.CONFIG_SETTING`. */
export const TRACKER_CONFIG_KEY = 'combatTrackerConfig';

/** `game.settings`, as far as the tracker configuration goes. */
export interface FoundryTrackerSettings {
  /** The stored value; on Foundry 13+ cleaned by the setting's schema. */
  get(namespace: typeof TRACKER_CONFIG_NAMESPACE, key: typeof TRACKER_CONFIG_KEY): unknown;
  /** Takes the whole value: Foundry 13+ cleans a partial one back to the defaults. */
  set(namespace: typeof TRACKER_CONFIG_NAMESPACE, key: typeof TRACKER_CONFIG_KEY, value: unknown): Promise<unknown>;
}

/** Foundry 13+: `CONFIG.Combat.settings`, the client's `CombatConfiguration`. */
export interface FoundryCombatConfiguration {
  /** The registered turn marker animations, as choices. */
  turnMarkerAnimations: { value: string }[];
}

/** Reads `CONFIG.Combat.settings` on every call; undefined before Foundry 13 or before it is set up. */
export type CombatConfigurationProvider = () => FoundryCombatConfiguration | undefined;
