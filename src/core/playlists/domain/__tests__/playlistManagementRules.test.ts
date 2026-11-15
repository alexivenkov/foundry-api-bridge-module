import {
  NotAPlaylistFolderError,
  NotAnAudioFileError,
  PlaylistFolderNotFoundError,
  PlaylistNotPlayingError,
  PlaylistNotSteppableError,
  assertAudioPath,
  assertPlaylistFolder,
  assertSteppable,
  isPlaying,
  modeChangeStopsPlayback,
  requireSnapshot,
  uniquePaths,
  type PlaylistSnapshot,
  type PlaylistSoundSnapshot
} from '..';

function sound(overrides: Partial<PlaylistSoundSnapshot> = {}): PlaylistSoundSnapshot {
  return {
    id: 's1',
    name: 'Rain',
    path: 'sounds/rain.ogg',
    playing: false,
    volume: 0.5,
    repeat: false,
    description: null,
    channel: null,
    fade: null,
    sort: 0,
    ...overrides
  };
}

function playlist(overrides: Partial<PlaylistSnapshot> = {}): PlaylistSnapshot {
  return {
    id: 'p1',
    uuid: 'Playlist.p1',
    name: 'Ambience',
    mode: 'sequential',
    channel: 'music',
    fade: null,
    playing: false,
    description: null,
    folderName: null,
    folderId: null,
    sorting: 'alphabetical',
    sounds: [sound()],
    ...overrides
  };
}

describe('playlist rules', () => {
  it('sees a playlist as playing when it or any sound plays', () => {
    expect(isPlaying(playlist())).toBe(false);
    expect(isPlaying(playlist({ playing: true }))).toBe(true);
    expect(isPlaying(playlist({ sounds: [sound({ playing: true })] }))).toBe(true);
  });

  it('stops playback only for a different mode of a playing playlist', () => {
    const running = playlist({ playing: true });

    expect(modeChangeStopsPlayback(running, 'shuffle')).toBe(true);
    expect(modeChangeStopsPlayback(running, 'sequential')).toBe(false);
    expect(modeChangeStopsPlayback(running, undefined)).toBe(false);
    expect(modeChangeStopsPlayback(playlist(), 'shuffle')).toBe(false);
  });

  it('treats disabled and soundboard as the same mode', () => {
    expect(modeChangeStopsPlayback(playlist({ mode: 'soundboard', playing: true }), 'disabled')).toBe(false);
  });

  it('steps only through a running sequential or shuffled playlist', () => {
    expect(() => assertSteppable(playlist({ playing: true }))).not.toThrow();
    expect(() => assertSteppable(playlist({ mode: 'shuffle', playing: true }))).not.toThrow();
    expect(() => assertSteppable(playlist({ mode: 'simultaneous', playing: true }))).toThrow(PlaylistNotSteppableError);
    expect(() => assertSteppable(playlist({ mode: 'disabled', playing: true }))).toThrow(
      'Playlist p1 plays in soundboard mode; only sequential and shuffle playlists step from sound to sound'
    );
    expect(() => assertSteppable(playlist())).toThrow(PlaylistNotPlayingError);
    expect(() => assertSteppable(playlist())).toThrow('Playlist p1 is not playing');
  });

  it('accepts only a playlist folder', () => {
    expect(() => assertPlaylistFolder({ id: 'f1', type: 'Playlist' }, 'f1')).not.toThrow();
    expect(() => assertPlaylistFolder(null, 'f1')).toThrow(PlaylistFolderNotFoundError);
    expect(() => assertPlaylistFolder(null, 'f1')).toThrow('Folder not found: f1');
    expect(() => assertPlaylistFolder({ id: 'f1', type: 'Item' }, 'f1')).toThrow(NotAPlaylistFolderError);
    expect(() => assertPlaylistFolder({ id: 'f1', type: 'Item' }, 'f1')).toThrow(
      'Folder f1 holds Item documents, not playlists'
    );
  });

  it.each(['sounds/rain.ogg', 'Sounds/RAIN.MP3', 'https://example.com/a.webm?v=2', 'a/b.c/d.flac#t=3'])(
    'accepts the audio path %p',
    (path) => {
      expect(() => assertAudioPath(path)).not.toThrow();
    }
  );

  it.each(['icons/x.webp', 'sounds/rain', 'notes.txt', 'archive.ogg.zip'])('refuses the path %p', (path) => {
    expect(() => assertAudioPath(path)).toThrow(NotAnAudioFileError);
    expect(() => assertAudioPath(path)).toThrow('path must be an audio file (aac, flac, m4a, mid, mp3, ogg, opus, wav, webm)');
  });

  it('names each path once, in order', () => {
    expect(uniquePaths(['a.ogg', 'b.ogg', 'a.ogg'])).toEqual(['a.ogg', 'b.ogg']);
  });

  it('requires a snapshot', () => {
    expect(requireSnapshot(playlist(), 'p1').id).toBe('p1');
    expect(() => requireSnapshot(null, 'gone')).toThrow('Playlist not found: gone');
  });
});
