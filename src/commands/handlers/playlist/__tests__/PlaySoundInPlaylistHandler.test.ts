import { playSoundInPlaylistHandler } from '../PlaySoundInPlaylistHandler';
import type { FoundryPlaylist, FoundryPlaylistSound } from '../playlistTypes';

function createMockSound(id: string, name: string): FoundryPlaylistSound {
  return {
    id,
    name,
    path: `sounds/${id}.ogg`,
    playing: false,
    volume: 0.5,
    repeat: false,
    fade: null,
    description: null,
    update: jest.fn(),
    delete: jest.fn()
  };
}

function createMockPlaylist(id: string, sounds: FoundryPlaylistSound[]): FoundryPlaylist {
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

describe('playSoundInPlaylistHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should call playSound with the sound document', async () => {
    const sound = createMockSound('s1', 'Tavern Theme');
    const playlist = createMockPlaylist('p1', [sound]);
    (playlist.playSound as jest.Mock).mockResolvedValue(playlist);
    setGame([playlist]);

    const result = await playSoundInPlaylistHandler({
      playlistId: 'p1',
      soundId: 's1'
    });

    expect(playlist.playSound).toHaveBeenCalledWith(sound);
    expect(result).toEqual({
      playing: true,
      playlistId: 'p1',
      soundId: 's1',
      soundName: 'Tavern Theme'
    });
  });

  it('should throw when playlist not found', async () => {
    setGame([createMockPlaylist('exists', [])]);

    await expect(
      playSoundInPlaylistHandler({ playlistId: 'missing', soundId: 's1' })
    ).rejects.toThrow('Playlist not found: missing');
  });

  it('should throw when sound not found', async () => {
    const playlist = createMockPlaylist('p1', [createMockSound('s1', 'Existing')]);
    setGame([playlist]);

    await expect(
      playSoundInPlaylistHandler({ playlistId: 'p1', soundId: 'missing' })
    ).rejects.toThrow('Sound not found in playlist p1: missing');
  });

  it('should include the sound name in the result', async () => {
    const sound = createMockSound('battle', 'Heroic Battle Anthem');
    const playlist = createMockPlaylist('combat', [sound]);
    (playlist.playSound as jest.Mock).mockResolvedValue(playlist);
    setGame([playlist]);

    const result = await playSoundInPlaylistHandler({
      playlistId: 'combat',
      soundId: 'battle'
    });

    expect(result.soundName).toBe('Heroic Battle Anthem');
  });

  it('should not call playSound when sound lookup fails', async () => {
    const playlist = createMockPlaylist('p1', []);
    setGame([playlist]);

    await expect(
      playSoundInPlaylistHandler({ playlistId: 'p1', soundId: 's1' })
    ).rejects.toThrow();

    expect(playlist.playSound).not.toHaveBeenCalled();
  });
});
