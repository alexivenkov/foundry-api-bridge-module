import { FoundryPlaylistLibrary } from '../FoundryPlaylistLibrary';
import type {
  FoundryPlaylistLibraryDocument,
  FoundryPlaylistLibraryGame,
  FoundryPlaylistLibrarySoundDocument
} from '../foundryPlaylistTypes';

/** A sound as Foundry 13.351 / 14.368 store it: a blank channel means the playlist's. */
function soundDocument(fields: Partial<FoundryPlaylistLibrarySoundDocument> = {}): FoundryPlaylistLibrarySoundDocument {
  const sound: FoundryPlaylistLibrarySoundDocument = {
    id: 's1',
    name: 'Rain',
    path: 'sounds/rain.ogg',
    playing: false,
    volume: 0.5,
    repeat: false,
    fade: undefined,
    description: undefined,
    channel: '',
    sort: 0,
    update: jest.fn((data: Record<string, unknown>) => {
      Object.assign(sound, data);
      return Promise.resolve(sound);
    }),
    delete: jest.fn().mockResolvedValue(undefined),
    ...fields
  };
  return sound;
}

function playlistDocument(sounds: FoundryPlaylistLibrarySoundDocument[] = [soundDocument()]): FoundryPlaylistLibraryDocument {
  const doc: FoundryPlaylistLibraryDocument = {
    id: 'p1',
    uuid: 'Playlist.p1',
    name: 'Ambience',
    mode: 0,
    fade: undefined,
    channel: 'music',
    playing: false,
    description: undefined,
    folder: { id: 'f1', name: 'Music' },
    sorting: 'm',
    sounds: { contents: sounds, get: (id) => sounds.find((entry) => entry.id === id) },
    playAll: jest.fn(),
    stopAll: jest.fn(),
    playSound: jest.fn(),
    stopSound: jest.fn(),
    createEmbeddedDocuments: jest.fn(),
    update: jest.fn((data: Record<string, unknown>) => {
      const { sounds: soundChanges, ...rest } = data as { sounds?: Array<{ _id: string } & Record<string, unknown>> };
      Object.assign(doc, rest);
      for (const change of soundChanges ?? []) {
        Object.assign(sounds.find((entry) => entry.id === change._id) ?? {}, change);
      }
      return Promise.resolve(doc);
    }),
    delete: jest.fn().mockResolvedValue(undefined),
    playNext: jest.fn(() => {
      for (const entry of sounds) {
        entry.playing = entry.id === 's2';
      }
      return Promise.resolve(doc);
    }),
    bulkImportSounds: jest.fn((paths: string[]) =>
      Promise.resolve(paths.filter((path) => path.endsWith('.ogg')).map((path) => soundDocument({ id: path, path })))
    )
  };
  return doc;
}

function libraryFor(
  document: FoundryPlaylistLibraryDocument,
  create: jest.Mock = jest.fn(),
  prototype: { bulkImportSounds?: unknown } = { bulkImportSounds: jest.fn() }
): FoundryPlaylistLibrary {
  const game: FoundryPlaylistLibraryGame = {
    playlists: {
      get: (id) => (id === document.id ? document : undefined),
      documentClass: { create, prototype }
    },
    folders: { get: (id) => (id === 'f1' ? { id: 'f1', type: 'Playlist' } : undefined) }
  };
  return new FoundryPlaylistLibrary({ getGame: () => game });
}

