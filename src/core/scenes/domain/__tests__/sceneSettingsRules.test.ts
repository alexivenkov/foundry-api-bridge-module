import { CoreFeatureUnavailableError } from '../../../shared/domain';
import {
  GlobalLightDarknessRangeError,
  WeatherEffectNotFoundError
} from '../errors/sceneSettingsErrors';
import type { SceneFeatures } from '../model/SceneSettings';
import type { LinkedCollection } from '../ports/ports';
import {
  assertKnownWeather,
  assertSceneFeatures,
  resolveGlobalLightDarkness,
  resolveLink,
  type LinkErrors
} from '../rules/sceneSettingsRules';

const ALL: SceneFeatures = { environmentDetails: true, gridStyle: true, levels: true };
const V13: SceneFeatures = { environmentDetails: true, gridStyle: true, levels: false };
const V11: SceneFeatures = { environmentDetails: false, gridStyle: false, levels: false };

describe('assertSceneFeatures', () => {
  it('lets every setting through where the core has them all', () => {
    expect(() =>
      assertSceneFeatures(
        { darknessLock: true, blendAmbience: false, globalLight: { color: '#ffffff' }, grid: { style: 'dottedLines' }, initialLevelId: 'l1' },
        ALL
      )
    ).not.toThrow();
  });

  it.each([
    ['the darkness lock', { darknessLock: true }],
    ['ambience blending', { blendAmbience: false }],
    ['the base ambience', { baseAmbience: { hue: 0.2 } }],
    ['the dark ambience', { darkAmbience: { intensity: 0.5 } }],
    ['a global light color', { globalLight: { color: null } }],
    ['the global light darkness minimum', { globalLight: { darkness: { min: 0.2 } } }]
  ])('refuses %s before Foundry 12', (_name, changes) => {
    expect(() => assertSceneFeatures(changes, V11)).toThrow(
      new CoreFeatureUnavailableError('The darkness lock, ambience and global light details require Foundry 12 or newer')
    );
  });

  it('keeps the global light switch and its threshold on Foundry 11, which stored them flat', () => {
    expect(() => assertSceneFeatures({ globalLight: { enabled: true, darkness: { max: 0.6 } } }, V11)).not.toThrow();
  });

  it.each([{ style: 'roundPoints' as const }, { thickness: 2 }])('refuses grid appearance %p before Foundry 12', (grid) => {
    expect(() => assertSceneFeatures({ grid }, V11)).toThrow('Grid style and thickness require Foundry 12 or newer');
  });

  it('keeps grid color and alpha on Foundry 11', () => {
    expect(() => assertSceneFeatures({ grid: { color: '#000000', alpha: 0.4 } }, V11)).not.toThrow();
  });

  it.each(['l1', null])('refuses an initial level (%p) before Foundry 14', (initialLevelId) => {
    expect(() => assertSceneFeatures({ initialLevelId }, V13)).toThrow('Scene levels require Foundry 14 or newer');
  });
});

describe('assertKnownWeather', () => {
  const known = [
    { id: 'rain', label: 'Rain' },
    { id: 'snow', label: 'Snow' }
  ];

  it('accepts a registered effect, no weather and no change', () => {
    expect(() => assertKnownWeather('rain', known)).not.toThrow();
    expect(() => assertKnownWeather(null, known)).not.toThrow();
    expect(() => assertKnownWeather(undefined, known)).not.toThrow();
  });

  it('refuses an effect the world does not register', () => {
    expect(() => assertKnownWeather('hail', known)).toThrow(new WeatherEffectNotFoundError('hail'));
    expect(() => assertKnownWeather('hail', known)).toThrow('Weather effect not found: hail');
  });

  it('trusts the caller when the registry cannot be read', () => {
    expect(() => assertKnownWeather('hail', null)).not.toThrow();
  });
});

