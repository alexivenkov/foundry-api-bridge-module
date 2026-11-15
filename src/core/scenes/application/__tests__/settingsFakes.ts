import { SceneNotFoundError } from '../../../shared';
import type {
  ConfiguredScene,
  ConfiguredSceneStore,
  CreatedConfiguredScene,
  LevelChanges,
  LevelDraft,
  LinkedCollection,
  SceneChanges,
  SceneDraft,
  SceneFeatures,
  SceneImages,
  SceneLevel,
  SceneLevelStore,
  SceneLevels,
  SceneLinkDirectory,
  SceneNavigator,
  SceneSettings,
  SceneSettingsReader,
  SceneThumbnails,
  SceneUpdateOptions,
  TableBroadcast,
  TableUser,
  TableUsers,
  ThumbnailBlocker,
  WeatherEffect,
  WeatherEffectCatalog
} from '../../domain';
import { scene } from './fakePorts';

export function settings(overrides: Partial<SceneSettings> = {}): SceneSettings {
  return {
    weather: null,
    tokenVision: true,
    environment: {
      darkness: 0,
      darknessLock: false,
      blendAmbience: true,
      globalLight: {
        enabled: false,
        bright: false,
        color: null,
        alpha: 0.5,
        luminosity: 0,
        saturation: 0,
        contrast: 0,
        shadows: 0,
        darkness: { min: 0, max: 1 }
      },
      baseAmbience: { hue: 0, intensity: 0, luminosity: 0, saturation: 0, shadows: 0 },
      darkAmbience: { hue: 257 / 360, intensity: 0, luminosity: -0.25, saturation: 0, shadows: 0 }
    },
    fog: { exploration: 'individual', overlaySrc: null, exploredColor: null, unexploredColor: null },
    initialView: { x: null, y: null, scale: null },
    links: { playlistId: null, playlistSoundId: null, journalId: null, journalPageId: null },
    grid: { style: 'solidLines', color: '#000000', alpha: 0.2, thickness: 1 },
    foregroundSrc: null,
    foregroundElevation: 20,
    backgroundColor: '#999999',
    ...overrides
  };
}

export const NEWEST: SceneFeatures = { environmentDetails: true, gridStyle: true, levels: true };
export const FOUNDRY_13: SceneFeatures = { environmentDetails: true, gridStyle: true, levels: false };
export const FOUNDRY_11: SceneFeatures = { environmentDetails: false, gridStyle: false, levels: false };

export class FakeSettingsReader implements SceneSettingsReader {
  readonly read: string[] = [];

  constructor(
    private readonly bySceneId: Record<string, SceneSettings>,
    public supported: SceneFeatures = NEWEST
  ) {}

  readSettings(sceneId: string): SceneSettings {
    this.read.push(sceneId);
    const found = this.bySceneId[sceneId];
    if (found === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return found;
  }

  features(): SceneFeatures {
    return this.supported;
  }
}

/**
 * Answers every write with the settings it was told to, as the core would
 * after storing them; the scene it answers with carries the name and
 * background written.
 */
export class FakeConfiguredStore implements ConfiguredSceneStore {
  readonly created: SceneDraft[] = [];
  readonly updated: Array<{ sceneId: string; changes: SceneChanges; options: SceneUpdateOptions | undefined }> = [];
  createsNothing = false;
  /** The images this store's core drops from a new scene. */
  leavesOut: SceneImages | null = null;
  answer: SceneSettings = settings({ weather: 'rain' });

  createConfiguredScene(draft: SceneDraft): Promise<CreatedConfiguredScene | null> {
    this.created.push(draft);
    if (this.createsNothing) {
      return Promise.resolve(null);
    }
    const created = scene({
      id: 'created',
      name: draft.name,
      backgroundSrc: this.leavesOut?.backgroundSrc !== undefined ? null : (draft.backgroundSrc ?? null)
    });
    return Promise.resolve({ scene: created, settings: this.answer, missingImages: this.leavesOut });
  }

  updateConfiguredScene(
    sceneId: string,
    changes: SceneChanges,
    options?: SceneUpdateOptions
  ): Promise<ConfiguredScene> {
    this.updated.push({ sceneId, changes, options });
    const updated = scene({
      id: sceneId,
      ...(changes.name !== undefined ? { name: changes.name } : {}),
      ...(changes.backgroundSrc !== undefined ? { backgroundSrc: changes.backgroundSrc } : {})
    });
    return Promise.resolve({ scene: updated, settings: this.answer });
  }
}

export class FakeLinks implements SceneLinkDirectory {
  readonly asked: string[] = [];

  constructor(
    private readonly playlists: readonly LinkedCollection[] = [],
    private readonly journals: readonly LinkedCollection[] = []
  ) {}

