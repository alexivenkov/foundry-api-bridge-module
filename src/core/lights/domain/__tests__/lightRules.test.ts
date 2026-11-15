import { CoreFeatureUnavailableError } from '../../../shared';
import {
  InvalidLightDarknessRangeError,
  LIGHT_COLORATIONS,
  UnknownLightAnimationError,
  UnknownLightLevelError,
  assertKnownAnimation,
  assertLightFeatures,
  assertSceneLevels,
  isAttenuationColoration,
  resolveDarknessRange,
  type LightFeatures
} from '..';

const ALL: LightFeatures = { elevation: true, darknessSources: true, attenuationColorations: true, levels: true };
const V13: LightFeatures = { ...ALL, attenuationColorations: false, levels: false };
const V11: LightFeatures = { elevation: false, darknessSources: false, attenuationColorations: false, levels: false };

describe('light colorations', () => {
  it('knows the 13 techniques of Foundry 14, two of them new in 14', () => {
    expect(LIGHT_COLORATIONS).toHaveLength(13);
    expect(LIGHT_COLORATIONS.filter(isAttenuationColoration)).toEqual(['natural-attenuation', 'adaptive-attenuation']);
  });
});

describe('assertLightFeatures', () => {
  it('lets everything through on Foundry 14', () => {
    expect(() =>
      assertLightFeatures(
        { elevation: 1, negative: true, priority: 2, coloration: 'adaptive-attenuation', name: 'x', locked: true, levels: [] },
        ALL
      )
    ).not.toThrow();
  });

  it('refuses the attenuation colorations before Foundry 14 but keeps the older ones', () => {
    expect(() => assertLightFeatures({ coloration: 'natural-light' }, V13)).not.toThrow();
    expect(() => assertLightFeatures({ coloration: 'natural-attenuation' }, V13)).toThrow(
      new CoreFeatureUnavailableError('The natural-attenuation coloration requires Foundry 14 or newer')
    );
  });

  it.each([{ name: null }, { locked: false }, { levels: [] }])('refuses %p before Foundry 14', (changes) => {
    expect(() => assertLightFeatures(changes, V13)).toThrow(
      'Light names, locks and scene levels require Foundry 14 or newer'
    );
  });

  it('refuses elevation, darkness sources and priority before Foundry 12', () => {
    expect(() => assertLightFeatures({ elevation: 0 }, V11)).toThrow('Light elevation requires Foundry 12 or newer');
    expect(() => assertLightFeatures({ negative: false }, V11)).toThrow(
      'Darkness sources and light priority require Foundry 12 or newer'
    );
    expect(() => assertLightFeatures({ priority: 1 }, V11)).toThrow(CoreFeatureUnavailableError);
    expect(() => assertLightFeatures({ dim: 10, bright: 5, animation: { type: 'torch' } }, V11)).not.toThrow();
  });
});

describe('resolveDarknessRange', () => {
  it('merges the given bounds into the current range', () => {
    expect(resolveDarknessRange({ min: 0.1, max: 0.5 }, { min: 0.4 })).toEqual({ min: 0.4, max: 0.5 });
    expect(resolveDarknessRange({ min: 0.1, max: 0.5 }, undefined)).toEqual({ min: 0.1, max: 0.5 });
  });

  it('allows an empty-width range and refuses an inverted one', () => {
    expect(resolveDarknessRange({ min: 0, max: 1 }, { min: 0.5, max: 0.5 })).toEqual({ min: 0.5, max: 0.5 });
    expect(() => resolveDarknessRange({ min: 0.1, max: 0.5 }, { min: 0.9 })).toThrow(
      new InvalidLightDarknessRangeError(0.9, 0.5)
    );
    expect(() => resolveDarknessRange({ min: 0.1, max: 0.5 }, { min: 0.9 })).toThrow(
      'Darkness range min (0.9) may not exceed max (0.5)'
    );
  });
});

describe('assertKnownAnimation', () => {
  it('accepts a registered id, null and an absent type', () => {
    expect(() => assertKnownAnimation('torch', 'light', ['torch', 'pulse'])).not.toThrow();
    expect(() => assertKnownAnimation(null, 'light', ['torch'])).not.toThrow();
    expect(() => assertKnownAnimation(undefined, 'light', ['torch'])).not.toThrow();
  });

  it('refuses an id the registry of that kind does not have, naming the known ones', () => {
    expect(() => assertKnownAnimation('torch', 'darkness', ['magicalGloom', 'hole'])).toThrow(
      new UnknownLightAnimationError('torch', 'darkness', ['magicalGloom', 'hole'])
    );
    expect(() => assertKnownAnimation('fire', 'light', ['torch'])).toThrow('Unknown light animation: fire. Known: torch');
  });

  it('skips the check when the registry cannot be read', () => {
    expect(() => assertKnownAnimation('anything', 'light', null)).not.toThrow();
  });
});

describe('assertSceneLevels', () => {
  it('accepts levels of the scene and an empty set', () => {
    expect(() => assertSceneLevels(['a', 'b'], ['a', 'b', 'c'])).not.toThrow();
    expect(() => assertSceneLevels([], [])).not.toThrow();
    expect(() => assertSceneLevels(undefined, [])).not.toThrow();
  });

  it('refuses the first level that is not in the scene', () => {
    expect(() => assertSceneLevels(['a', 'zz'], ['a'])).toThrow(new UnknownLightLevelError('zz'));
    expect(() => assertSceneLevels(['zz'], ['a'])).toThrow('Unknown scene level: zz');
  });
});
