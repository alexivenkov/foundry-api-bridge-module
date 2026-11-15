import { CoreFeatureUnavailableError } from '../../../shared';
import {
  InvalidSoundDarknessRangeError,
  UnknownSoundEffectError,
  UnknownSoundLevelError,
  assertAmbientSoundFeatures,
  assertEffectsSupported,
  assertKnownEffect,
  assertPositionalSoundFeatures,
  assertSoundSceneLevels,
  isAudioPath,
  resolveSoundDarknessRange,
  type PositionalSound,
  type SoundFeatures
} from '..';

const ALL: SoundFeatures = { elevation: true, effects: true, positionalElevation: true, levels: true };
const V13: SoundFeatures = { ...ALL, levels: false };
const V11: SoundFeatures = { elevation: false, effects: false, positionalElevation: false, levels: false };

describe('isAudioPath', () => {
  it.each(['sounds/fire.ogg', 'a b/c d.MP3', 'x.aac', 'x.flac', 'x.m4a', 'x.mid', 'x.opus', 'x.wav', 'x.webm', 'a/b.mp3?v=2', 'https://example.com/a.mp3'])(
    'accepts %s',
    (path) => {
      expect(isAudioPath(path)).toBe(true);
    }
  );

  it.each(['a/b', 'a/b.txt', 'x.mp4', 'x.oga', 'a.mp3.txt', 'a/*.mp3', 'data:audio/mpeg;base64,AAAA', ''])(
    'rejects %s',
    (path) => {
      expect(isAudioPath(path)).toBe(false);
    }
  );
});

describe('assertAmbientSoundFeatures', () => {
  it('lets everything through on Foundry 14', () => {
    expect(() =>
      assertAmbientSoundFeatures(
        { elevation: 1, baseEffect: { type: 'reverb' }, muffledEffect: {}, name: 'x', locked: true, levels: [] },
        ALL
      )
    ).not.toThrow();
  });

  it.each([{ name: null }, { locked: true }, { levels: ['a'] }])('refuses %p before Foundry 14', (changes) => {
    expect(() => assertAmbientSoundFeatures(changes, V13)).toThrow(
      'Ambient sound names, locks and scene levels require Foundry 14 or newer'
    );
  });

  it('refuses elevation and effects before Foundry 12', () => {
    expect(() => assertAmbientSoundFeatures({ elevation: 0 }, V11)).toThrow(
      'Ambient sound elevation requires Foundry 12 or newer'
    );
    expect(() => assertAmbientSoundFeatures({ muffledEffect: { intensity: 3 } }, V11)).toThrow(
      new CoreFeatureUnavailableError('Sound effects require Foundry 12 or newer')
    );
    expect(() => assertAmbientSoundFeatures({ radius: 10, volume: 0.5, darkness: { min: 0.2 } }, V11)).not.toThrow();
  });

  it('assertEffectsSupported only refuses when effects are asked for', () => {
    expect(() => assertEffectsSupported(false, V11)).not.toThrow();
    expect(() => assertEffectsSupported(true, V11)).toThrow(CoreFeatureUnavailableError);
    expect(() => assertEffectsSupported(true, ALL)).not.toThrow();
  });
});

describe('assertPositionalSoundFeatures', () => {
  const sound: PositionalSound = {
    src: 'a.ogg',
    x: 0,
    y: 0,
    elevation: undefined,
    radius: 10,
    volume: 1,
    easing: true,
    walls: true,
    gmAlways: true,
    baseEffect: undefined,
    muffledEffect: undefined
  };

  it('refuses effects before 12 and an elevation before 13', () => {
    expect(() => assertPositionalSoundFeatures(sound, V11)).not.toThrow();
    expect(() => assertPositionalSoundFeatures({ ...sound, muffledEffect: { type: 'lowpass', intensity: 2 } }, V11)).toThrow(
      'Sound effects require Foundry 12 or newer'
    );
    const v12: SoundFeatures = { ...ALL, positionalElevation: false };
    expect(() => assertPositionalSoundFeatures({ ...sound, elevation: 5 }, v12)).toThrow(
      'Positional sound elevation requires Foundry 13 or newer'
    );
    expect(() => assertPositionalSoundFeatures({ ...sound, elevation: 5 }, V13)).not.toThrow();
  });
});

describe('resolveSoundDarknessRange', () => {
  it('merges the given bounds and refuses an inverted range', () => {
    expect(resolveSoundDarknessRange({ min: 0.1, max: 0.5 }, { min: 0.4 })).toEqual({ min: 0.4, max: 0.5 });
    expect(() => resolveSoundDarknessRange({ min: 0, max: 1 }, { min: 0.8, max: 0.2 })).toThrow(
      new InvalidSoundDarknessRangeError(0.8, 0.2)
    );
  });
});

describe('assertKnownEffect', () => {
  it('accepts a registered id, null, absent and an unreadable registry', () => {
    expect(() => assertKnownEffect('reverb', ['lowpass', 'reverb'])).not.toThrow();
    expect(() => assertKnownEffect(null, ['reverb'])).not.toThrow();
    expect(() => assertKnownEffect(undefined, ['reverb'])).not.toThrow();
    expect(() => assertKnownEffect('echo', null)).not.toThrow();
  });

  it('refuses an unknown id, naming the known ones', () => {
    expect(() => assertKnownEffect('echo', ['lowpass', 'highpass', 'reverb'])).toThrow(
      new UnknownSoundEffectError('echo', ['lowpass', 'highpass', 'reverb'])
    );
    expect(() => assertKnownEffect('echo', ['reverb'])).toThrow('Unknown sound effect: echo. Known: reverb');
  });
});

describe('assertSoundSceneLevels', () => {
  it('refuses a level that is not in the scene', () => {
    expect(() => assertSoundSceneLevels(['a'], ['a'])).not.toThrow();
    expect(() => assertSoundSceneLevels(['b'], ['a'])).toThrow(new UnknownSoundLevelError('b'));
  });
});
