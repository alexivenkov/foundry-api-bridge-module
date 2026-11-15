import type {
  LinkedCollection,
  SceneLinkDirectory,
  TableUser,
  TableUsers,
  WeatherEffect,
  WeatherEffectCatalog
} from '@/core/scenes/domain';
import type { FoundryLinkTarget } from './foundrySceneTypes';
import type { SceneCanvasGlobalsProvider } from './sceneCanvas';
import type { SceneGameProvider } from './sceneDocuments';

const fromGlobalThis: SceneCanvasGlobalsProvider = () =>
  globalThis as unknown as ReturnType<SceneCanvasGlobalsProvider>;

function toLinkedCollection(target: FoundryLinkTarget, children: { contents: Array<{ id: string }> } | undefined): LinkedCollection {
  return { id: target.id, childIds: (children?.contents ?? []).map((child) => child.id) };
}

/**
 * The world documents and registries scene settings refer to: playlists and
 * their sounds, journal entries and their pages, the users at the table, the
 * weather effects (`CONFIG.weatherEffects`, the same six in 13.351 and 14.368
 * plus whatever modules register).
 */
export class FoundrySceneDirectory implements SceneLinkDirectory, TableUsers, WeatherEffectCatalog {
  constructor(
    private readonly gameProvider: SceneGameProvider,
    private readonly globals: SceneCanvasGlobalsProvider = fromGlobalThis
  ) {}

  findPlaylist(playlistId: string): LinkedCollection | null {
    const playlist = this.gameProvider.getGame().playlists?.get(playlistId);
    return playlist ? toLinkedCollection(playlist, playlist.sounds) : null;
  }

  findJournalEntry(journalId: string): LinkedCollection | null {
    const entry = this.gameProvider.getGame().journal?.get(journalId);
    return entry ? toLinkedCollection(entry, entry.pages) : null;
  }

  listUsers(): readonly TableUser[] {
    return (this.gameProvider.getGame().users?.contents ?? []).map((user) => ({
      id: user.id,
      active: user.active === true
    }));
  }

  currentUserId(): string | null {
    return this.gameProvider.getGame().user?.id ?? null;
  }

  /** A scene's `weather` names a key of the registry; labels are localization keys. */
  listWeatherEffects(): readonly WeatherEffect[] | null {
    const effects = this.globals().CONFIG?.weatherEffects;
    if (effects === undefined) {
      return null;
    }
    const i18n = this.gameProvider.getGame().i18n;
    return Object.entries(effects).map(([id, effect]) => {
      const label = effect.label ?? id;
      return { id, label: i18n ? i18n.localize(label) : label };
    });
  }
}