describe('resolveGlobalLightDarkness', () => {
  it('fills the side that does not change from the current range', () => {
    expect(resolveGlobalLightDarkness({ min: 0.2, max: 0.8 }, { max: 0.5 })).toEqual({ min: 0.2, max: 0.5 });
  });

  it('refuses a range that ends up inverted', () => {
    expect(() => resolveGlobalLightDarkness({ min: 0.2, max: 0.8 }, { min: 0.9 })).toThrow(GlobalLightDarknessRangeError);
    expect(() => resolveGlobalLightDarkness({ min: 0.2, max: 0.8 }, { min: 0.9 })).toThrow(
      'Global light darkness min (0.9) may not exceed max (0.8)'
    );
  });
});

describe('resolveLink', () => {
  const playlists: Record<string, LinkedCollection> = {
    battle: { id: 'battle', childIds: ['drums', 'horns'] },
    tavern: { id: 'tavern', childIds: ['lute'] }
  };
  const find = jest.fn((id: string) => playlists[id] ?? null);
  const errors: LinkErrors = {
    parentNotFound: (id) => new Error(`parent ${id}`),
    childNotFound: (id) => new Error(`child ${id}`),
    childWithoutParent: () => new Error('orphan child')
  };
  const none = { parentId: null, childId: null };

  beforeEach(() => {
    find.mockClear();
  });

  it('looks nothing up when neither link changes', () => {
    const request = { parentId: undefined, childId: undefined };

    expect(resolveLink(request, { parentId: 'battle', childId: 'drums' }, find, errors)).toBe(request);
    expect(find).not.toHaveBeenCalled();
  });

  it('accepts a parent that exists and a child of it', () => {
    expect(resolveLink({ parentId: 'battle', childId: 'horns' }, none, find, errors)).toEqual({
      parentId: 'battle',
      childId: 'horns'
    });
  });

  it('refuses a parent that does not exist', () => {
    expect(() => resolveLink({ parentId: 'gone', childId: undefined }, none, find, errors)).toThrow('parent gone');
  });

  it('refuses a child of another parent', () => {
    expect(() => resolveLink({ parentId: 'tavern', childId: 'drums' }, none, find, errors)).toThrow('child drums');
  });

  it('checks a child alone against the parent the scene already has', () => {
    expect(resolveLink({ parentId: undefined, childId: 'horns' }, { parentId: 'battle', childId: null }, find, errors)).toEqual({
      parentId: undefined,
      childId: 'horns'
    });
    expect(() => resolveLink({ parentId: undefined, childId: 'lute' }, { parentId: 'battle', childId: null }, find, errors)).toThrow(
      'child lute'
    );
  });

  it('refuses a child when the scene ends up without a parent', () => {
    expect(() => resolveLink({ parentId: undefined, childId: 'drums' }, none, find, errors)).toThrow('orphan child');
    expect(() => resolveLink({ parentId: null, childId: 'drums' }, { parentId: 'battle', childId: null }, find, errors)).toThrow(
      'orphan child'
    );
  });

  it('drops the current child when the parent changes to one without it', () => {
    expect(resolveLink({ parentId: 'tavern', childId: undefined }, { parentId: 'battle', childId: 'drums' }, find, errors)).toEqual({
      parentId: 'tavern',
      childId: null
    });
  });

  it('drops the current child when the parent is unlinked', () => {
    expect(resolveLink({ parentId: null, childId: undefined }, { parentId: 'battle', childId: 'drums' }, find, errors)).toEqual({
      parentId: null,
      childId: null
    });
  });

  it('keeps the current child when the new parent has it too', () => {
    const shared = { parentId: 'battle', childId: undefined };

    expect(resolveLink(shared, { parentId: 'battle', childId: 'drums' }, find, errors)).toBe(shared);
  });

  it('lets a child be unlinked on its own', () => {
    const request = { parentId: undefined, childId: null };

    expect(resolveLink(request, { parentId: 'battle', childId: 'drums' }, find, errors)).toBe(request);
  });
});
