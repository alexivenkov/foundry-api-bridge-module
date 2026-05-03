import { getPlaylistHandler } from '../GetPlaylistHandler';
import type { FoundryPlaylist, FoundryPlaylistSound } from '../playlistTypes';

function createMockSound(id: string, name: string, playing = false, volume = 0.5, repeat = false): FoundryPlaylistSound {
  return {
    id,
    name,
    path: `sounds/${id}.ogg`,
    playing,
    volume,
    repeat,
    fade: null,
    description: null,
    update: jest.fn(),
    delete: jest.fn()
  };
}

function createMockPlaylist(id: string, name: string, sounds: FoundryPlaylistSound[] = []): FoundryPlaylist {
  return {
    id,
    uuid: `Playlist.${id}`,
    name,
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

describe('getPlaylistHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should return playlist detail with sounds', async () => {
    const sounds = [
      createMockSound('s1', 'Track One', true, 0.7, false),
      createMockSound('s2', 'Track Two', false, 0.4, true)
    ];
    setGame([createMockPlaylist('p1', 'My Playlist', sounds)]);

    const result = await getPlaylistHandler({ playlistId: 'p1' });

    expect(result.id).toBe('p1');
    expect(result.name).toBe('My Playlist');
    expect(result.sounds).toHaveLength(2);
    expect(result.sounds[0]?.id).toBe('s1');
    expect(result.sounds[0]?.playing).toBe(true);
    expect(result.sounds[1]?.repeat).toBe(true);
  });

  it('should reject when playlist not found', async () => {
    setGame([createMockPlaylist('exists', 'Existing')]);

    await expect(getPlaylistHandler({ playlistId: 'missing' })).rejects.toThrow(
      'Playlist not found: missing'
    );
  });

  it('should return empty sounds array when playlist has no sounds', async () => {
    setGame([createMockPlaylist('empty', 'Silent', [])]);

    const result = await getPlaylistHandler({ playlistId: 'empty' });

    expect(result.sounds).toEqual([]);
    expect(result.soundCount).toBe(0);
  });

  it('should map sound fields correctly to PlaylistSoundSummary', async () => {
    const sounds = [createMockSound('sx', 'Detailed', false, 0.9, true)];
    setGame([createMockPlaylist('p1', 'P1', sounds)]);

    const result = await getPlaylistHandler({ playlistId: 'p1' });
    const sound = result.sounds[0];

    expect(sound).toEqual({
      id: 'sx',
      name: 'Detailed',
      path: 'sounds/sx.ogg',
      playing: false,
      volume: 0.9,
      repeat: true
    });
  });
});