  findPlaylist(playlistId: string): LinkedCollection | null {
    this.asked.push(`playlist:${playlistId}`);
    return this.playlists.find((playlist) => playlist.id === playlistId) ?? null;
  }

  findJournalEntry(journalId: string): LinkedCollection | null {
    this.asked.push(`journal:${journalId}`);
    return this.journals.find((entry) => entry.id === journalId) ?? null;
  }
}

export class FakeWeather implements WeatherEffectCatalog {
  asked = 0;

  constructor(private readonly effects: readonly WeatherEffect[] | null) {}

  listWeatherEffects(): readonly WeatherEffect[] | null {
    this.asked += 1;
    return this.effects;
  }
}

export function sceneLevel(id: string, overrides: Partial<SceneLevel> = {}): SceneLevel {
  return {
    id,
    name: id,
    elevation: { bottom: 0, top: 20 },
    background: { src: null, color: '#999999', tint: '#ffffff', alphaThreshold: 0.75 },
    foreground: { src: null, tint: '#ffffff', alphaThreshold: 0.75 },
    fogOverlaySrc: null,
    positioning: { anchorX: 0.5, anchorY: 0.5, offsetX: 0, offsetY: 0, fit: 'fill', scaleX: 1, scaleY: 1, rotation: 0 },
    visibleLevelIds: [],
    sort: 0,
    ...overrides
  };
}

export class FakeLevelStore implements SceneLevelStore {
  readonly created: Array<{ sceneId: string; draft: LevelDraft }> = [];
  readonly updated: Array<{ sceneId: string; levelId: string; changes: LevelChanges }> = [];
  readonly deleted: Array<{ sceneId: string; levelId: string }> = [];
  available = true;
  createsNothing = false;

  constructor(private readonly levelsBySceneId: Record<string, SceneLevel[]> = {}) {}

  levelsAvailable(): boolean {
    return this.available;
  }

  readLevels(sceneId: string): SceneLevels {
    const levels = this.levelsBySceneId[sceneId] ?? [];
    return {
      sceneId,
      levels,
      initialLevelId: levels[0]?.id ?? null,
      firstLevelId: levels[0]?.id ?? null,
      defaultTop: 20
    };
  }

  createLevel(sceneId: string, draft: LevelDraft): Promise<SceneLevel | null> {
    this.created.push({ sceneId, draft });
    return Promise.resolve(this.createsNothing ? null : sceneLevel('new', { name: draft.name }));
  }

  updateLevel(sceneId: string, levelId: string, changes: LevelChanges): Promise<SceneLevel> {
    this.updated.push({ sceneId, levelId, changes });
    return Promise.resolve(sceneLevel(levelId, changes.name !== undefined ? { name: changes.name } : {}));
  }

  deleteLevel(sceneId: string, levelId: string): Promise<void> {
    this.deleted.push({ sceneId, levelId });
    return Promise.resolve();
  }
}

export class FakeNavigator implements SceneNavigator {
  readonly viewed: Array<{ sceneId: string; levelId: string | undefined }> = [];
  readonly activated: string[] = [];

  activateScene(sceneId: string): Promise<void> {
    this.activated.push(sceneId);
    return Promise.resolve();
  }

  viewScene(sceneId: string, levelId?: string): Promise<void> {
    this.viewed.push({ sceneId, levelId });
    return Promise.resolve();
  }
}

export class FakeBroadcast implements TableBroadcast {
  readonly pulled: Array<{ sceneId: string; userIds: readonly string[]; levelId: string | undefined }> = [];
  readonly preloaded: Array<{ sceneId: string; levelId: string | undefined }> = [];
  readonly fogResets: string[] = [];

  pullUsers(sceneId: string, userIds: readonly string[], levelId?: string): void {
    this.pulled.push({ sceneId, userIds, levelId });
  }

  preloadScene(sceneId: string, levelId?: string): Promise<void> {
    this.preloaded.push({ sceneId, levelId });
    return Promise.resolve();
  }

  resetFog(sceneId: string): void {
    this.fogResets.push(sceneId);
  }
}

export class FakeUsers implements TableUsers {
  constructor(
    private readonly users: readonly TableUser[],
    private readonly self: string | null
  ) {}

  listUsers(): readonly TableUser[] {
    return this.users;
  }

  currentUserId(): string | null {
    return this.self;
  }
}

export class FakeThumbnails implements SceneThumbnails {
  blocker: ThumbnailBlocker | null = null;
  readonly regenerated: string[] = [];

  thumbnailBlocker(): ThumbnailBlocker | null {
    return this.blocker;
  }

  regenerateThumbnail(sceneId: string): Promise<string | null> {
    this.regenerated.push(sceneId);
    return Promise.resolve(`worlds/w/assets/scenes/${sceneId}-thumb.webp`);
  }
}
