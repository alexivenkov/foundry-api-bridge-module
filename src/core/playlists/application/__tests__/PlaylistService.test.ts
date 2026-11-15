import {
  PlaylistNotFoundError,
  PlaylistSoundCreationFailedError,
  PlaylistSoundNotFoundError,
  type Playlist,
  type PlaylistSound,
  type PlaylistSoundDraft,
  type PlaylistStore
} from '../../domain';
import { PlaylistService } from '../PlaylistService';

function sound(overrides: Partial<PlaylistSound> = {}): PlaylistSound {
  return { id: 's1', name: 'Tavern theme', path: 'sounds/tavern.ogg', playing: false, volume: 0.5, repeat: false, ...overrides };
}

function playlist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: 'ambience',
    uuid: 'Playlist.ambience',
    name: 'Ambience',
    mode: 'sequential',
    channel: 'music',
    fade: null,
    playing: false,
    description: null,
    folderName: null,
    sounds: [sound(), sound({ id: 's2', name: 'Rain' })],
    ...overrides
  };
}

class FakePlaylistStore implements PlaylistStore {
  readonly started: string[] = [];
  readonly stopped: string[] = [];
  readonly soundsStarted: Array<{ playlistId: string; soundId: string }> = [];
  readonly soundsStopped: Array<{ playlistId: string; soundId: string }> = [];
  readonly added: Array<{ playlistId: string; draft: PlaylistSoundDraft }> = [];
  createsNothing = false;
  soundsAfterStart: readonly PlaylistSound[] = [sound({ playing: true }), sound({ id: 's2', name: 'Rain' })];

  constructor(private readonly playlists: readonly Playlist[]) {}

  listPlaylists(): readonly Playlist[] {
    return this.playlists;
  }

  findPlaylist(playlistId: string): Playlist | null {
    return this.playlists.find((candidate) => candidate.id === playlistId) ?? null;
  }

  playAll(playlistId: string): Promise<readonly PlaylistSound[]> {
    this.started.push(playlistId);
    return Promise.resolve(this.soundsAfterStart);
  }

  stopAll(playlistId: string): Promise<void> {
    this.stopped.push(playlistId);
    return Promise.resolve();
  }

  playSound(playlistId: string, soundId: string): Promise<void> {
    this.soundsStarted.push({ playlistId, soundId });
    return Promise.resolve();
  }

  stopSound(playlistId: string, soundId: string): Promise<void> {
    this.soundsStopped.push({ playlistId, soundId });
    return Promise.resolve();
  }

  addSound(playlistId: string, draft: PlaylistSoundDraft): Promise<PlaylistSound | null> {
    this.added.push({ playlistId, draft });
    return Promise.resolve(this.createsNothing ? null : sound({ id: 'created', name: draft.name, path: draft.path }));
  }
}

function setup(): { service: PlaylistService; store: FakePlaylistStore } {
  const store = new FakePlaylistStore([playlist(), playlist({ id: 'combat', name: 'Combat', sounds: [] })]);
  return { service: new PlaylistService({ playlists: store }), store };
}

