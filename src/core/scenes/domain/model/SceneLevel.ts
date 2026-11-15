// Foundry 14 stacks a scene into levels: each has an elevation range and its
// own background, foreground and fog images.

export const LEVEL_FIT_MODES = ['fill', 'contain', 'cover', 'width', 'height'] as const;
export type LevelFitMode = (typeof LEVEL_FIT_MODES)[number];

/** Distance units; null is unbounded (bottom −∞, top +∞). */
export interface LevelElevation {
  readonly bottom: number | null;
  readonly top: number | null;
}

export interface LevelBackground {
  readonly src: string | null;
  readonly color: string;
  readonly tint: string;
  readonly alphaThreshold: number;
}

export interface LevelForeground {
  readonly src: string | null;
  readonly tint: string;
  readonly alphaThreshold: number;
}

export interface LevelPositioning {
  readonly anchorX: number;
  readonly anchorY: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly fit: LevelFitMode;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rotation: number;
}

export interface SceneLevel {
  readonly id: string;
  readonly name: string;
  readonly elevation: LevelElevation;
  readonly background: LevelBackground;
  readonly foreground: LevelForeground;
  readonly fogOverlaySrc: string | null;
  readonly positioning: LevelPositioning;
  readonly visibleLevelIds: readonly string[];
  readonly sort: number;
}

/** The levels of one scene, in stacking (`sort`) order. */
export interface SceneLevels {
  readonly sceneId: string;
  readonly levels: readonly SceneLevel[];
  /** The level the scene opens on; null when it has none. */
  readonly initialLevelId: string | null;
  /** The level the scene's legacy image fields read from and write to; null when it has none. */
  readonly firstLevelId: string | null;
  /** The top elevation the core gives a new level that names none: four grid cells' distance. */
  readonly defaultTop: number;
}

export interface LevelElevationChanges {
  readonly bottom?: number | null | undefined;
  readonly top?: number | null | undefined;
}

export interface LevelBackgroundChanges {
  readonly src?: string | null | undefined;
  readonly color?: string | undefined;
  readonly tint?: string | undefined;
  readonly alphaThreshold?: number | undefined;
}

export interface LevelForegroundChanges {
  readonly src?: string | null | undefined;
  readonly tint?: string | undefined;
  readonly alphaThreshold?: number | undefined;
}

export interface LevelPositioningChanges {
  readonly anchorX?: number | undefined;
  readonly anchorY?: number | undefined;
  readonly offsetX?: number | undefined;
  readonly offsetY?: number | undefined;
  readonly fit?: LevelFitMode | undefined;
  readonly scaleX?: number | undefined;
  readonly scaleY?: number | undefined;
  readonly rotation?: number | undefined;
}

export interface LevelChanges {
  readonly name?: string | undefined;
  readonly elevation?: LevelElevationChanges | undefined;
  readonly background?: LevelBackgroundChanges | undefined;
  readonly foreground?: LevelForegroundChanges | undefined;
  readonly fogOverlaySrc?: string | null | undefined;
  readonly positioning?: LevelPositioningChanges | undefined;
  readonly visibleLevelIds?: readonly string[] | undefined;
  readonly sort?: number | undefined;
}

export interface LevelDraft extends LevelChanges {
  readonly name: string;
}
