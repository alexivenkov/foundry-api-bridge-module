import { CoreFeatureUnavailableError } from '../../../shared';
import {
  UnknownDoorAnimationError,
  UnknownDoorSoundError,
  WallProximityConflictError,
  WallThresholdDistanceRequiredError,
  assertKnownDoorAnimation,
  assertKnownDoorSound,
  assertWallFeatures,
  resolveThresholdChanges,
  type Wall
} from '..';

function wall(overrides: Partial<Wall> = {}): Wall {
  return {
    id: 'w1',
    segment: [0, 0, 100, 0],
    door: 'door',
    doorState: 'closed',
    movement: 'normal',
    sight: 'normal',
    sound: 'normal',
    light: 'normal',
    direction: 'both',
    threshold: {
      light: { proximity: null, distance: null },
      sight: { proximity: 'proximity', distance: 15 },
      sound: { proximity: null, distance: null },
      attenuation: false
    },
    ...overrides
  };
}

describe('wall rules', () => {
  describe('resolveThresholdChanges', () => {
    it('passes changes without a threshold through untouched', () => {
      const changes = { sight: 'limited' as const };
      expect(resolveThresholdChanges(wall(), changes)).toBe(changes);
    });

    it('accepts a new proximity sense that brings its distance', () => {
      const changes = { threshold: { sound: { proximity: 'reverse-proximity' as const, distance: 30 } } };
      expect(resolveThresholdChanges(null, changes)).toEqual(changes);
    });

    it('refuses a proximity sense without any distance', () => {
      expect(() => resolveThresholdChanges(null, { threshold: { light: { proximity: 'proximity' } } })).toThrow(
        WallThresholdDistanceRequiredError
      );
    });

    it('refuses clearing the distance of a sense that stays a proximity sense', () => {
      expect(() => resolveThresholdChanges(wall(), { threshold: { sight: { distance: null } } })).toThrow(
        'A sight proximity needs threshold.sight.distance'
      );
    });

    it('lets a plain restriction end a proximity sense even without a distance', () => {
      const changes = { sight: 'limited' as const, threshold: { sight: { distance: null } } };
      expect(resolveThresholdChanges(wall(), changes)).toEqual(changes);
    });

    it('refuses a proximity setting together with the plain field of that sense', () => {
      expect(() =>
        resolveThresholdChanges(wall(), { sight: 'none', threshold: { sight: { proximity: 'proximity' } } })
      ).toThrow(new WallProximityConflictError('sight', 'sense'));
    });

    it('turns a proximity sense back into a normal one when its proximity is cleared', () => {
      expect(resolveThresholdChanges(wall(), { threshold: { sight: { proximity: null } } })).toMatchObject({
        sight: 'normal'
      });
    });

    it('leaves a sense that was no proximity sense alone when proximity null is sent', () => {
      expect(resolveThresholdChanges(wall(), { threshold: { light: { proximity: null } } })).not.toHaveProperty(
        'light'
      );
    });

    it('reads a wall without threshold data as having none', () => {
      expect(() =>
        resolveThresholdChanges(wall({ threshold: undefined }), { threshold: { sight: { distance: 5 } } })
      ).not.toThrow();
    });
  });

  describe('registries and features', () => {
    const sounds = [
      { id: 'jail', label: 'Jail' },
      { id: 'metal', label: 'Metal' }
    ];

    it('accepts a registered door sound, a cleared one, or any when the registry is unknown', () => {
      expect(() => assertKnownDoorSound('jail', sounds)).not.toThrow();
      expect(() => assertKnownDoorSound(null, sounds)).not.toThrow();
      expect(() => assertKnownDoorSound('anything', null)).not.toThrow();
    });

    it('refuses an unknown door sound and lists the known ones', () => {
      expect(() => assertKnownDoorSound('kazoo', sounds)).toThrow(new UnknownDoorSoundError('kazoo', ['jail', 'metal']));
    });

    it('refuses an unknown door animation type', () => {
      expect(() => assertKnownDoorAnimation('spin', ['swing', 'slide'])).toThrow(UnknownDoorAnimationError);
      expect(() => assertKnownDoorAnimation('slide', ['swing', 'slide'])).not.toThrow();
    });

    it('refuses a door animation on a core without one', () => {
      expect(() => assertWallFeatures({ animation: null }, { doorAnimation: false })).toThrow(
        new CoreFeatureUnavailableError('Door animations require Foundry 13 or newer')
      );
      expect(() => assertWallFeatures({ doorSound: 'jail' }, { doorAnimation: false })).not.toThrow();
    });
  });
});