describe('PlaylistService', () => {
  describe('reading', () => {
    it('lists every playlist', () => {
      expect(setup().service.listPlaylists().map((entry) => entry.id)).toEqual(['ambience', 'combat']);
    });

    it('returns a playlist with its sounds', () => {
      expect(setup().service.getPlaylist({ playlistId: 'ambience' }).sounds.map((entry) => entry.id))
        .toEqual(['s1', 's2']);
    });

    it('rejects an unknown playlist', () => {
      const act = (): unknown => setup().service.getPlaylist({ playlistId: 'missing' });

      expect(act).toThrow(PlaylistNotFoundError);
      expect(act).toThrow('Playlist not found: missing');
    });
  });

  describe('playPlaylist', () => {
    it('starts the playlist and counts the sounds that play afterwards', async () => {
      const { service, store } = setup();

      const outcome = await service.playPlaylist({ playlistId: 'ambience' });

      expect(store.started).toEqual(['ambience']);
      expect(outcome.playingSounds).toBe(1);
    });

    it('counts from what the store reports after the start, not from the state before', async () => {
      const { service, store } = setup();
      store.soundsAfterStart = [sound({ playing: true }), sound({ id: 's2', playing: true }), sound({ id: 's3', playing: true })];

      await expect(service.playPlaylist({ playlistId: 'combat' })).resolves.toEqual({ playingSounds: 3 });
    });

    it('rejects an unknown playlist without starting anything', async () => {
      const { service, store } = setup();

      await expect(service.playPlaylist({ playlistId: 'missing' })).rejects.toThrow(PlaylistNotFoundError);
      expect(store.started).toEqual([]);
    });
  });

  describe('stopPlaylist', () => {
    it('stops the playlist', async () => {
      const { service, store } = setup();

      await service.stopPlaylist({ playlistId: 'ambience' });

      expect(store.stopped).toEqual(['ambience']);
    });

    it('rejects an unknown playlist without stopping anything', async () => {
      const { service, store } = setup();

      await expect(service.stopPlaylist({ playlistId: 'missing' })).rejects.toThrow('Playlist not found: missing');
      expect(store.stopped).toEqual([]);
    });
  });

  describe('playSound and stopSound', () => {
    it('starts one sound and returns it', async () => {
      const { service, store } = setup();

      const started = await service.playSound({ playlistId: 'ambience', soundId: 's2' });

      expect(store.soundsStarted).toEqual([{ playlistId: 'ambience', soundId: 's2' }]);
      expect(started.name).toBe('Rain');
    });

    it('stops one sound', async () => {
      const { service, store } = setup();

      await service.stopSound({ playlistId: 'ambience', soundId: 's1' });

      expect(store.soundsStopped).toEqual([{ playlistId: 'ambience', soundId: 's1' }]);
    });

    it('rejects a sound the playlist does not have, naming both', async () => {
      const { service, store } = setup();

      await expect(service.playSound({ playlistId: 'combat', soundId: 's1' }))
        .rejects.toThrow('Sound not found in playlist combat: s1');
      await expect(service.stopSound({ playlistId: 'ambience', soundId: 'missing' }))
        .rejects.toThrow(PlaylistSoundNotFoundError);
      expect(store.soundsStarted).toEqual([]);
      expect(store.soundsStopped).toEqual([]);
    });

    it('reports an unknown playlist before looking for the sound', async () => {
      const { service } = setup();

      await expect(service.playSound({ playlistId: 'missing', soundId: 's1' })).rejects.toThrow(PlaylistNotFoundError);
      await expect(service.stopSound({ playlistId: 'missing', soundId: 's1' }))
        .rejects.toThrow('Playlist not found: missing');
    });
  });

  describe('addSound', () => {
    const draft: PlaylistSoundDraft = { name: 'Door', path: 'sounds/door.ogg', volume: 0.9 };

    it('adds the sound to the playlist and returns it', async () => {
      const { service, store } = setup();

      const added = await service.addSound({ playlistId: 'combat', draft });

      expect(store.added).toEqual([{ playlistId: 'combat', draft }]);
      expect(added).toMatchObject({ id: 'created', name: 'Door', path: 'sounds/door.ogg' });
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      const addition = service.addSound({ playlistId: 'combat', draft });

      await expect(addition).rejects.toThrow(PlaylistSoundCreationFailedError);
      await expect(addition).rejects.toThrow('Sound creation returned no document');
    });

    it('rejects an unknown playlist without creating anything', async () => {
      const { service, store } = setup();

      await expect(service.addSound({ playlistId: 'missing', draft })).rejects.toThrow(PlaylistNotFoundError);
      expect(store.added).toEqual([]);
    });
  });
});
