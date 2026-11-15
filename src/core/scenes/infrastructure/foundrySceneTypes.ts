import type { FoundryActorWithAttributes, FoundryScenesCollection } from '@/core/shared';

// What the scenes context reads from the documents placed on a scene. Walls,
// notes and tokens have richer types in their own contexts; `get-scene` only
// needs these few fields, and needs the numeric ones raw.

export interface FoundrySceneNote {
  x: number;
  y: number;
  text: string | undefined;
  /** A getter of the client document: the text, else the linked page or entry name. */
  label: string | undefined;
  entryId: string | null | undefined;
}

export interface FoundrySceneWall {
  _id: string;
  c: number[];
  move: number;
  sight: number;
  door: number;
  ds: number | undefined;
}

export interface FoundrySceneLight {
  x: number;
  y: number;
  config:
    | {
        bright: number | undefined;
        dim: number | undefined;
        color: string | null | undefined;
        angle: number | undefined;
      }
    | undefined;
  walls: boolean | undefined;
  hidden: boolean | undefined;
}

export interface FoundrySceneTile {
  x: number;
  y: number;
  width: number | undefined;
  height: number | undefined;
  texture: { src: string | undefined } | undefined;
  hidden: boolean | undefined;
  elevation: number | undefined;
  rotation: number | undefined;
}

export interface FoundrySceneDrawing {
  x: number;
  y: number;
  shape:
    | {
        type: string | undefined;
        width: number | undefined;
        height: number | undefined;
        points: number[] | undefined;
      }
    | undefined;
  text: string | undefined;
  hidden: boolean | undefined;
  fillColor: string | null | undefined;
  strokeColor: string | null | undefined;
}

export interface FoundrySceneRegion {
  id: string;
  name: string | undefined;
  color: string | null | undefined;
  shapes: Array<{ type: string | undefined }> | undefined;
}

export interface FoundrySceneTokenActor extends FoundryActorWithAttributes {
  id: string;
  statuses?: Set<string>;
}

export interface FoundrySceneToken {
  id: string;
  name: string | undefined;
  x: number;
  y: number;
  width: number | undefined;
  height: number | undefined;
  elevation: number | undefined;
  hidden: boolean | undefined;
  disposition: number | undefined;
  actor: FoundrySceneTokenActor | null;
}

export interface FoundrySceneGrid {
  type: number | undefined;
  size: number | undefined;
  distance: number | undefined;
  units: string | undefined;
}

export type FoundryPlaceables<TDocument> = { contents: TDocument[] } | null | undefined;

/** The stored fields of a Level (`BaseLevel` schema, verified against Foundry 14.368). */
export interface FoundryLevelSource {
  name?: string | undefined;
  /** null is unbounded; the client document turns it into ±Infinity, so it is read from here. */
  elevation?: { bottom?: number | null; top?: number | null } | undefined;
  background?: { src?: string | null; color?: string | null; tint?: string | null; alphaThreshold?: number } | undefined;
  foreground?: { src?: string | null; tint?: string | null; alphaThreshold?: number } | undefined;
  fog?: { src?: string | null } | undefined;
  textures?:
    | {
        anchorX?: number;
        anchorY?: number;
        offsetX?: number;
        offsetY?: number;
        fit?: string;
        scaleX?: number;
        scaleY?: number;
        rotation?: number;
      }
    | undefined;
  visibility?: { levels?: string[] } | undefined;
  sort?: number | undefined;
}

/** A Level document (`BaseLevel` schema, Foundry 14): the images of a scene belong to its levels there. */
export interface FoundrySceneLevel {
  id: string;
  background?: { src?: string | null } | undefined;
  foreground?: { src?: string | null } | undefined;
  _source?: FoundryLevelSource | undefined;
}

/** A Level as the levels commands use it. */
export interface FoundryLevelDocument extends FoundrySceneLevel {
  name?: string | undefined;
  sort?: number | undefined;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
}

/** `Scene#levels`, an embedded collection; the client adds `sorted` while preparing the scene. */
export interface FoundryLevelCollection {
  contents: FoundryLevelDocument[];
  get(id: string): FoundryLevelDocument | undefined;
  sorted?: FoundryLevelDocument[] | undefined;
}

/**
 * The stored scene settings (`BaseScene` schema). Read from `_source`: the
 * client document turns colors into Color objects, links into documents and
 * a level's open elevation into Infinity. Verified against 13.351 and
 * 14.368; the flat legacy keys are the Foundry 11 schema (not installed).
 */
export interface FoundrySceneSource {
  weather?: string | null | undefined;
  tokenVision?: boolean | undefined;
  /** Foundry 11–13. */
  foreground?: string | null | undefined;
  foregroundElevation?: number | null | undefined;
  backgroundColor?: string | null | undefined;
  initial?: { x?: number | null; y?: number | null; scale?: number | null } | undefined;
  /** Foundry 14. */
  initialLevel?: string | null | undefined;
  grid?: { style?: string; color?: string | null; alpha?: number; thickness?: number; distance?: number } | undefined;
  /** `exploration` and `overlay` up to Foundry 13, `mode` from 14. */
  fog?:
    | {
        exploration?: boolean;
        mode?: number;
        overlay?: string | null;
        colors?: { explored?: string | null; unexplored?: string | null };
      }
    | undefined;
  /** Foundry 12+. */
  environment?: FoundrySceneEnvironmentSource | undefined;
  playlist?: string | null | undefined;
  playlistSound?: string | null | undefined;
  journal?: string | null | undefined;
  journalEntryPage?: string | null | undefined;
  /** Foundry 11 flat keys. */
  darkness?: number | undefined;
  globalLight?: boolean | undefined;
  globalLightThreshold?: number | null | undefined;
  fogExploration?: boolean | undefined;
  fogOverlay?: string | null | undefined;
  fogExploredColor?: string | null | undefined;
  fogUnexploredColor?: string | null | undefined;
}

