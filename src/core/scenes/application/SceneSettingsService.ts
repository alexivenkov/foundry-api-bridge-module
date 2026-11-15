import { requireScene, type SceneLocator } from '@/core/shared';
import {
  JournalEntryNotFoundError,
  JournalPageNotFoundError,
  PlaylistNotFoundError,
  PlaylistSoundNotFoundError,
  SceneCreationCancelledError,
  SceneLinkWithoutParentError,
  assertKnownWeather,
  assertSceneFeatures,
  requireLevel,
  resolveElevation,
  resolveGlobalLightDarkness,
  resolveLink,
  type ConfiguredScene,
  type ConfiguredSceneStore,
  type DarknessRange,
  type LinkErrors,
  type SceneChanges,
  type SceneLevelStore,
  type SceneLinkDirectory,
  type SceneLinks,
  type SceneSettings,
  type SceneSettingsReader,
  type WeatherEffect,
  type WeatherEffectCatalog
} from '@/core/scenes/domain';
import type { CreateSceneCommand, DescribeSceneQuery, UpdateSceneCommand } from './commands';
import type { SceneDescription, SceneQueryService } from './SceneQueryService';

export interface SceneSettingsServiceDependencies {
  readonly scenes: SceneLocator;
  readonly store: ConfiguredSceneStore;
  /** Describes what is placed on the scene. */
  readonly query: SceneQueryService;
  readonly settings: SceneSettingsReader;
  readonly links: SceneLinkDirectory;
  readonly weather: WeatherEffectCatalog;
  readonly levels: SceneLevelStore;
}

export interface SceneDetails extends SceneDescription {
  readonly settings: SceneSettings;
}

interface CurrentSettings {
  readonly links: SceneLinks;
  readonly globalLightDarkness: DarknessRange;
}

const NEW_SCENE: CurrentSettings = {
  links: { playlistId: null, playlistSoundId: null, journalId: null, journalPageId: null },
  globalLightDarkness: { min: 0, max: 1 }
};

const PLAYLIST_LINK_ERRORS: LinkErrors = {
  parentNotFound: (id) => new PlaylistNotFoundError(id),
  childNotFound: (id) => new PlaylistSoundNotFoundError(id),
  childWithoutParent: () => new SceneLinkWithoutParentError('playlistSoundId')
};

const JOURNAL_LINK_ERRORS: LinkErrors = {
  parentNotFound: (id) => new JournalEntryNotFoundError(id),
  childNotFound: (id) => new JournalPageNotFoundError(id),
  childWithoutParent: () => new SceneLinkWithoutParentError('journalPageId')
};

/**
 * `create-scene`, `update-scene` and `get-scene` with the scene's settings:
 * weather, environment, fog, initial view, links and grid appearance.
 * Settings the core would store without complaint but cannot use — an
 * unknown weather id, a missing playlist, a sound of another playlist, an
 * inverted range — are refused here, and every result carries the settings
 * as the scene has them afterwards.
 */
export class SceneSettingsService {
  constructor(private readonly deps: SceneSettingsServiceDependencies) {}

  /** A core may create the scene without the fields its draft gives the first level; they are then set right after. */
  async createScene(command: CreateSceneCommand): Promise<ConfiguredScene> {
    const draft = { ...this.prepare(command.draft, NEW_SCENE, null), name: command.draft.name };
    const created = await this.deps.store.createConfiguredScene(draft);
    if (created === null) {
      throw new SceneCreationCancelledError();
    }
    if (created.missingImages === null) {
      return { scene: created.scene, settings: created.settings };
    }
    return this.deps.store.updateConfiguredScene(created.scene.id, created.missingImages);
  }

  /** An update that changes nothing is still sent: the core decides what it means. */
  async updateScene(command: UpdateSceneCommand): Promise<ConfiguredScene> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const current = this.deps.settings.readSettings(scene.id);
    const changes = this.prepare(
      command.changes,
      { links: current.links, globalLightDarkness: current.environment.globalLight.darkness },
      scene.id
    );
    return command.options === undefined
      ? this.deps.store.updateConfiguredScene(scene.id, changes)
      : this.deps.store.updateConfiguredScene(scene.id, changes, command.options);
  }

  describeScene(query: DescribeSceneQuery): SceneDetails {
    const description = this.deps.query.describeScene(query);
    return { ...description, settings: this.deps.settings.readSettings(description.scene.id) };
  }

  /** Empty when the registry cannot be read. */
  listWeatherEffects(): readonly WeatherEffect[] {
    return this.deps.weather.listWeatherEffects() ?? [];
  }

  /** Checks the changes and returns them with the links they leave behind resolved. */
  private prepare(changes: SceneChanges, current: CurrentSettings, sceneId: string | null): SceneChanges {
    const features = this.deps.settings.features();
    assertSceneFeatures(changes, features);
    if (typeof changes.weather === 'string') {
      assertKnownWeather(changes.weather, this.deps.weather.listWeatherEffects());
    }
    if (changes.globalLight?.darkness !== undefined) {
      resolveGlobalLightDarkness(current.globalLightDarkness, changes.globalLight.darkness);
    }
    if (sceneId !== null && features.levels) {
      this.checkLevelFields(changes, sceneId);
    }

    const playlist = resolveLink(
      { parentId: changes.playlistId, childId: changes.playlistSoundId },
      { parentId: current.links.playlistId, childId: current.links.playlistSoundId },
      (id) => this.deps.links.findPlaylist(id),
      PLAYLIST_LINK_ERRORS
    );
    const journal = resolveLink(
      { parentId: changes.journalId, childId: changes.journalPageId },
      { parentId: current.links.journalId, childId: current.links.journalPageId },
      (id) => this.deps.links.findJournalEntry(id),
      JOURNAL_LINK_ERRORS
    );
    return {
      ...changes,
      playlistId: playlist.parentId,
      playlistSoundId: playlist.childId,
      journalId: journal.parentId,
      journalPageId: journal.childId
    };
  }

  /** Foundry 14 keeps the foreground elevation on the first level, whose range must stay ordered. */
  private checkLevelFields(changes: SceneChanges, sceneId: string): void {
    if (changes.initialLevelId === undefined && changes.foregroundElevation === undefined) {
      return;
    }
    const levels = this.deps.levels.readLevels(sceneId);
    if (typeof changes.initialLevelId === 'string') {
      requireLevel(levels, changes.initialLevelId);
    }
    if (changes.foregroundElevation !== undefined && levels.firstLevelId !== null) {
      resolveElevation(requireLevel(levels, levels.firstLevelId).elevation, { top: changes.foregroundElevation });
    }
  }
}