describe('FoundryPlaylistLibrary', () => {
  it('reads the full snapshot of a playlist', () => {
    const document = playlistDocument([
      soundDocument(),
      soundDocument({ id: 's2', channel: 'environment', fade: 500, description: 'loud', sort: 3, playing: true })
    ]);

    expect(libraryFor(document).findPlaylist('p1')).toEqual({
      id: 'p1',
      uuid: 'Playlist.p1',
      name: 'Ambience',
      mode: 'sequential',
      channel: 'music',
      fade: null,
      playing: false,
      description: null,
      folderName: 'Music',
      folderId: 'f1',
      sorting: 'manual',
      sounds: [
        {
          id: 's1',
          name: 'Rain',
          path: 'sounds/rain.ogg',
          playing: false,
          volume: 0.5,
          repeat: false,
          description: null,
          channel: null,
          fade: null,
          sort: 0
        },
        expect.objectContaining({ id: 's2', channel: 'environment', fade: 500, description: 'loud', sort: 3, playing: true })
      ]
    });
    expect(libraryFor(document).findPlaylist('gone')).toBeNull();
  });

  it('reads a folder by its type', () => {
    const library = libraryFor(playlistDocument());

    expect(library.findFolder('f1')).toEqual({ id: 'f1', type: 'Playlist' });
    expect(library.findFolder('nowhere')).toBeNull();
  });

  it('creates a playlist with the codes the core stores', async () => {
    const create = jest.fn().mockResolvedValue(playlistDocument());

    const created = await libraryFor(playlistDocument(), create).createPlaylist({
      name: 'Battle',
      description: 'Drums',
      mode: 'soundboard',
      channel: 'environment',
      fade: 1500,
      sorting: 'manual',
      folderId: 'f1'
    });

    expect(create).toHaveBeenCalledWith({
      name: 'Battle',
      description: 'Drums',
      mode: -1,
      channel: 'environment',
      fade: 1500,
      sorting: 'm',
      folder: 'f1'
    });
    expect(created?.id).toBe('p1');
  });

  it('creates a playlist with only its name, and resolves to null on a veto', async () => {
    const create = jest.fn().mockResolvedValue(undefined);

    await expect(libraryFor(playlistDocument(), create).createPlaylist({ name: 'Bare' })).resolves.toBeNull();
    expect(create).toHaveBeenCalledWith({ name: 'Bare' });
  });

  it('sends a partial update, null clearing a field', async () => {
    const document = playlistDocument();

    const updated = await libraryFor(document).updatePlaylist(
      'p1',
      { description: null, fade: null, sorting: 'alphabetical', folderId: null, channel: 'interface' },
      false
    );

    expect(document.update).toHaveBeenCalledWith({
      description: null,
      channel: 'interface',
      fade: null,
      sorting: 'a',
      folder: null
    });
    expect(updated).toMatchObject({ channel: 'interface', sorting: 'alphabetical' });
  });

  it('stops the playlist and every sound in the same update when the mode change asks for it', async () => {
    const document = playlistDocument([soundDocument({ playing: true }), soundDocument({ id: 's2' })]);
    document.playing = true;

    const updated = await libraryFor(document).updatePlaylist('p1', { mode: 'simultaneous' }, true);

    expect(document.update).toHaveBeenCalledWith({
      mode: 2,
      playing: false,
      sounds: [
        { _id: 's1', playing: false, pausedTime: null },
        { _id: 's2', playing: false, pausedTime: null }
      ]
    });
    expect(updated).toMatchObject({ mode: 'simultaneous', playing: false });
    expect(updated?.sounds.map((entry) => entry.playing)).toEqual([false, false]);
  });

  it('resolves to null when updating an unknown playlist', async () => {
    await expect(libraryFor(playlistDocument()).updatePlaylist('gone', {}, false)).resolves.toBeNull();
  });

  it('deletes a playlist and a sound', async () => {
    const document = playlistDocument();
    const library = libraryFor(document);

    await library.deleteSound('p1', 's1');
    await library.deletePlaylist('p1');
    await library.deletePlaylist('gone');

    expect(document.sounds.get('s1')?.delete).toHaveBeenCalledTimes(1);
    expect(document.delete).toHaveBeenCalledTimes(1);
  });

  it('updates a sound, a null channel meaning the playlist channel', async () => {
    const document = playlistDocument([soundDocument({ channel: 'music' })]);

    const updated = await libraryFor(document).updateSound('p1', 's1', {
      name: 'Storm',
      path: 'sounds/storm.mp3',
      volume: 0.25,
      repeat: true,
      fade: null,
      description: null,
      channel: null,
      sort: 5
    });

    expect(document.sounds.get('s1')?.update).toHaveBeenCalledWith({
      name: 'Storm',
      path: 'sounds/storm.mp3',
      description: null,
      volume: 0.25,
      repeat: true,
      fade: null,
      sort: 5,
      channel: ''
    });
    expect(updated).toMatchObject({ name: 'Storm', volume: 0.25, channel: null, fade: null, sort: 5 });
    await expect(libraryFor(document).updateSound('p1', 'nope', {})).resolves.toBeNull();
  });

  it.each([
    ['next', 1],
    ['previous', -1]
  ] as const)('steps to the %s sound', async (direction, code) => {
    const document = playlistDocument([soundDocument({ playing: true }), soundDocument({ id: 's2' })]);

    const updated = await libraryFor(document).stepPlayback('p1', direction);

    expect(document.playNext).toHaveBeenCalledWith(undefined, { direction: code });
    expect(updated?.sounds.find((entry) => entry.playing)?.id).toBe('s2');
  });

  it('imports sounds through the core and maps what it created', async () => {
    const document = playlistDocument();
    const library = libraryFor(document);

    const created = await library.importSounds('p1', ['sounds/a.ogg', 'notes.txt']);

    expect(document.bulkImportSounds).toHaveBeenCalledWith(['sounds/a.ogg', 'notes.txt']);
    expect(created?.map((entry) => entry.path)).toEqual(['sounds/a.ogg']);
    await expect(library.importSounds('gone', ['a.ogg'])).resolves.toBeNull();
  });

  it('knows whether the core can import sounds by path', () => {
    expect(libraryFor(playlistDocument()).canImportSounds()).toBe(true);
    expect(libraryFor(playlistDocument(), jest.fn(), {}).canImportSounds()).toBe(false);
  });
});
