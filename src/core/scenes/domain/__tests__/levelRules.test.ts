import { CoreFeatureUnavailableError } from '../../../shared/domain';
import {
  LevelElevationRangeError,
  LevelNotFoundError,
  LevelSeesItselfError
} from '../errors/sceneLevelErrors';
import type { SceneLevel, SceneLevels } from '../model/SceneLevel';
import {
  assertLevelsAvailable,
  assertVisibleLevels,
  newLevelElevation,
  requireLevel,
  resolveElevation
} from '../rules/levelRules';

function level(id: string): SceneLevel {
  return {
    id,
    name: id,
    elevation: { bottom: 0, top: 20 },
    background: { src: null, color: '#999999', tint: '#ffffff', alphaThreshold: 0.75 },
    foreground: { src: null, tint: '#ffffff', alphaThreshold: 0.75 },
    fogOverlaySrc: null,
    positioning: { anchorX: 0.5, anchorY: 0.5, offsetX: 0, offsetY: 0, fit: 'fill', scaleX: 1, scaleY: 1, rotation: 0 },
    visibleLevelIds: [],
    sort: 0
  };
}

const levels: SceneLevels = {
  sceneId: 'keep',
  levels: [level('ground'), level('tower')],
  initialLevelId: 'ground',
  firstLevelId: 'ground',
  defaultTop: 25
};

describe('level rules', () => {
  it('refuses levels where the core has none', () => {
    expect(() => assertLevelsAvailable(false)).toThrow(CoreFeatureUnavailableError);
    expect(() => assertLevelsAvailable(false)).toThrow('Scene levels require Foundry 14 or newer');
    expect(() => assertLevelsAvailable(true)).not.toThrow();
  });

  it('finds a level of the scene or names the missing one', () => {
    expect(requireLevel(levels, 'tower').id).toBe('tower');
    expect(() => requireLevel(levels, 'cellar')).toThrow(new LevelNotFoundError('cellar'));
    expect(() => requireLevel(levels, 'cellar')).toThrow('Level not found: cellar');
  });

  describe('resolveElevation', () => {
    it('keeps the side that does not change', () => {
      expect(resolveElevation({ bottom: 0, top: 20 }, { top: 15 })).toEqual({ bottom: 0, top: 15 });
      expect(resolveElevation({ bottom: 0, top: 20 }, undefined)).toEqual({ bottom: 0, top: 20 });
    });

    it('takes null as unbounded on either side', () => {
      expect(resolveElevation({ bottom: 0, top: 20 }, { bottom: null, top: null })).toEqual({ bottom: null, top: null });
      expect(resolveElevation({ bottom: 50, top: null }, { bottom: 80 })).toEqual({ bottom: 80, top: null });
    });

    it('refuses a top below the bottom, against the current range as well', () => {
      expect(() => resolveElevation({ bottom: 0, top: 20 }, { bottom: 30 })).toThrow(LevelElevationRangeError);
      expect(() => resolveElevation({ bottom: 0, top: 20 }, { top: -5 })).toThrow(
        'Level elevation top (-5) may not be below its bottom (0)'
      );
    });

    it('allows an empty range', () => {
      expect(resolveElevation({ bottom: 0, top: 20 }, { top: 0 })).toEqual({ bottom: 0, top: 0 });
    });
  });

  it('starts a new level at 0 and the scene default top', () => {
    expect(newLevelElevation(levels)).toEqual({ bottom: 0, top: 25 });
  });

  describe('assertVisibleLevels', () => {
    it('accepts other levels of the scene, and no list at all', () => {
      expect(() => assertVisibleLevels(levels, ['tower'], 'ground')).not.toThrow();
      expect(() => assertVisibleLevels(levels, undefined, 'ground')).not.toThrow();
      expect(() => assertVisibleLevels(levels, [], null)).not.toThrow();
    });

    it('refuses a level of no scene and the level itself', () => {
      expect(() => assertVisibleLevels(levels, ['attic'], 'ground')).toThrow('Level not found: attic');
      expect(() => assertVisibleLevels(levels, ['ground'], 'ground')).toThrow(LevelSeesItselfError);
    });
  });
});
