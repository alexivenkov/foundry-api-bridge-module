import { addSoundToPlaylistHandler } from '../AddSoundToPlaylistHandler';
import type { FoundryPlaylist, FoundryPlaylistSound } from '../playlistTypes';

function createMockSound(overrides?: Partial<FoundryPlaylistSound>): FoundryPlaylistSound {
  return {
    id: 'created-sound',
    name: 'New Sound',
    path: 'sounds/new.ogg',
    playing: false,
    volume: 0.5,
    repeat: false,
    fade: null,
    description: null,
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides
  };
}

function createMockPlaylist(id: string): FoundryPlaylist {
  return {
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
      contents: [],
      get: jest.fn()
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

describe('addSoundToPlaylistHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should create sound with required fields only', async () => {
    const playlist = createMockPlaylist('p1');
    const created = createMockSound({ id: 's1', name: 'Tavern', path: 'sounds/tavern.ogg' });
    (playlist.createEmbeddedDocuments as jest.Mock).mockResolvedValue([created]);
    setGame([playlist]);

    const result = await addSoundToPlaylistHandler({
      playlistId: 'p1',
      name: 'Tavern',
      path: 'sounds/tavern.ogg'
    });

    expect(playlist.createEmbeddedDocuments).toHaveBeenCalledWith('PlaylistSound', [
      { name: 'Tavern', path: 'sounds/tavern.ogg' }
    ]);
    expect(result).toEqual({
      id: 's1',
      name: 'Tavern',
      path: 'sounds/tavern.ogg',
      playing: false,
      volume: 0.5,
      repeat: false
    });
  });

  it('should pass volume, repeat, description when provided', async () => {
    const playlist = createMockPlaylist('p1');
    (playlist.createEmbeddedDocuments as jest.Mock).mockResolvedValue([
      createMockSound({ volume: 0.9, repeat: true })
    ]);
    setGame([playlist]);

    await addSoundToPlaylistHandler({
      playlistId: 'p1',
      name: 'Loop',
      path: 'sounds/loop.ogg',
      volume: 0.9,
      repeat: true,
      description: 'A looping sound'
    });

    expect(playlist.createEmbeddedDocuments).toHaveBeenCalledWith('PlaylistSound', [
      {
        name: 'Loop',
        path: 'sounds/loop.ogg',
        volume: 0.9,
        repeat: true,
        description: 'A looping sound'
      }
    ]);
  });

  it('should throw when playlist not found', async () => {
    setGame([createMockPlaylist('exists')]);

    await expect(
      addSoundToPlaylistHandler({
        playlistId: 'missing',
        name: 'X',
        path: 'sounds/x.ogg'
      })
    ).rejects.toThrow('Playlist not found: missing');
  });

  it('should throw when createEmbeddedDocuments returns empty array', async () => {
    const playlist = createMockPlaylist('p1');
    (playlist.createEmbeddedDocuments as jest.Mock).mockResolvedValue([]);
    setGame([playlist]);

    await expect(
      addSoundToPlaylistHandler({
        playlistId: 'p1',
        name: 'X',
        path: 'sounds/x.ogg'
      })
    ).rejects.toThrow('Sound creation returned no document');
  });

  it('should map created sound to PlaylistSoundSummary', async () => {
    const playlist = createMockPlaylist('p1');
    const created = createMockSound({
      id: 'final',
      name: 'Final',
      path: 'sounds/final.ogg',
      playing: true,
      volume: 0.42,
      repeat: true
    });
    (playlist.createEmbeddedDocuments as jest.Mock).mockResolvedValue([created]);
    setGame([playlist]);

    const result = await addSoundToPlaylistHandler({
      playlistId: 'p1',
      name: 'Final',
      path: 'sounds/final.ogg'
    });

    expect(result).toEqual({
      id: 'final',
      name: 'Final',
      path: 'sounds/final.ogg',
      playing: true,
      volume: 0.42,
      repeat: true
    });
  });

  it('should not include optional fields in payload when undefined', async () => {
    const playlist = createMockPlaylist('p1');
    (playlist.createEmbeddedDocuments as jest.Mock).mockResolvedValue([createMockSound()]);
    setGame([playlist]);

    await addSoundToPlaylistHandler({
      playlistId: 'p1',
      name: 'Minimal',
      path: 'sounds/min.ogg'
    });

    const call = (playlist.createEmbeddedDocuments as jest.Mock).mock.calls[0];
    const payload = call?.[1]?.[0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('volume');
    expect(payload).not.toHaveProperty('repeat');
    expect(payload).not.toHaveProperty('description');
  });
});
