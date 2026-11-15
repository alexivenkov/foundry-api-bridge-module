import { CoreFeatureUnavailableError } from '@/core/shared';
import {
  PlaylistCreationFailedError,
  PlaylistNotFoundError,
  PlaylistSoundNotFoundError,
  assertAudioPath,
  assertPlaylistFolder,
  assertSteppable,
  modeChangeStopsPlayback,
  requireSnapshot,
  uniquePaths,
  type PlaylistFolders,
  type PlaylistLibrary,
  type PlaylistSnapshot,
  type PlaylistSoundSnapshot
} from '@/core/playlists/domain';
import type {
  CreatePlaylistCommand,
  DeletePlaylistCommand,
  DeletePlaylistSoundCommand,
  ImportPlaylistSoundsCommand,
  StepPlaylistCommand,
  UpdatePlaylistCommand,
  UpdatePlaylistSoundCommand
} from './commands';

export interface PlaylistManagementDependencies {
  readonly library: PlaylistLibrary;
  readonly folders: PlaylistFolders;
}

export interface PlaylistStepResult {
  readonly playlistId: string;
  /** The sound playing after the step. */
  readonly sound: PlaylistSoundSnapshot | null;
}

export interface PlaylistSoundImport {
  readonly sounds: readonly PlaylistSoundSnapshot[];
  /** Requested paths that did not become a sound, each named once. */
  readonly skipped: readonly string[];
}

/** Creating, changing and deleting playlists and their sounds, and stepping through a running one. */
export class PlaylistManagementService {
  constructor(private readonly deps: PlaylistManagementDependencies) {}

  async createPlaylist(command: CreatePlaylistCommand): Promise<PlaylistSnapshot> {
    const { folderId } = command.draft;
    if (folderId !== undefined) {
      assertPlaylistFolder(this.deps.folders.findFolder(folderId), folderId);
    }
    const created = await this.deps.library.createPlaylist(command.draft);
    if (created === null) {
      throw new PlaylistCreationFailedError();
    }
    return created;
  }

  async updatePlaylist(command: UpdatePlaylistCommand): Promise<PlaylistSnapshot> {
    const current = this.requirePlaylist(command.playlistId);
    const { folderId, mode } = command.changes;
    if (typeof folderId === 'string') {
      assertPlaylistFolder(this.deps.folders.findFolder(folderId), folderId);
    }
    const stopPlayback = modeChangeStopsPlayback(current, mode);
    const updated = await this.deps.library.updatePlaylist(command.playlistId, command.changes, stopPlayback);
    if (updated === null) {
      throw new PlaylistNotFoundError(command.playlistId);
    }
    return updated;
  }

  async deletePlaylist(command: DeletePlaylistCommand): Promise<void> {
    this.requirePlaylist(command.playlistId);
    await this.deps.library.deletePlaylist(command.playlistId);
  }

  async updateSound(command: UpdatePlaylistSoundCommand): Promise<PlaylistSoundSnapshot> {
    this.requireSound(command.playlistId, command.soundId);
    if (command.changes.path !== undefined) {
      assertAudioPath(command.changes.path);
    }
    const updated = await this.deps.library.updateSound(command.playlistId, command.soundId, command.changes);
    if (updated === null) {
      throw new PlaylistSoundNotFoundError(command.playlistId, command.soundId);
    }
    return updated;
  }

  async deleteSound(command: DeletePlaylistSoundCommand): Promise<void> {
    this.requireSound(command.playlistId, command.soundId);
    await this.deps.library.deleteSound(command.playlistId, command.soundId);
  }

  async step(command: StepPlaylistCommand): Promise<PlaylistStepResult> {
    assertSteppable(this.requirePlaylist(command.playlistId));
    const updated = await this.deps.library.stepPlayback(command.playlistId, command.direction);
    if (updated === null) {
      throw new PlaylistNotFoundError(command.playlistId);
    }
    return { playlistId: updated.id, sound: updated.sounds.find((sound) => sound.playing) ?? null };
  }

  async importSounds(command: ImportPlaylistSoundsCommand): Promise<PlaylistSoundImport> {
    this.requirePlaylist(command.playlistId);
    if (!this.deps.library.canImportSounds()) {
      throw new CoreFeatureUnavailableError('Importing sounds by path is not available in this Foundry version');
    }
    const paths = uniquePaths(command.paths);
    const sounds = await this.deps.library.importSounds(command.playlistId, paths);
    if (sounds === null) {
      throw new PlaylistNotFoundError(command.playlistId);
    }
    const created = new Set(sounds.map((sound) => sound.path));
    return { sounds, skipped: paths.filter((path) => !created.has(path)) };
  }

  private requirePlaylist(playlistId: string): PlaylistSnapshot {
    return requireSnapshot(this.deps.library.findPlaylist(playlistId), playlistId);
  }

  private requireSound(playlistId: string, soundId: string): PlaylistSoundSnapshot {
    const sound = this.requirePlaylist(playlistId).sounds.find((candidate) => candidate.id === soundId);
    if (sound === undefined) {
      throw new PlaylistSoundNotFoundError(playlistId, soundId);
    }
    return sound;
  }
}
