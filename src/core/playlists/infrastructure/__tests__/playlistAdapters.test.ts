import { SoundPlayerUnavailableError } from '../../domain';
import { FoundrySoundPlayer, type FoundryAudioGlobals } from '../FoundrySoundPlayer';
import { playlistModeFromCode, playlistModeToCode } from '../playlistModeCodes';

describe('playlist mode codes', () => {
  // CONST.PLAYLIST_MODES of Foundry 13.351 and 14.368; the schema accepts no other value.
  it.each([
    [-1, 'soundboard'],
    [0, 'sequential'],
    [1, 'shuffle'],
    [2, 'simultaneous']
  ] as const)('code %i is %s, both ways', (code, mode) => {
    expect(playlistModeFromCode(code)).toBe(mode);
    expect(playlistModeToCode(mode)).toBe(code);
  });

  it('never reports disabled, and takes it as the name the core gives the soundboard mode', () => {
    for (const code of [-1, 0, 1, 2, 3, 99, -2]) {
      expect(playlistModeFromCode(code)).not.toBe('disabled');
    }
    expect(playlistModeToCode('disabled')).toBe(-1);
  });

  it.each([3, -2, 99])('reads the code %d, which the core does not have, as soundboard', (code) => {
    expect(playlistModeFromCode(code)).toBe('soundboard');
  });
});

describe('FoundrySoundPlayer', () => {
  const door = { src: 'sounds/door.ogg', volume: 0.3, loop: true };

  function helper(): { play: jest.Mock } {
    return { play: jest.fn().mockResolvedValue(undefined) };
  }

  it('plays through the namespaced AudioHelper, always asking for autoplay', async () => {
    const namespaced = helper();
    const player = new FoundrySoundPlayer(() => ({ foundry: { audio: { AudioHelper: namespaced } } }));

    expect(player.isAvailable()).toBe(true);
    await player.play(door, false);

    expect(namespaced.play).toHaveBeenCalledWith(
      { src: 'sounds/door.ogg', volume: 0.3, autoplay: true, loop: true },
      false
    );
  });

  it('falls back to the bare AudioHelper global of older versions', async () => {
    const legacy = helper();
    const player = new FoundrySoundPlayer(() => ({ AudioHelper: legacy }));

    await player.play(door, true);

    expect(legacy.play).toHaveBeenCalledWith(expect.objectContaining({ src: 'sounds/door.ogg' }), true);
  });

  it('prefers the namespaced helper when both exist', async () => {
    const namespaced = helper();
    const legacy = helper();
    const player = new FoundrySoundPlayer(() => ({ foundry: { audio: { AudioHelper: namespaced } }, AudioHelper: legacy }));

    await player.play(door, true);

    expect(namespaced.play).toHaveBeenCalledTimes(1);
    expect(legacy.play).not.toHaveBeenCalled();
  });

  it('skips a namespaced helper that cannot play', async () => {
    const legacy = helper();
    const broken = {} as unknown as { play: jest.Mock };
    const player = new FoundrySoundPlayer(() => ({ foundry: { audio: { AudioHelper: broken } }, AudioHelper: legacy }));

    await player.play(door, true);

    expect(legacy.play).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['no audio globals', {}],
    ['a foundry namespace without audio', { foundry: {} }],
    ['an audio namespace without a helper', { foundry: { audio: {} } }]
  ] as Array<[string, FoundryAudioGlobals]>)('is unavailable with %s', async (_case, globals) => {
    const player = new FoundrySoundPlayer(() => globals);

    expect(player.isAvailable()).toBe(false);
    await expect(player.play(door, true)).rejects.toThrow(SoundPlayerUnavailableError);
  });

  it('reads the globals at call time, not when it is built', async () => {
    let globals: FoundryAudioGlobals = {};
    const player = new FoundrySoundPlayer(() => globals);
    const late = helper();

    expect(player.isAvailable()).toBe(false);
    globals = { foundry: { audio: { AudioHelper: late } } };

    expect(player.isAvailable()).toBe(true);
    await player.play(door, true);
    expect(late.play).toHaveBeenCalledTimes(1);
  });
});
