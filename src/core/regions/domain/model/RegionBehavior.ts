import type {
  CoreBehaviorType,
  DarknessMode,
  SurfacePlacement,
  TeleportPlacement,
  TextVisibility
} from '@/core/regions/domain/value-objects';

export interface AdjustDarknessLevelSettings {
  readonly mode: DarknessMode;
  readonly modifier: number;
}

export interface DisplayScrollingTextSettings {
  readonly events: readonly string[];
  readonly text: string;
  readonly color: string;
  readonly visibility: TextVisibility;
  readonly once: boolean;
}

export interface ExecuteMacroSettings {
  readonly events: readonly string[];
  readonly macroUuid: string | null;
  readonly everyone: boolean;
}

export interface ExecuteScriptSettings {
  readonly events: readonly string[];
  readonly source: string;
}

export interface ModifyMovementCostSettings {
  readonly difficulties: Readonly<Record<string, number | null>>;
}

export interface PauseGameSettings {
  readonly once: boolean;
}

export type SuppressWeatherSettings = Readonly<Record<string, never>>;

export interface TeleportDialogTexts {
  readonly revealed: string | null;
  readonly unrevealed: string | null;
}

export interface TeleportTransition {
  readonly type: string | null;
  readonly duration: number;
}

/** The options after `choice` exist on Foundry 14+ only. */
export interface TeleportTokenSettings {
  readonly destinationUuids: readonly string[];
  readonly choice: boolean;
  readonly placement?: TeleportPlacement | undefined;
  readonly snap?: boolean | undefined;
  readonly revealed?: boolean | undefined;
  readonly dialog?: TeleportDialogTexts | undefined;
  readonly transition?: TeleportTransition | undefined;
}

export interface ToggleBehaviorSettings {
  readonly events: readonly string[];
  readonly enableUuids: readonly string[];
  readonly disableUuids: readonly string[];
}

export interface ApplyActiveEffectSettings {
  readonly effectUuids: readonly string[];
}

export interface ChangeLevelSettings {
  readonly movementActions: readonly string[];
}

export interface DefineSurfaceSettings {
  readonly placement: SurfacePlacement;
  readonly light: boolean;
  readonly move: boolean;
  readonly sight: boolean;
  readonly sound: boolean;
  readonly occlusion: boolean;
  readonly exposure: boolean;
  readonly culling: boolean;
}

export interface CoreBehaviorSettingsMap {
  adjustDarknessLevel: AdjustDarknessLevelSettings;
  displayScrollingText: DisplayScrollingTextSettings;
  executeMacro: ExecuteMacroSettings;
  executeScript: ExecuteScriptSettings;
  modifyMovementCost: ModifyMovementCostSettings;
  pauseGame: PauseGameSettings;
  suppressWeather: SuppressWeatherSettings;
  teleportToken: TeleportTokenSettings;
  toggleBehavior: ToggleBehaviorSettings;
  applyActiveEffect: ApplyActiveEffectSettings;
  changeLevel: ChangeLevelSettings;
  defineSurface: DefineSurfaceSettings;
}

type ShallowInput<V> = V extends readonly unknown[]
  ? V
  : V extends object
    ? { readonly [P in keyof V]?: V[P] | undefined }
    : V;

/** What a caller sends: every field optional, nested objects too (an omitted one is a core default or kept). */
export type SettingsInput<T> = { readonly [K in keyof T]?: ShallowInput<T[K]> | undefined };

/** A behavior of a type this module knows: its settings in the domain vocabulary. */
export type CoreBehaviorConfig = {
  [K in CoreBehaviorType]: { readonly kind: K; readonly settings: CoreBehaviorSettingsMap[K] };
}[CoreBehaviorType];

export type CoreBehaviorConfigInput = {
  [K in CoreBehaviorType]: { readonly kind: K; readonly settings: SettingsInput<CoreBehaviorSettingsMap[K]> };
}[CoreBehaviorType];

/** A type registered by a game system or module: its stored data, passed through untouched. */
export interface OpaqueBehaviorConfig {
  readonly kind: 'opaque';
  readonly data: Readonly<Record<string, unknown>>;
}

export type RegionBehaviorConfig = CoreBehaviorConfig | OpaqueBehaviorConfig;
export type RegionBehaviorConfigInput = CoreBehaviorConfigInput | OpaqueBehaviorConfig;

export interface RegionBehavior {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly disabled: boolean;
  readonly config: RegionBehaviorConfig;
}

export interface RegionBehaviorDraft {
  readonly type: string;
  readonly name?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly config: RegionBehaviorConfigInput;
}

/**
 * A change of a behavior. With `type` set (a new type) the config replaces the old
 * one entirely; without it the config is merged into the current one.
 */
export interface RegionBehaviorChanges {
  readonly type?: string | undefined;
  readonly name?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly config?: RegionBehaviorConfigInput | undefined;
}

export function isCoreBehaviorConfig(config: RegionBehaviorConfigInput): config is CoreBehaviorConfigInput {
  return config.kind !== 'opaque';
}
