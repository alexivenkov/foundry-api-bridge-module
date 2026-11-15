import {
  addSoundToPlaylistRequestSchema,
  getPlaylistRequestSchema,
  playPlaylistRequestSchema,
  playSoundInPlaylistRequestSchema,
  playSoundOnceRequestSchema,
  stopPlaylistRequestSchema,
  stopSoundInPlaylistRequestSchema,
  toAddPlaylistSoundCommand,
  toGetPlaylistQuery,
  toPlayPlaylistCommand,
  toPlayPlaylistSoundCommand,
  toPlaySoundOnceCommand,
  toStopPlaylistCommand,
  toStopPlaylistSoundCommand
} from '..';

describe('playlist request schemas', () => {
  it.each([
    ['get-playlist', getPlaylistRequestSchema],
    ['play-playlist', playPlaylistRequestSchema],
    ['stop-playlist', stopPlaylistRequestSchema]
  ])('%s requires a string playlist id', (_command, schema) => {
    expect(schema.safeParse({ playlistId: 'p1' }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ playlistId: 7 }).success).toBe(false);
  });

  it.each([
    ['play-sound-in-playlist', playSoundInPlaylistRequestSchema],
    ['stop-sound-in-playlist', stopSoundInPlaylistRequestSchema]
  ])('%s requires both the playlist and the sound id', (_command, schema) => {
    expect(schema.safeParse({ playlistId: 'p1', soundId: 's1' }).success).toBe(true);
    expect(schema.safeParse({ playlistId: 'p1' }).success).toBe(false);
    expect(schema.safeParse({ soundId: 's1' }).success).toBe(false);
  });

  it('accepts a new sound with only its name and path', () => {
    const request = { playlistId: 'p1', name: 'Door', path: 'sounds/door.ogg' };

    expect(addSoundToPlaylistRequestSchema.safeParse(request).success).toBe(true);
  });

  it.each([
    ['no name', { playlistId: 'p1', path: 'sounds/door.ogg' }],
    ['no path', { playlistId: 'p1', name: 'Door' }],
    ['a non-numeric volume', { playlistId: 'p1', name: 'Door', path: 'sounds/door.ogg', volume: 'loud' }],
    ['a non-boolean repeat flag', { playlistId: 'p1', name: 'Door', path: 'sounds/door.ogg', repeat: 1 }]
  ])('rejects a new sound with %s', (_case, request) => {
    expect(addSoundToPlaylistRequestSchema.safeParse(request).success).toBe(false);
  });

  it('does not range-check a volume: the core decides', () => {
    const request = { playlistId: 'p1', name: 'Door', path: 'sounds/door.ogg', volume: 7 };

    expect(addSoundToPlaylistRequestSchema.safeParse(request).success).toBe(true);
    expect(playSoundOnceRequestSchema.safeParse({ src: 'sounds/door.ogg', volume: -1 }).success).toBe(true);
  });

  it('requires a source for a one-shot sound and accepts null where it falls back to a default', () => {
    expect(playSoundOnceRequestSchema.safeParse({}).success).toBe(false);
    expect(playSoundOnceRequestSchema.safeParse({ src: 'a.ogg', volume: null, loop: null, broadcast: null }).success)
      .toBe(true);
    expect(playSoundOnceRequestSchema.safeParse({ src: 'a.ogg', broadcast: 'everyone' }).success).toBe(false);
  });

  it('ignores unknown keys', () => {
    expect(playSoundOnceRequestSchema.parse({ src: 'a.ogg', channel: 'music' })).toEqual({ src: 'a.ogg' });
    expect(getPlaylistRequestSchema.parse({ playlistId: 'p1', mode: 'shuffle' })).toEqual({ playlistId: 'p1' });
  });
});

describe('playlist request mappers', () => {
  it('maps the requests that only address a playlist or one of its sounds', () => {
    expect(toGetPlaylistQuery({ playlistId: 'p1' })).toEqual({ playlistId: 'p1' });
    expect(toPlayPlaylistCommand({ playlistId: 'p1' })).toEqual({ playlistId: 'p1' });
    expect(toStopPlaylistCommand({ playlistId: 'p1' })).toEqual({ playlistId: 'p1' });
    expect(toPlayPlaylistSoundCommand({ playlistId: 'p1', soundId: 's1' })).toEqual({ playlistId: 'p1', soundId: 's1' });
    expect(toStopPlaylistSoundCommand({ playlistId: 'p1', soundId: 's1' })).toEqual({ playlistId: 'p1', soundId: 's1' });
  });

  it('builds a sound draft, leaving what was not given to the core', () => {
    const command = toAddPlaylistSoundCommand({ playlistId: 'p1', name: 'Door', path: 'sounds/door.ogg', repeat: true });

    expect(command.playlistId).toBe('p1');
    expect(command.draft).toMatchObject({ name: 'Door', path: 'sounds/door.ogg', repeat: true });
    expect(command.draft.volume).toBeUndefined();
    expect(command.draft.description).toBeUndefined();
  });

  it('plays a one-shot sound at volume 0.8, once, for everyone by default', () => {
    expect(toPlaySoundOnceCommand({ src: 'sounds/door.ogg' })).toEqual({
      sound: { src: 'sounds/door.ogg', volume: 0.8, loop: false },
      broadcast: true
    });
  });

  it('reads null as not given for a one-shot sound', () => {
    expect(toPlaySoundOnceCommand({ src: 'a.ogg', volume: null, loop: null, broadcast: null })).toEqual({
      sound: { src: 'a.ogg', volume: 0.8, loop: false },
      broadcast: true
    });
  });

  it('keeps what the caller chose for a one-shot sound, a volume of zero included', () => {
    expect(toPlaySoundOnceCommand({ src: 'a.ogg', volume: 0, loop: true, broadcast: false })).toEqual({
      sound: { src: 'a.ogg', volume: 0, loop: true },
      broadcast: false
    });
  });
});
