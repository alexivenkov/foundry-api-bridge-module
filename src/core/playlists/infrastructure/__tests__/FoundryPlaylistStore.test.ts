import { PlaylistNotFoundError, PlaylistSoundNotFoundError } from '../../domain';
import { FoundryPlaylistStore } from '../FoundryPlaylistStore';
import type {
  FoundryPlaylistDocument,
  FoundryPlaylistGame,
  FoundryPlaylistSoundDocument
} from '../foundryPlaylistTypes';

function soundDocument(overrides: Partial<FoundryPlaylistSoundDocument> = {}): FoundryPlaylistSoundDocument {
  return {
    id: 's1',
    name: 'Tavern theme',
    path: 'sounds/tavern.ogg',
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

function playlistDocument(
  sounds: FoundryPlaylistSoundDocument[] = [],
  overrides: Partial<FoundryPlaylistDocument> = {}
): FoundryPlaylistDocument {
  return {
    id: 'ambience',
    uuid: 'Playlist.ambience',
    name: 'Ambience',
    mode: 0,
    fade: 2000,
    channel: 'music',
    playing: true,
    description: 'Background',
    folder: { id: 'f1', name: 'Music' },
    sounds: { contents: sounds, get: (id) => sounds.find((sound) => sound.id === id) },
    playAll: jest.fn(),
    stopAll: jest.fn().mockResolvedValue(undefined),
    playSound: jest.fn().mockResolvedValue(undefined),
    stopSound: jest.fn().mockResolvedValue(undefined),
    createEmbeddedDocuments: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides
  };
}

function storeFor(...documents: FoundryPlaylistDocument[]): FoundryPlaylistStore {
  const game: FoundryPlaylistGame = {
    playlists: { contents: documents, get: (id) => documents.find((doc) => doc.id === id) }
  };
  return new FoundryPlaylistStore({ getGame: () => game });
}

describe('FoundryPlaylistStore', () => {
  describe('reading', () => {
    it('maps a playlist with its sounds, naming the folder it is in', () => {
      const document = playlistDocument([soundDocument({ playing: true, volume: 0.7, repeat: true })]);

      expect(storeFor(document).findPlaylist('ambience')).toEqual({
        id: 'ambience',
        uuid: 'Playlist.ambience',
        name: 'Ambience',
        mode: 'sequential',
        channel: 'music',
        fade: 2000,
        playing: true,
        description: 'Background',
        folderName: 'Music',
        sounds: [
          { id: 's1', name: 'Tavern theme', path: 'sounds/tavern.ogg', playing: true, volume: 0.7, repeat: true }
        ]
      });
    });

    it('reads a missing channel, fade, description and folder as null', () => {
      const document = playlistDocument([], { channel: undefined, fade: undefined, description: undefined, folder: undefined });

      expect(storeFor(document).findPlaylist('ambience')).toMatchObject({
        channel: null,
        fade: null,
        description: null,
        folderName: null,
        sounds: []
      });
    });

    it('lists the playlists in the order of the collection', () => {
      const store = storeFor(playlistDocument([], { id: 'b' }), playlistDocument([], { id: 'a' }));

      expect(store.listPlaylists().map((playlist) => playlist.id)).toEqual(['b', 'a']);
    });

    it('returns null for an unknown playlist', () => {
      expect(storeFor(playlistDocument()).findPlaylist('missing')).toBeNull();
    });
  });

  describe('playAll', () => {
    it('starts the playlist and reports the sounds of the document the core hands back', async () => {
      const before = playlistDocument([soundDocument(), soundDocument({ id: 's2' })]);
      const after = playlistDocument([soundDocument({ playing: true }), soundDocument({ id: 's2' })]);
      (before.playAll as jest.Mock).mockResolvedValue(after);

      const sounds = await storeFor(before).playAll('ambience');

      expect(before.playAll).toHaveBeenCalledTimes(1);
      expect(sounds.map((sound) => sound.playing)).toEqual([true, false]);
    });

    it('reports the playlist as it is when the core resolves nothing because the start changed nothing', async () => {
      const document = playlistDocument([soundDocument({ playing: true }), soundDocument({ id: 's2', playing: true })]);
      (document.playAll as jest.Mock).mockResolvedValue(undefined);

      const sounds = await storeFor(document).playAll('ambience');

      expect(document.playAll).toHaveBeenCalledTimes(1);
      expect(sounds.map((sound) => sound.playing)).toEqual([true, true]);
    });

    it('reports the same document the core resolves, which is what a real update hands back', async () => {
      const document = playlistDocument([soundDocument()]);
      (document.playAll as jest.Mock).mockImplementation(() => {
        (document.sounds.contents[0] as { playing: boolean }).playing = true;
        return Promise.resolve(document);
      });

      await expect(storeFor(document).playAll('ambience')).resolves.toEqual([
        expect.objectContaining({ id: 's1', playing: true })
      ]);
    });
  });

  it('stops the playlist', async () => {
    const document = playlistDocument();

    await storeFor(document).stopAll('ambience');

    expect(document.stopAll).toHaveBeenCalledTimes(1);
  });

  describe('single sounds', () => {
    it('starts and stops a sound by handing its document to the playlist', async () => {
      const rain = soundDocument({ id: 's2', name: 'Rain' });
      const document = playlistDocument([soundDocument(), rain]);
      const store = storeFor(document);

      await store.playSound('ambience', 's2');
      await store.stopSound('ambience', 's2');

      expect(document.playSound).toHaveBeenCalledWith(rain);
      expect(document.stopSound).toHaveBeenCalledWith(rain);
    });

    it('rejects a sound the playlist does not have without calling the core', async () => {
      const document = playlistDocument([soundDocument()]);
      const store = storeFor(document);

      await expect(store.playSound('ambience', 'missing')).rejects.toThrow(PlaylistSoundNotFoundError);
      await expect(store.stopSound('ambience', 'missing'))
        .rejects.toThrow('Sound not found in playlist ambience: missing');
      expect(document.playSound).not.toHaveBeenCalled();
      expect(document.stopSound).not.toHaveBeenCalled();
    });
  });

  describe('addSound', () => {
    it('creates the embedded sound and returns it', async () => {
      const document = playlistDocument();
      (document.createEmbeddedDocuments as jest.Mock).mockResolvedValue([
        soundDocument({ id: 'new', name: 'Door', path: 'sounds/door.ogg', volume: 0.9, repeat: true })
      ]);

      const added = await storeFor(document).addSound('ambience', {
        name: 'Door',
        path: 'sounds/door.ogg',
        volume: 0.9,
        repeat: true,
        description: 'Creak'
      });

      expect(document.createEmbeddedDocuments).toHaveBeenCalledWith('PlaylistSound', [
        { name: 'Door', path: 'sounds/door.ogg', volume: 0.9, repeat: true, description: 'Creak' }
      ]);
      expect(added).toEqual({
        id: 'new',
        name: 'Door',
        path: 'sounds/door.ogg',
        playing: false,
        volume: 0.9,
        repeat: true
      });
    });

    it('sends only the attributes that are set', async () => {
      const document = playlistDocument();
      (document.createEmbeddedDocuments as jest.Mock).mockResolvedValue([soundDocument()]);

      await storeFor(document).addSound('ambience', { name: 'Door', path: 'sounds/door.ogg', volume: undefined });

      const payload = (document.createEmbeddedDocuments as jest.Mock).mock.calls[0]?.[1] as Record<string, unknown>[];
      expect(Object.keys(payload[0] ?? {})).toEqual(['name', 'path']);
    });

    it('resolves to null when the core created nothing', async () => {
      const document = playlistDocument();
      (document.createEmbeddedDocuments as jest.Mock).mockResolvedValue([]);

      await expect(storeFor(document).addSound('ambience', { name: 'Door', path: 'sounds/door.ogg' }))
        .resolves.toBeNull();
    });
  });

  it('rejects every write to an unknown playlist', async () => {
    const store = storeFor(playlistDocument());

    await expect(store.playAll('missing')).rejects.toThrow(PlaylistNotFoundError);
    await expect(store.stopAll('missing')).rejects.toThrow('Playlist not found: missing');
    await expect(store.playSound('missing', 's1')).rejects.toThrow(PlaylistNotFoundError);
    await expect(store.stopSound('missing', 's1')).rejects.toThrow(PlaylistNotFoundError);
    await expect(store.addSound('missing', { name: 'x', path: 'y' })).rejects.toThrow(PlaylistNotFoundError);
  });
});
