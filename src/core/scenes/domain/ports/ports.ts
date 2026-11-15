import type { AsciiMapInput } from '@/core/shared/domain';
import type {
  ConfiguredScene,
  CreatedConfiguredScene,
  Scene,
  SceneChanges,
  SceneCloneOverrides,
  SceneDraft,
  SceneListing,
  SceneUpdateOptions
} from '@/core/scenes/domain/model/Scene';
import type { SceneContents } from '@/core/scenes/domain/model/SceneContents';
import type { LevelChanges, LevelDraft, SceneLevel, SceneLevels } from '@/core/scenes/domain/model/SceneLevel';
import type { SceneFeatures, SceneSettings } from '@/core/scenes/domain/model/SceneSettings';
import type { TableUser, ThumbnailBlocker, WeatherEffect } from '@/core/scenes/domain/model/SceneTable';
import type { ViewportCapture } from '@/core/scenes/domain/model/ViewportCapture';

// Every method that names a scene throws SceneNotFoundError when it is gone.
// `createConfiguredScene` and `cloneScene` resolve to null when the core
// created nothing.

export interface SceneStore {
  deleteScene(sceneId: string): Promise<void>;
  cloneScene(sourceId: string, overrides: SceneCloneOverrides): Promise<Scene | null>;
}

/**
 * Creates and updates scenes, answering with their settings as well, read
 * from the document the core returned: a scene just created may not be in
 * the world collection yet.
 */
export interface ConfiguredSceneStore {
  createConfiguredScene(draft: SceneDraft): Promise<CreatedConfiguredScene | null>;
  updateConfiguredScene(sceneId: string, changes: SceneChanges, options?: SceneUpdateOptions): Promise<ConfiguredScene>;
}

/** Which scene the table plays on, and which one this client is looking at. */
export interface SceneNavigator {
  /** Makes the scene the active one for every connected client. */
  activateScene(sceneId: string): Promise<void>;
  /** Draws the scene, or one of its levels, on this client's canvas only. */
  viewScene(sceneId: string, levelId?: string): Promise<void>;
}

/** The settings of a scene as stored now. Throws SceneNotFoundError for a missing scene. */
export interface SceneSettingsReader {
  readSettings(sceneId: string): SceneSettings;
  features(): SceneFeatures;
}

export interface LinkedCollection {
  readonly id: string;
  /** Sounds of a playlist, pages of a journal entry. */
  readonly childIds: readonly string[];
}

/** The world documents a scene can link to. */
export interface SceneLinkDirectory {
  findPlaylist(playlistId: string): LinkedCollection | null;
  findJournalEntry(journalId: string): LinkedCollection | null;
}

export interface WeatherEffectCatalog {
  /** Null when the registry cannot be read. */
  listWeatherEffects(): readonly WeatherEffect[] | null;
}

export interface TableUsers {
  listUsers(): readonly TableUser[];
  /** The user this module runs as. */
  currentUserId(): string | null;
}

/** Messages to every connected client. They are sent, not awaited: nothing reports back. */
export interface TableBroadcast {
  pullUsers(sceneId: string, userIds: readonly string[], levelId?: string): void;
  /** Resolves once this client has loaded (Foundry 14) or the request is sent (older cores). */
  preloadScene(sceneId: string, levelId?: string): Promise<void>;
  /** Asks the server to delete every user's fog exploration of the scene. */
  resetFog(sceneId: string): void;
}

export interface SceneThumbnails {
  thumbnailBlocker(sceneId: string): ThumbnailBlocker | null;
  /** Draws and stores a new thumbnail; resolves to the stored path. */
  regenerateThumbnail(sceneId: string): Promise<string | null>;
}

// Throws SceneNotFoundError for a missing scene. `updateLevel` and
// `deleteLevel` expect a level the scene has; `createLevel` resolves to null
// when the core created nothing.
export interface SceneLevelStore {
  levelsAvailable(): boolean;
  readLevels(sceneId: string): SceneLevels;
  createLevel(sceneId: string, draft: LevelDraft): Promise<SceneLevel | null>;
  updateLevel(sceneId: string, levelId: string, changes: LevelChanges): Promise<SceneLevel>;
  deleteLevel(sceneId: string, levelId: string): Promise<void>;
}

// Synchronous by design: scenes and what is placed on them live in memory.
export interface SceneReader {
  listScenes(): readonly SceneListing[];
  readScene(sceneId: string): SceneContents;
}

export type MapCollisionTest = NonNullable<AsciiMapInput['collisionBackend']>;

/** The core's movement collision test. It answers for the scene on the canvas, and for no other. */
export interface MovementCollisions {
  /** Undefined when no canvas can answer collision tests. */
  collisionTest(): MapCollisionTest | undefined;
}

export interface SceneViewport {
  /** The scene this client's canvas has drawn; null while it shows none. */
  viewedSceneId(): string | null;
  /** A picture of what the canvas shows; null when no scene is drawn. Throws when rendering fails. */
  capture(): ViewportCapture | null;
}
