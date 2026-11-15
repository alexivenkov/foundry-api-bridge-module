import { createCreatePlaylistHandler } from '../CreatePlaylistHandler';
import { createDeletePlaylistHandler } from '../DeletePlaylistHandler';
import { createDeletePlaylistSoundHandler } from '../DeletePlaylistSoundHandler';
import { createImportPlaylistSoundsHandler } from '../ImportPlaylistSoundsHandler';
import { createPlayNextInPlaylistHandler } from '../PlayNextInPlaylistHandler';
import { createUpdatePlaylistHandler } from '../UpdatePlaylistHandler';
import { createUpdatePlaylistSoundHandler } from '../UpdatePlaylistSoundHandler';
import type {
  FoundryPlaylistLibraryDocument,
  FoundryPlaylistLibraryGame,
  FoundryPlaylistLibrarySoundDocument
} from '../playlistTypes';
import type { PlaylistManagementHandlerDependencies } from '../playlistWireMappers';

function sound(fields: Partial<FoundryPlaylistLibrarySoundDocument> = {}): FoundryPlaylistLibrarySoundDocument {
  const doc: FoundryPlaylistLibrarySoundDocument = {
    id: 's1',
    name: 'Rain',
    path: 'sounds/rain.ogg',
    playing: false,
    volume: 0.5,
    repeat: false,
    fade: null,
    description: null,
    channel: '',
    sort: 0,
    update: jest.fn((data: Record<string, unknown>) => {
      Object.assign(doc, data);
      return Promise.resolve(doc);
    }),
    delete: jest.fn().mockResolvedValue(undefined),
    ...fields
  };
  return doc;
}

function setup(): {
  deps: Required<PlaylistManagementHandlerDependencies>;
  playlist: FoundryPlaylistLibraryDocument;
  create: jest.Mock;
} {
  const sounds = [sound({ playing: true }), sound({ id: 's2', name: 'Wind', path: 'sounds/wind.ogg' })];
  const playlist: FoundryPlaylistLibraryDocument = {
    id: 'p1',
    uuid: 'Playlist.p1',
    name: 'Ambience',
    mode: 0,
    fade: null,
    channel: 'music',
    playing: true,
    description: null,
    folder: null,
    sorting: 'a',
    sounds: { contents: sounds, get: (id) => sounds.find((entry) => entry.id === id) },
    playAll: jest.fn(),
    stopAll: jest.fn(),
    playSound: jest.fn(),
    stopSound: jest.fn(),
    createEmbeddedDocuments: jest.fn(),
    update: jest.fn((data: Record<string, unknown>) => {
      const { sounds: soundChanges, ...rest } = data as { sounds?: Array<{ _id: string } & Record<string, unknown>> };
      Object.assign(playlist, rest);
      for (const change of soundChanges ?? []) {
        Object.assign(sounds.find((entry) => entry.id === change._id) ?? {}, change);
      }
      return Promise.resolve(playlist);
    }),
    delete: jest.fn().mockResolvedValue(undefined),
    playNext: jest.fn(() => {
      for (const entry of sounds) {
        entry.playing = entry.id === 's2';
      }
      return Promise.resolve(playlist);
    }),
    bulkImportSounds: jest.fn((paths: string[]) =>
      Promise.resolve(paths.filter((path) => path.endsWith('.ogg')).map((path) => sound({ id: 'n1', name: 'Thunder', path })))
    )
  };
  const create = jest.fn().mockResolvedValue({ ...playlist, id: 'p2', name: 'Battle', playing: false });
  const game: FoundryPlaylistLibraryGame = {
    playlists: {
      get: (id) => (id === 'p1' ? playlist : undefined),
      documentClass: { create, prototype: { bulkImportSounds: jest.fn() } }
    },
    folders: { get: (id) => (id === 'music' ? { id: 'music', type: 'Playlist' } : undefined) }
  };
  return { deps: { gameProvider: { getGame: () => game } }, playlist, create };
}