export interface FoundryAmbienceSource {
  hue?: number;
  intensity?: number;
  luminosity?: number;
  saturation?: number;
  shadows?: number;
}

export interface FoundrySceneEnvironmentSource {
  darknessLevel?: number;
  darknessLock?: boolean;
  cycle?: boolean;
  globalLight?: {
    enabled?: boolean;
    bright?: boolean;
    color?: string | null;
    alpha?: number;
    luminosity?: number;
    saturation?: number;
    contrast?: number;
    shadows?: number;
    darkness?: { min?: number; max?: number };
  };
  base?: FoundryAmbienceSource;
  dark?: FoundryAmbienceSource;
}

/** The Scene document fields the context reads and writes (`BaseScene` schema, Foundry 13–14). */
export interface FoundrySceneDocument {
  id: string;
  uuid: string;
  name: string;
  active: boolean;
  /** The v9 background path. It left the schema in v10 and reads as undefined on Foundry 13–14. */
  img: string | undefined;
  /** The thumbnail the core shows for the scene, generated from its background. */
  thumb: string | null | undefined;
  width: number | undefined;
  height: number | undefined;
  /** A field up to Foundry 13. Foundry 14 has no such field, only a getter deprecated until 16. */
  background: { src?: string | null } | string | null | undefined;
  /**
   * Foundry 14: the level the core's own compatibility getters serve
   * `background` and `foreground` from. Absent on earlier versions.
   */
  firstLevel?: FoundrySceneLevel | undefined;
  navigation: boolean | undefined;
  navName: string | null | undefined;
  navOrder: number | undefined;
  folder: { id: string; name: string } | null | undefined;
  grid: FoundrySceneGrid | undefined;
  /** Pre-v12 path of the darkness level; later cores keep it in `environment`. */
  darkness: number | undefined;
  environment?: { darknessLevel?: number } | undefined;
  notes: FoundryPlaceables<FoundrySceneNote>;
  walls: FoundryPlaceables<FoundrySceneWall>;
  lights: FoundryPlaceables<FoundrySceneLight>;
  tiles: FoundryPlaceables<FoundrySceneTile>;
  drawings: FoundryPlaceables<FoundrySceneDrawing>;
  regions: FoundryPlaceables<FoundrySceneRegion>;
  tokens: FoundryPlaceables<FoundrySceneToken>;
  _source?: FoundrySceneSource | undefined;
  /** Foundry 11–13: the effective foreground elevation, which the client defaults to four grid cells. */
  foregroundElevation?: number | null | undefined;
  /** Foundry 14: the stored initial level, else the first one. */
  initialLevel?: FoundryLevelDocument | undefined;
  levels?: FoundryLevelCollection | undefined;
  /** `options` are update options such as `animateDarkness` and `diff`. */
  update(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
  /** With `save`, resolves to nothing when a hook vetoes the creation of the copy. */
  clone(
    data?: Record<string, unknown>,
    options?: { save?: boolean }
  ): Promise<FoundrySceneDocument | null | undefined> | FoundrySceneDocument;
  /** Client-local: draws the scene (Foundry 14: `level`, one of its levels) on this client's canvas. */
  view(options?: { level?: string }): Promise<unknown>;
  activate(): Promise<unknown>;
  /** Foundry 13+: asks each connected user's client to view the scene (14: with view options). */
  pullUsers?(users: string[], viewOptions?: { level?: string }): void;
  /** Throws when the canvas is disabled or the user may not upload files. */
  createThumbnail?(options?: Record<string, unknown>): Promise<{ thumb?: string | null }>;
  createEmbeddedDocuments?(
    embeddedName: 'Level',
    data: Record<string, unknown>[]
  ): Promise<FoundryLevelDocument[] | undefined>;
}

export interface FoundrySceneClass {
  create(data: Record<string, unknown>): Promise<FoundrySceneDocument | null | undefined>;
}

/** The second argument is `push` up to Foundry 13 and `{ broadcast, level }` from 14. */
export type FoundryScenePreload = (
  sceneId: string,
  options?: boolean | { broadcast?: boolean; level?: string }
) => unknown;

export interface FoundrySceneCollection extends FoundryScenesCollection<FoundrySceneDocument> {
  forEach(fn: (scene: FoundrySceneDocument) => void): void;
  preload?: FoundryScenePreload | undefined;
}

export interface FoundryLinkedDocument {
  id: string;
}

/** A playlist with its sounds, a journal entry with its pages. */
export interface FoundryLinkTarget {
  id: string;
  sounds?: { contents: FoundryLinkedDocument[] } | undefined;
  pages?: { contents: FoundryLinkedDocument[] } | undefined;
}

export interface FoundryTableUser {
  id: string;
  /** Connected right now. */
  active?: boolean | undefined;
}

/**
 * What the scenes context reads from `game`. Everything beyond `scenes` is
 * optional: those collections and services are read only by the commands
 * that need them.
 */
export interface FoundrySceneGame {
  scenes: FoundrySceneCollection;
  playlists?: { get(id: string): FoundryLinkTarget | undefined } | undefined;
  journal?: { get(id: string): FoundryLinkTarget | undefined } | undefined;
  users?: { contents: FoundryTableUser[] } | undefined;
  user?: { id: string } | null | undefined;
  socket?: { emit(event: string, ...args: unknown[]): unknown } | null | undefined;
  settings?: { get(namespace: string, key: string): unknown } | undefined;
  i18n?: { localize(key: string): string } | undefined;
}
