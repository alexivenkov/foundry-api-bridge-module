import { stopPlaylistHandler } from '../StopPlaylistHandler';
import type { FoundryPlaylist } from '../playlistTypes';

function createMockPlaylist(id: string): FoundryPlaylist {
  return {
    id,
    uuid: `Playlist.${id}`,
    name: `Playlist ${id}`,
    mode: 1,
    fade: null,
    channel: null,
    playing: true,
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

describe('stopPlaylistHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should call stopAll on the playlist', async () => {
    const playlist = createMockPlaylist('p1');
    (playlist.stopAll as jest.Mock).mockResolvedValue(playlist);
    setGame([playlist]);

    const result = await stopPlaylistHandler({ playlistId: 'p1' });

    expect(playlist.stopAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ stopped: true, playlistId: 'p1' });
  });

  it('should throw when playlist not found', async () => {
    setGame([createMockPlaylist('exists')]);

    await expect(stopPlaylistHandler({ playlistId: 'missing' })).rejects.toThrow(
      'Playlist not found: missing'
    );
  });

  it('should propagate error from stopAll', async () => {
    const playlist = createMockPlaylist('p1');
    (playlist.stopAll as jest.Mock).mockRejectedValue(new Error('Foundry stop failed'));
    setGame([playlist]);

    await expect(stopPlaylistHandler({ playlistId: 'p1' })).rejects.toThrow('Foundry stop failed');
  });
});