describe('playlist management handlers', () => {
  it('creates a playlist and returns its full snapshot', async () => {
    const { deps, create } = setup();

    const response = await createCreatePlaylistHandler(deps)({ name: 'Battle', mode: 'shuffle', folderId: 'music' });

    expect(create).toHaveBeenCalledWith({ name: 'Battle', mode: 1, folder: 'music' });
    expect(response).toMatchObject({
      id: 'p2',
      name: 'Battle',
      folder: null,
      folderId: null,
      sorting: 'alphabetical',
      soundCount: 2,
      sounds: [
        { id: 's1', name: 'Rain', path: 'sounds/rain.ogg', channel: null, fade: null, sort: 0, description: null },
        expect.objectContaining({ id: 's2' })
      ]
    });
  });

  it('rejects a playlist without a name and one in a missing folder', async () => {
    const { deps } = setup();

    await expect(createCreatePlaylistHandler(deps)({ name: '' })).rejects.toThrow('name');
    await expect(createCreatePlaylistHandler(deps)({ name: 'x', folderId: 'nowhere' })).rejects.toThrow(
      'Folder not found: nowhere'
    );
  });

  it('stops a playing playlist whose mode changes', async () => {
    const { deps, playlist } = setup();

    const response = await createUpdatePlaylistHandler(deps)({ playlistId: 'p1', mode: 'simultaneous', fade: 2000 });

    expect(playlist.update).toHaveBeenCalledWith({
      mode: 2,
      fade: 2000,
      playing: false,
      sounds: [
        { _id: 's1', playing: false, pausedTime: null },
        { _id: 's2', playing: false, pausedTime: null }
      ]
    });
    expect(response).toMatchObject({ mode: 'simultaneous', fade: 2000, playing: false });
  });

  it('deletes a playlist and reports an unknown one', async () => {
    const { deps, playlist } = setup();

    await expect(createDeletePlaylistHandler(deps)({ playlistId: 'p1' })).resolves.toEqual({ deleted: true, playlistId: 'p1' });
    expect(playlist.delete).toHaveBeenCalled();
    await expect(createDeletePlaylistHandler(deps)({ playlistId: 'gone' })).rejects.toThrow('Playlist not found: gone');
  });

  it('changes the volume of a playing sound', async () => {
    const { deps, playlist } = setup();

    const response = await createUpdatePlaylistSoundHandler(deps)({ playlistId: 'p1', soundId: 's1', volume: 0.2, channel: 'environment' });

    expect(playlist.sounds.get('s1')?.update).toHaveBeenCalledWith({ volume: 0.2, channel: 'environment' });
    expect(response).toEqual({
      playlistId: 'p1',
      sound: {
        id: 's1',
        name: 'Rain',
        path: 'sounds/rain.ogg',
        playing: true,
        volume: 0.2,
        repeat: false,
        description: null,
        channel: 'environment',
        fade: null,
        sort: 0
      }
    });
  });

  it('rejects a sound update with an out-of-range volume or a non-audio path', async () => {
    const { deps } = setup();

    await expect(createUpdatePlaylistSoundHandler(deps)({ playlistId: 'p1', soundId: 's1', volume: 2 })).rejects.toThrow('volume');
    await expect(
      createUpdatePlaylistSoundHandler(deps)({ playlistId: 'p1', soundId: 's1', path: 'images/map.webp' })
    ).rejects.toThrow('path must be an audio file');
  });

  it('deletes a sound and reports an unknown one', async () => {
    const { deps } = setup();

    await expect(createDeletePlaylistSoundHandler(deps)({ playlistId: 'p1', soundId: 's2' })).resolves.toEqual({
      deleted: true,
      playlistId: 'p1',
      soundId: 's2'
    });
    await expect(createDeletePlaylistSoundHandler(deps)({ playlistId: 'p1', soundId: 'nope' })).rejects.toThrow(
      'Sound not found in playlist p1: nope'
    );
  });

  it('plays the next sound and reports it', async () => {
    const { deps, playlist } = setup();

    const response = await createPlayNextInPlaylistHandler(deps)({ playlistId: 'p1' });

    expect(playlist.playNext).toHaveBeenCalledWith(undefined, { direction: 1 });
    expect(response).toEqual({ playlistId: 'p1', sound: expect.objectContaining({ id: 's2', playing: true }) });
  });

  it('refuses to step a stopped playlist', async () => {
    const { deps, playlist } = setup();
    playlist.playing = false;

    await expect(createPlayNextInPlaylistHandler(deps)({ playlistId: 'p1', direction: 'previous' })).rejects.toThrow(
      'Playlist p1 is not playing'
    );
  });

  it('imports sounds by path and names the skipped ones', async () => {
    const { deps } = setup();

    const response = await createImportPlaylistSoundsHandler(deps)({ playlistId: 'p1', paths: ['sfx/thunder.ogg', 'readme.md'] });

    expect(response).toEqual({
      playlistId: 'p1',
      sounds: [expect.objectContaining({ id: 'n1', name: 'Thunder', path: 'sfx/thunder.ogg' })],
      skipped: ['readme.md']
    });
  });
});
