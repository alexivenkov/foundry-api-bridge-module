import { playPlaylistHandler } from '../PlayPlaylistHandler';
import type { FoundryPlaylist, FoundryPlaylistSound } from '../playlistTypes';

function createMockSound(id: string, playing: boolean): FoundryPlaylistSound {
  return {
    id,
    name: `Sound ${id}`,
    path: `sounds/${id}.ogg`,
    playing,
    volume: 0.5,
    repeat: false,
    fade: null,
    description: null,
    update: jest.fn(),
    delete: jest.fn()
  };
}

function createMockPlaylist(id: string, sounds: FoundryPlaylistSound[]): FoundryPlaylist {
  const playlist: FoundryPlaylist = {
    id,
    uuid: `Playlist.${id}`,
    name: `Playlist ${id}`,
    mode: 1,
    fade: null,
    channel: null,
    playing: false,
    description: null,
    folder: null,
    sounds: {
      contents: sounds,
      get: jest.fn((sid: string) => sounds.find(s => s.id === sid))
    },
    playAll: jest.fn(),
    stopAll: jest.fn(),
    playSound: jest.fn(),
    stopSound: jest.fn(),
    createEmbeddedDocuments: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
  return playlist;
}

function setGame(playlists: FoundryPlaylist[]): void {
  (globalThis as Record<string, unknown>)['game'] = {
    playlists: {
      contents: playlists,
      get: jest.fn((id: string) => playlists.find(p => p.id === id))
    }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('playPlaylistHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should call playAll and report number of playing sounds (simultaneous)', async () => {
    const initial = createMockPlaylist('p1', [
      createMockSound('a', false),
      createMockSound('b', false),
      createMockSound('c', false)
    ]);
    const updatedSounds = [
      createMockSound('a', true),
      createMockSound('b', true),
      createMockSound('c', true)
    ];
    const updated = createMockPlaylist('p1', updatedSounds);
    (initial.playAll as jest.Mock).mockResolvedValue(updated);
    setGame([initial]);

    const result = await playPlaylistHandler({ playlistId: 'p1' });

    expect(initial.playAll).toHaveBeenCalledTimes(1);
    expect(result.playing).toBe(true);
    expect(result.playlistId).toBe('p1');
    expect(result.soundCount).toBe(3);
  });

  it('should throw when playlist not found', async () => {
    setGame([createMockPlaylist('exists', [])]);

    await expect(playPlaylistHandler({ playlistId: 'missing' })).rejects.toThrow(
      'Playlist not found: missing'
    );
  });

  it('should report soundCount=1 for sequential mode', async () => {
    const initial = createMockPlaylist('seq', [
      createMockSound('a', false),
      createMockSound('b', false)
    ]);
    const updatedSounds = [
      createMockSound('a', true),
      createMockSound('b', false)
    ];
    const updated = createMockPlaylist('seq', updatedSounds);
    (initial.playAll as jest.Mock).mockResolvedValue(updated);
    setGame([initial]);

    const result = await playPlaylistHandler({ playlistId: 'seq' });

    expect(result.soundCount).toBe(1);
  });

  it('should report soundCount=0 for empty playlist', async () => {
    const initial = createMockPlaylist('empty', []);
    const updated = createMockPlaylist('empty', []);
    (initial.playAll as jest.Mock).mockResolvedValue(updated);
    setGame([initial]);

    const result = await playPlaylistHandler({ playlistId: 'empty' });

    expect(result.soundCount).toBe(0);
    expect(result.playing).toBe(true);
  });
});
