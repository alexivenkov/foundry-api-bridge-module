import {
  createPlaylistRequestSchema,
  deletePlaylistRequestSchema,
  deletePlaylistSoundRequestSchema,
  importPlaylistSoundsRequestSchema,
  playNextInPlaylistRequestSchema,
  toCreatePlaylistCommand,
  toDeletePlaylistCommand,
  toDeletePlaylistSoundCommand,
  toImportPlaylistSoundsCommand,
  toStepPlaylistCommand,
  toUpdatePlaylistCommand,
  toUpdatePlaylistSoundCommand,
  updatePlaylistRequestSchema,
  updatePlaylistSoundRequestSchema
} from '..';

describe('playlist management schemas', () => {
  it('maps a new playlist, an empty or null folder meaning the root', () => {
    const full = createPlaylistRequestSchema.parse({
      name: 'Battle',
      description: 'Drums',
      mode: 'shuffle',
      channel: 'environment',
      fade: 1000,
      sorting: 'manual',
      folderId: 'f1'
    });

    expect(toCreatePlaylistCommand(full)).toEqual({
      draft: {
        name: 'Battle',
        description: 'Drums',
        mode: 'shuffle',
        channel: 'environment',
        fade: 1000,
        sorting: 'manual',
        folderId: 'f1'
      }
    });
    expect(toCreatePlaylistCommand(createPlaylistRequestSchema.parse({ name: 'x', folderId: '' })).draft.folderId).toBeUndefined();
    expect(toCreatePlaylistCommand(createPlaylistRequestSchema.parse({ name: 'x', folderId: null })).draft.folderId).toBeUndefined();
  });

  it.each([
    ['no name', {}],
    ['an empty name', { name: '' }],
    ['an unknown mode', { name: 'x', mode: 'loop' }],
    ['an unknown channel', { name: 'x', channel: 'voice' }],
    ['a fade of 0', { name: 'x', fade: 0 }],
    ['a fractional fade', { name: 'x', fade: 1.5 }],
    ['an unknown sorting', { name: 'x', sorting: 'z' }]
  ])('rejects a new playlist with %s', (_case, request) => {
    expect(createPlaylistRequestSchema.safeParse(request).success).toBe(false);
  });

  it('maps a playlist update, null clearing fields', () => {
    const request = updatePlaylistRequestSchema.parse({
      playlistId: 'p1',
      description: null,
      fade: null,
      folderId: null,
      mode: 'disabled'
    });

    expect(toUpdatePlaylistCommand(request)).toEqual({
      playlistId: 'p1',
      changes: {
        name: undefined,
        description: null,
        mode: 'disabled',
        channel: undefined,
        fade: null,
        sorting: undefined,
        folderId: null
      }
    });
  });

  it.each([
    ['no playlist', {}],
    ['a null channel', { playlistId: 'p1', channel: null }],
    ['an empty folder id', { playlistId: 'p1', folderId: '' }],
    ['a negative fade', { playlistId: 'p1', fade: -5 }]
  ])('rejects a playlist update with %s', (_case, request) => {
    expect(updatePlaylistRequestSchema.safeParse(request).success).toBe(false);
  });

  it('maps a sound update', () => {
    const request = updatePlaylistSoundRequestSchema.parse({
      playlistId: 'p1',
      soundId: 's1',
      volume: 0,
      fade: 0,
      channel: null,
      sort: -2,
      description: null
    });

    expect(toUpdatePlaylistSoundCommand(request)).toEqual({
      playlistId: 'p1',
      soundId: 's1',
      changes: {
        name: undefined,
        path: undefined,
        description: null,
        volume: 0,
        repeat: undefined,
        fade: 0,
        channel: null,
        sort: -2
      }
    });
  });

  it.each([
    ['a volume above 1', { volume: 1.5 }],
    ['a negative volume', { volume: -0.1 }],
    ['a negative fade', { fade: -1 }],
    ['a fractional fade', { fade: 2.5 }],
    ['a fractional sort', { sort: 1.5 }],
    ['an empty path', { path: '' }],
    ['an unknown channel', { channel: 'voice' }]
  ])('rejects a sound update with %s', (_case, extra) => {
    expect(updatePlaylistSoundRequestSchema.safeParse({ playlistId: 'p1', soundId: 's1', ...extra }).success).toBe(false);
  });

  it('maps a step, next by default', () => {
    expect(toStepPlaylistCommand(playNextInPlaylistRequestSchema.parse({ playlistId: 'p1' }))).toEqual({
      playlistId: 'p1',
      direction: 'next'
    });
    expect(toStepPlaylistCommand(playNextInPlaylistRequestSchema.parse({ playlistId: 'p1', direction: 'previous' })).direction).toBe(
      'previous'
    );
    expect(playNextInPlaylistRequestSchema.safeParse({ playlistId: 'p1', direction: 'back' }).success).toBe(false);
  });

  it('maps an import and bounds the number of paths', () => {
    expect(toImportPlaylistSoundsCommand(importPlaylistSoundsRequestSchema.parse({ playlistId: 'p1', paths: ['a.ogg'] }))).toEqual({
      playlistId: 'p1',
      paths: ['a.ogg']
    });
    expect(importPlaylistSoundsRequestSchema.safeParse({ playlistId: 'p1', paths: [] }).success).toBe(false);
    expect(importPlaylistSoundsRequestSchema.safeParse({ playlistId: 'p1', paths: [''] }).success).toBe(false);
    expect(
      importPlaylistSoundsRequestSchema.safeParse({ playlistId: 'p1', paths: Array.from({ length: 101 }, (_v, i) => `${String(i)}.ogg`) })
        .success
    ).toBe(false);
  });

  it('maps the requests that only address a playlist or sound', () => {
    expect(toDeletePlaylistCommand(deletePlaylistRequestSchema.parse({ playlistId: 'p1' }))).toEqual({ playlistId: 'p1' });
    expect(toDeletePlaylistSoundCommand(deletePlaylistSoundRequestSchema.parse({ playlistId: 'p1', soundId: 's1' }))).toEqual({
      playlistId: 'p1',
      soundId: 's1'
    });
    expect(deletePlaylistSoundRequestSchema.safeParse({ playlistId: 'p1' }).success).toBe(false);
  });
});
