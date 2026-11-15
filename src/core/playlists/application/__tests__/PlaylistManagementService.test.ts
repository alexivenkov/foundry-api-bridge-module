import { CoreFeatureUnavailableError } from '@/core/shared';
import type {
  PlaylistChanges,
  PlaylistDraft,
  PlaylistFolder,
  PlaylistFolders,
  PlaylistLibrary,
  PlaylistSnapshot,
  PlaylistSoundChanges,
  PlaylistSoundSnapshot,
  PlaylistStepDirection
} from '../../domain';
import { PlaylistManagementService } from '../PlaylistManagementService';

function sound(overrides: Partial<PlaylistSoundSnapshot> = {}): PlaylistSoundSnapshot {
  return {
    id: 's1',
    name: 'Rain',
    path: 'sounds/rain.ogg',
    playing: false,
    volume: 0.5,
    repeat: false,
    description: null,
    channel: null,
    fade: null,
    sort: 0,
    ...overrides
  };
}

function playlist(overrides: Partial<PlaylistSnapshot> = {}): PlaylistSnapshot {
  return {
    id: 'p1',
    uuid: 'Playlist.p1',
    name: 'Ambience',
    mode: 'sequential',
    channel: 'music',
    fade: null,
    playing: false,
    description: null,
    folderName: null,
    folderId: null,
    sorting: 'alphabetical',
    sounds: [sound(), sound({ id: 's2', name: 'Wind', path: 'sounds/wind.ogg' })],
    ...overrides
  };
}

class FakeLibrary implements PlaylistLibrary, PlaylistFolders {
  readonly created: PlaylistDraft[] = [];
  readonly updated: Array<{ playlistId: string; changes: PlaylistChanges; stopPlayback: boolean }> = [];
  readonly deleted: string[] = [];
  readonly soundUpdates: Array<{ soundId: string; changes: PlaylistSoundChanges }> = [];
  readonly soundDeletes: string[] = [];
  readonly steps: Array<{ playlistId: string; direction: PlaylistStepDirection }> = [];
  readonly imports: Array<readonly string[]> = [];
  folders: PlaylistFolder[] = [
    { id: 'music', type: 'Playlist' },
    { id: 'gear', type: 'Item' }
  ];
  importAvailable = true;
  nothingHappens = false;

  constructor(public playlists: PlaylistSnapshot[]) {}

  findPlaylist(playlistId: string): PlaylistSnapshot | null {
    return this.playlists.find((entry) => entry.id === playlistId) ?? null;
  }

  findFolder(folderId: string): PlaylistFolder | null {
    return this.folders.find((entry) => entry.id === folderId) ?? null;
  }

  createPlaylist(draft: PlaylistDraft): Promise<PlaylistSnapshot | null> {
    this.created.push(draft);
    return Promise.resolve(this.nothingHappens ? null : playlist({ id: 'new', name: draft.name }));
  }

  updatePlaylist(playlistId: string, changes: PlaylistChanges, stopPlayback: boolean): Promise<PlaylistSnapshot | null> {
    this.updated.push({ playlistId, changes, stopPlayback });
    return Promise.resolve(this.nothingHappens ? null : this.findPlaylist(playlistId));
  }

  deletePlaylist(playlistId: string): Promise<void> {
    this.deleted.push(playlistId);
    return Promise.resolve();
  }

  updateSound(_playlistId: string, soundId: string, changes: PlaylistSoundChanges): Promise<PlaylistSoundSnapshot | null> {
    this.soundUpdates.push({ soundId, changes });
    return Promise.resolve(this.nothingHappens ? null : sound({ id: soundId, ...(changes.volume !== undefined ? { volume: changes.volume } : {}) }));
  }

  deleteSound(_playlistId: string, soundId: string): Promise<void> {
    this.soundDeletes.push(soundId);
    return Promise.resolve();
  }

  stepPlayback(playlistId: string, direction: PlaylistStepDirection): Promise<PlaylistSnapshot | null> {
    this.steps.push({ playlistId, direction });
    if (this.nothingHappens) {
      return Promise.resolve(null);
    }
    return Promise.resolve(playlist({ playing: true, sounds: [sound(), sound({ id: 's2', playing: true })] }));
  }

