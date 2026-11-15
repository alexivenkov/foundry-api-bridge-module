import type {
  SceneAmbienceChanges,
  SceneGlobalLightChanges,
  SceneGridStyle,
  SceneInitialViewChanges,
  SceneSettings
} from './SceneSettings';

export const SCENE_GRID_TYPES = [
  'gridless',
  'square',
  'hexPointyOdd',
  'hexPointyEven',
  'hexFlatOdd',
  'hexFlatEven'
] as const;
export type SceneGridType = (typeof SCENE_GRID_TYPES)[number];

export interface SceneGrid {
  readonly type: SceneGridType;
  /** Pixels per cell. */
  readonly size: number;
  /** What one cell measures, in `units`. */
  readonly distance: number;
  readonly units: string;
}

/** A scene as the management commands report it. */
export interface Scene {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly active: boolean;
  readonly width: number;
  readonly height: number;
  readonly backgroundSrc: string | null;
  /** Whether the scene is shown in the navigation bar. */
  readonly navigation: boolean;
  readonly navName: string | null;
  readonly navOrder: number;
  readonly folderName: string | null;
  readonly grid: SceneGrid;
}

/** One line of the scene directory. */
export interface SceneListing {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly image: string;
}

export interface SceneGridChanges {
  readonly type?: SceneGridType | undefined;
  readonly size?: number | undefined;
  readonly distance?: number | undefined;
  readonly units?: string | undefined;
  readonly style?: SceneGridStyle | undefined;
  readonly color?: string | undefined;
  readonly alpha?: number | undefined;
  readonly thickness?: number | undefined;
}

/**
 * The attributes a caller may set. Omitted ones are left to the core default
 * (create) or untouched (update); `null` clears an image, the navigation name
 * or the folder.
 */
export interface SceneChanges {
  readonly name?: string | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly grid?: SceneGridChanges | undefined;
  readonly backgroundSrc?: string | null | undefined;
  readonly foregroundSrc?: string | null | undefined;
  readonly padding?: number | undefined;
  readonly navigation?: boolean | undefined;
  readonly navName?: string | null | undefined;
  readonly navOrder?: number | undefined;
  /** Whether tokens leave explored areas revealed. */
  readonly fogExploration?: boolean | undefined;
  /** From 0 (daylight) to 1 (full darkness). */
  readonly darkness?: number | undefined;
  readonly folderId?: string | null | undefined;
  /** `null` removes the weather. */
  readonly weather?: string | null | undefined;
  readonly tokenVision?: boolean | undefined;
  readonly fogOverlaySrc?: string | null | undefined;
  /** `null` restores the core's default color. */
  readonly fogExploredColor?: string | null | undefined;
  readonly fogUnexploredColor?: string | null | undefined;
  readonly darknessLock?: boolean | undefined;
  readonly blendAmbience?: boolean | undefined;
  readonly globalLight?: SceneGlobalLightChanges | undefined;
  readonly baseAmbience?: SceneAmbienceChanges | undefined;
  readonly darkAmbience?: SceneAmbienceChanges | undefined;
  /** `null` resets the whole initial view. */
  readonly initialView?: SceneInitialViewChanges | null | undefined;
  readonly playlistId?: string | null | undefined;
  readonly playlistSoundId?: string | null | undefined;
  readonly journalId?: string | null | undefined;
  readonly journalPageId?: string | null | undefined;
  readonly foregroundElevation?: number | undefined;
  readonly backgroundColor?: string | undefined;
  /** Foundry 14+; `null` falls back to the first level. */
  readonly initialLevelId?: string | null | undefined;
}

export interface SceneDraft extends SceneChanges {
  readonly name: string;
}

/** How clients carry out an update; not stored on the scene. */
export interface SceneUpdateOptions {
  /** Clients viewing the scene fade to the new darkness over this many milliseconds. */
  readonly darknessAnimationMs?: number | undefined;
}

/**
 * The attributes Foundry 14 keeps on a scene's first level rather than on the
 * scene: its images, fog overlay, foreground elevation and background color.
 */
export type SceneImages = Pick<
  SceneChanges,
  'backgroundSrc' | 'foregroundSrc' | 'fogOverlaySrc' | 'foregroundElevation' | 'backgroundColor'
>;

export interface ConfiguredScene {
  readonly scene: Scene;
  readonly settings: SceneSettings;
}

export interface CreatedConfiguredScene extends ConfiguredScene {
  /** The images and other first-level fields of the draft the core left out of the new scene; null when none. */
  readonly missingImages: SceneImages | null;
}

/** What a copy of a scene may differ in from its source. */
export interface SceneCloneOverrides {
  readonly name?: string | undefined;
  readonly folderId?: string | null | undefined;
}
