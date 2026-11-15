import { globalGameProvider } from '@/core/shared';
import { PlaylistManagementService, PlaylistService, SoundPlaybackService } from './application';
import {
  FoundryPlaylistLibrary,
  FoundryPlaylistStore,
  FoundrySoundPlayer,
  type AudioGlobalsProvider,
  type FoundryPlaylistGame,
  type FoundryPlaylistLibraryGame,
  type PlaylistGameProvider,
  type PlaylistLibraryGameProvider
} from './infrastructure';

export const defaultPlaylistGameProvider: PlaylistGameProvider = globalGameProvider<FoundryPlaylistGame>();
export const defaultPlaylistLibraryGameProvider: PlaylistLibraryGameProvider =
  globalGameProvider<FoundryPlaylistLibraryGame>();

// Composition root of the context. Handlers pass custom providers only in tests.

export function createFoundryPlaylistService(
  gameProvider: PlaylistGameProvider = defaultPlaylistGameProvider
): PlaylistService {
  return new PlaylistService({ playlists: new FoundryPlaylistStore(gameProvider) });
}

export function createFoundrySoundPlaybackService(globals?: AudioGlobalsProvider): SoundPlaybackService {
  return new SoundPlaybackService({ player: new FoundrySoundPlayer(globals) });
}

export function createFoundryPlaylistManagementService(
  gameProvider: PlaylistLibraryGameProvider = defaultPlaylistLibraryGameProvider
): PlaylistManagementService {
  const library = new FoundryPlaylistLibrary(gameProvider);
  return new PlaylistManagementService({ library, folders: library });
}