  canImportSounds(): boolean {
    return this.importAvailable;
  }

  importSounds(_playlistId: string, paths: readonly string[]): Promise<readonly PlaylistSoundSnapshot[] | null> {
    this.imports.push(paths);
    if (this.nothingHappens) {
      return Promise.resolve(null);
    }
    return Promise.resolve(
      paths.filter((path) => path.endsWith('.ogg')).map((path, index) => sound({ id: `n${String(index)}`, path }))
    );
  }
}

function setup(playlists: PlaylistSnapshot[] = [playlist()]): { service: PlaylistManagementService; library: FakeLibrary } {
  const library = new FakeLibrary(playlists);
  return { service: new PlaylistManagementService({ library, folders: library }), library };
}

describe('PlaylistManagementService', () => {
  describe('createPlaylist', () => {
    it('creates a playlist, in a playlist folder', async () => {
      const { service, library } = setup();

      await expect(service.createPlaylist({ draft: { name: 'Battle', folderId: 'music' } })).resolves.toMatchObject({
        id: 'new',
        name: 'Battle'
      });
      expect(library.created).toEqual([{ name: 'Battle', folderId: 'music' }]);
    });

    it('refuses a folder of another type and reports a creation the core vetoed', async () => {
      const { service, library } = setup();

      await expect(service.createPlaylist({ draft: { name: 'x', folderId: 'gear' } })).rejects.toThrow(
        'Folder gear holds Item documents, not playlists'
      );
      library.nothingHappens = true;
      await expect(service.createPlaylist({ draft: { name: 'x' } })).rejects.toThrow('Failed to create playlist');
    });
  });

  describe('updatePlaylist', () => {
    it('updates without stopping when the mode stays', async () => {
      const { service, library } = setup([playlist({ playing: true })]);

      await service.updatePlaylist({ playlistId: 'p1', changes: { name: 'Calm', mode: 'sequential', folderId: null } });

      expect(library.updated).toEqual([
        { playlistId: 'p1', changes: { name: 'Calm', mode: 'sequential', folderId: null }, stopPlayback: false }
      ]);
    });

    it('stops a playing playlist whose mode changes', async () => {
      const { service, library } = setup([playlist({ playing: true })]);

      await service.updatePlaylist({ playlistId: 'p1', changes: { mode: 'simultaneous' } });

      expect(library.updated[0]?.stopPlayback).toBe(true);
    });

    it('refuses an unknown playlist and a missing folder', async () => {
      const { service, library } = setup();

      await expect(service.updatePlaylist({ playlistId: 'gone', changes: {} })).rejects.toThrow('Playlist not found: gone');
      await expect(service.updatePlaylist({ playlistId: 'p1', changes: { folderId: 'nowhere' } })).rejects.toThrow(
        'Folder not found: nowhere'
      );
      expect(library.updated).toEqual([]);
    });

    it('reports a playlist that vanished during the update', async () => {
      const { service, library } = setup();
      library.nothingHappens = true;

      await expect(service.updatePlaylist({ playlistId: 'p1', changes: { name: 'x' } })).rejects.toThrow(
        'Playlist not found: p1'
      );
    });
  });

  it('deletes a playlist it knows', async () => {
    const { service, library } = setup();

    await service.deletePlaylist({ playlistId: 'p1' });
    await expect(service.deletePlaylist({ playlistId: 'gone' })).rejects.toThrow('Playlist not found: gone');

    expect(library.deleted).toEqual(['p1']);
  });

  describe('sounds', () => {
    it('updates a sound', async () => {
      const { service, library } = setup();

      await expect(
        service.updateSound({ playlistId: 'p1', soundId: 's2', changes: { volume: 0.2, path: 'sounds/storm.mp3' } })
      ).resolves.toMatchObject({ id: 's2', volume: 0.2 });
      expect(library.soundUpdates).toEqual([{ soundId: 's2', changes: { volume: 0.2, path: 'sounds/storm.mp3' } }]);
    });

    it('refuses a path that is no audio file, and an unknown sound', async () => {
      const { service, library } = setup();

      await expect(
        service.updateSound({ playlistId: 'p1', soundId: 's1', changes: { path: 'icons/x.webp' } })
      ).rejects.toThrow('path must be an audio file');
      await expect(service.updateSound({ playlistId: 'p1', soundId: 'nope', changes: {} })).rejects.toThrow(
        'Sound not found in playlist p1: nope'
      );
      expect(library.soundUpdates).toEqual([]);
    });

    it('reports a sound that vanished during the update', async () => {
      const { service, library } = setup();
      library.nothingHappens = true;

      await expect(service.updateSound({ playlistId: 'p1', soundId: 's1', changes: { repeat: true } })).rejects.toThrow(
        'Sound not found in playlist p1: s1'
      );
    });

    it('deletes a sound it knows', async () => {
      const { service, library } = setup();

      await service.deleteSound({ playlistId: 'p1', soundId: 's1' });
      await expect(service.deleteSound({ playlistId: 'p1', soundId: 'nope' })).rejects.toThrow('Sound not found');

      expect(library.soundDeletes).toEqual(['s1']);
    });
  });

  describe('step', () => {
    it('steps a running playlist and reports the sound playing now', async () => {
      const { service, library } = setup([playlist({ playing: true })]);

      const { playlistId, sound: now } = await service.step({ playlistId: 'p1', direction: 'previous' });

      expect(library.steps).toEqual([{ playlistId: 'p1', direction: 'previous' }]);
      expect(playlistId).toBe('p1');
      expect(now?.id).toBe('s2');
    });

    it('refuses a stopped or simultaneous playlist', async () => {
      const { service, library } = setup([playlist(), playlist({ id: 'p2', mode: 'simultaneous', playing: true })]);

      await expect(service.step({ playlistId: 'p1', direction: 'next' })).rejects.toThrow('Playlist p1 is not playing');
      await expect(service.step({ playlistId: 'p2', direction: 'next' })).rejects.toThrow('plays in simultaneous mode');
      expect(library.steps).toEqual([]);
    });

    it('reports a playlist that vanished during the step', async () => {
      const { service, library } = setup([playlist({ playing: true })]);
      library.nothingHappens = true;

      await expect(service.step({ playlistId: 'p1', direction: 'next' })).rejects.toThrow('Playlist not found: p1');
    });
  });

  describe('importSounds', () => {
    it('imports each path once and names the ones the core skipped', async () => {
      const { service, library } = setup();

      const outcome = await service.importSounds({
        playlistId: 'p1',
        paths: ['sounds/a.ogg', 'notes.txt', 'sounds/a.ogg', 'sounds/b.ogg']
      });

      expect(library.imports).toEqual([['sounds/a.ogg', 'notes.txt', 'sounds/b.ogg']]);
      expect(outcome.sounds.map((entry) => entry.path)).toEqual(['sounds/a.ogg', 'sounds/b.ogg']);
      expect(outcome.skipped).toEqual(['notes.txt']);
    });

    it('refuses where the core cannot import by path', async () => {
      const { service, library } = setup();
      library.importAvailable = false;

      const act = service.importSounds({ playlistId: 'p1', paths: ['a.ogg'] });

      await expect(act).rejects.toThrow(CoreFeatureUnavailableError);
      await expect(service.importSounds({ playlistId: 'p1', paths: ['a.ogg'] })).rejects.toThrow(
        'Importing sounds by path is not available in this Foundry version'
      );
    });

    it('refuses an unknown playlist and one that vanished', async () => {
      const { service, library } = setup();

      await expect(service.importSounds({ playlistId: 'gone', paths: ['a.ogg'] })).rejects.toThrow('Playlist not found: gone');
      library.nothingHappens = true;
      await expect(service.importSounds({ playlistId: 'p1', paths: ['a.ogg'] })).rejects.toThrow('Playlist not found: p1');
    });
  });
});
