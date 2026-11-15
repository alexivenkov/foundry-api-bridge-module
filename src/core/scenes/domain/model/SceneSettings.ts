// The look and behaviour of a scene beyond its size and images: weather,
// lighting environment, fog of war, the camera's starting point, linked
// playlist and journal, grid appearance. Read model of `settings` in the
// results of `get-scene`, `create-scene` and `update-scene`.

export const SCENE_GRID_STYLES = [
  'solidLines',
  'dashedLines',
  'dottedLines',
  'squarePoints',
  'diamondPoints',
  'roundPoints'
] as const;
export type SceneGridStyle = (typeof SCENE_GRID_STYLES)[number];

export const FOG_EXPLORATION_MODES = ['disabled', 'individual', 'shared'] as const;
export type FogExplorationMode = (typeof FOG_EXPLORATION_MODES)[number];

/** Darkness levels (0 = daylight, 1 = full darkness) between which the global light is on. */
export interface DarknessRange {
  readonly min: number;
  readonly max: number;
}

export interface SceneGlobalLight {
  readonly enabled: boolean;
  readonly bright: boolean;
  readonly color: string | null;
  readonly alpha: number;
  readonly luminosity: number;
  readonly saturation: number;
  readonly contrast: number;
  readonly shadows: number;
  readonly darkness: DarknessRange;
}

export interface SceneAmbience {
  /** Fraction of the color wheel, 0 ≤ hue < 1. */
  readonly hue: number;
  readonly intensity: number;
  readonly luminosity: number;
  readonly saturation: number;
  readonly shadows: number;
}

export interface SceneEnvironment {
  readonly darkness: number;
  readonly darknessLock: boolean;
  readonly blendAmbience: boolean;
  readonly globalLight: SceneGlobalLight;
  readonly baseAmbience: SceneAmbience;
  readonly darkAmbience: SceneAmbience;
}

export interface SceneFog {
  readonly exploration: FogExplorationMode;
  readonly overlaySrc: string | null;
  readonly exploredColor: string | null;
  readonly unexploredColor: string | null;
}

export interface SceneInitialView {
  readonly x: number | null;
  readonly y: number | null;
  readonly scale: number | null;
}

export interface SceneLinks {
  readonly playlistId: string | null;
  readonly playlistSoundId: string | null;
  readonly journalId: string | null;
  readonly journalPageId: string | null;
}

export interface SceneGridAppearance {
  /** A core style, or one a module registered. */
  readonly style: string;
  readonly color: string;
  readonly alpha: number;
  readonly thickness: number;
}

export interface SceneSettings {
  readonly weather: string | null;
  readonly tokenVision: boolean;
  readonly environment: SceneEnvironment;
  readonly fog: SceneFog;
  readonly initialView: SceneInitialView;
  readonly links: SceneLinks;
  readonly grid: SceneGridAppearance;
  readonly foregroundSrc: string | null;
  /** Null when unbounded (a Foundry 14 first level without a top). */
  readonly foregroundElevation: number | null;
  readonly backgroundColor: string;
  /** Foundry 14+ only; null when the scene has no level. */
  readonly initialLevelId?: string | null | undefined;
}

export interface DarknessRangeChanges {
  readonly min?: number | undefined;
  readonly max?: number | undefined;
}

export interface SceneGlobalLightChanges {
  readonly enabled?: boolean | undefined;
  readonly bright?: boolean | undefined;
  readonly color?: string | null | undefined;
  readonly alpha?: number | undefined;
  readonly luminosity?: number | undefined;
  readonly saturation?: number | undefined;
  readonly contrast?: number | undefined;
  readonly shadows?: number | undefined;
  readonly darkness?: DarknessRangeChanges | undefined;
}

export interface SceneAmbienceChanges {
  readonly hue?: number | undefined;
  readonly intensity?: number | undefined;
  readonly luminosity?: number | undefined;
  readonly saturation?: number | undefined;
  readonly shadows?: number | undefined;
}

export interface SceneInitialViewChanges {
  readonly x?: number | null | undefined;
  readonly y?: number | null | undefined;
  readonly scale?: number | null | undefined;
}

/** What the running Foundry generation stores on a scene. */
export interface SceneFeatures {
  /** Darkness lock, ambience blending and colors, the global light beyond on / off and threshold (Foundry 12+). */
  readonly environmentDetails: boolean;
  /** Grid style and thickness (Foundry 12+). */
  readonly gridStyle: boolean;
  /** Scene levels (Foundry 14+). */
  readonly levels: boolean;
}
