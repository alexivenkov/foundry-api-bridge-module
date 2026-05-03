import { getPlaylistsHandler } from '../GetPlaylistsHandler';
import type { FoundryPlaylist, FoundryPlaylistSound } from '../playlistTypes';

interface MockPlaylistInput {
  id: string;
  name: string;
  mode?: number;
  uuid?: string;
  fade?: number | null;
  channel?: 'music' | 'environment' | 'interface' | null;
  playing?: boolean;
  description?: string | null;
  folder?: { id: string; name: string } | null;
  sounds?: FoundryPlaylistSound[];
}

function createMockSound(id: string, name: string, playing = false): FoundryPlaylistSound {
  return {
    id,
    name,
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

function createMockPlaylist(input: MockPlaylistInput): FoundryPlaylist {
  const sounds = input.sounds ?? [];
  return {
    id: input.id,
    uuid: input.uuid ?? `Playlist.${input.id}`,
    name: input.name,
    mode: input.mode ?? 0,
    fade: input.fade ?? null,
    channel: input.channel ?? null,
    playing: input.playing ?? false,
    description: input.description ?? null,
    folder: input.folder ?? null,
    sounds: {
      contents: sounds,
      get: jest.fn((id: string) => sounds.find(s => s.id === id))
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

describe('getPlaylistsHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should return all playlists mapped to summaries', async () => {
    setGame([
      createMockPlaylist({ id: 'p1', name: 'Tavern Music', mode: 1 }),
      createMockPlaylist({ id: 'p2', name: 'Combat', mode: 2 }),
      createMockPlaylist({ id: 'p3', name: 'Ambient', mode: 3 })
    ]);

    const result = await getPlaylistsHandler({});

    expect(result).toHaveLength(3);
    expect(result.map(p => p.id)).toEqual(['p1', 'p2', 'p3']);
    expect(result[0]?.name).toBe('Tavern Music');
  });

  it('should return empty array for empty collection', async () => {
    setGame([]);

    const result = await getPlaylistsHandler({});

    expect(result).toEqual([]);
  });

  it('should map every mode value (-1, 0, 1, 2, 3) to wire string', async () => {
    setGame([
      createMockPlaylist({ id: 'p-soundboard', name: 'SB', mode: -1 }),
      createMockPlaylist({ id: 'p-disabled', name: 'D', mode: 0 }),
      createMockPlaylist({ id: 'p-seq', name: 'S', mode: 1 }),
      createMockPlaylist({ id: 'p-shuffle', name: 'SH', mode: 2 }),
      createMockPlaylist({ id: 'p-sim', name: 'SI', mode: 3 })
    ]);

    const result = await getPlaylistsHandler({});

    expect(result[0]?.mode).toBe('soundboard');
    expect(result[1]?.mode).toBe('disabled');
    expect(result[2]?.mode).toBe('sequential');
    expect(result[3]?.mode).toBe('shuffle');
    expect(result[4]?.mode).toBe('simultaneous');
  });

  it('should map folder name when present and null when absent', async () => {
    setGame([
      createMockPlaylist({
        id: 'p1',
        name: 'In Folder',
        folder: { id: 'f1', name: 'Music Folder' }
      }),
      createMockPlaylist({ id: 'p2', name: 'Root', folder: null })
    ]);

    const result = await getPlaylistsHandler({});

    expect(result[0]?.folder).toBe('Music Folder');
    expect(result[1]?.folder).toBeNull();
  });

  it('should report correct soundCount based on sounds.contents length', async () => {
    setGame([
      createMockPlaylist({
        id: 'p1',
        name: 'With Sounds',
        sounds: [
          createMockSound('s1', 'Song A'),
          createMockSound('s2', 'Song B'),
          createMockSound('s3', 'Song C')
        ]
      }),
      createMockPlaylist({ id: 'p2', name: 'Empty', sounds: [] })
    ]);

    const result = await getPlaylistsHandler({});

    expect(result[0]?.soundCount).toBe(3);
    expect(result[1]?.soundCount).toBe(0);
  });

  it('should preserve channel and fade properties', async () => {
    setGame([
      createMockPlaylist({
        id: 'p1',
        name: 'Music Channel',
        channel: 'music',
        fade: 2000
      }),
      createMockPlaylist({
        id: 'p2',
        name: 'No Channel',
        channel: null,
        fade: null
      })
    ]);

    const result = await getPlaylistsHandler({});

    expect(result[0]?.channel).toBe('music');
    expect(result[0]?.fade).toBe(2000);
    expect(result[1]?.channel).toBeNull();
    expect(result[1]?.fade).toBeNull();
  });
});
