import { FoundryWallEnvironment, wallFeaturesFor } from '../FoundryWallEnvironment';
import type { FoundryWallDocument } from '../foundryWallTypes';
import { toFoundryWallData, toWall } from '../wallMapper';

// Shapes and payloads as the BaseWall model of Foundry 13.351 / 14.368 stores
// and accepts them (checked by pushing them through the real data model).

function document(overrides: Partial<FoundryWallDocument> = {}): FoundryWallDocument {
  return {
    _id: 'w1',
    c: [0, 0, 100, 0],
    door: 1,
    ds: 0,
    move: 20,
    sight: 30,
    sound: 40,
    light: 20,
    dir: 0,
    threshold: { light: null, sight: 15, sound: 30, attenuation: true },
    doorSound: 'jail',
    animation: { type: 'slide', direction: -1, double: false, duration: 900, flip: false, strength: 1.5, texture: null },
    update: jest.fn(),
    ...overrides
  };
}

describe('wall details mapping', () => {
  it('reads proximity senses, door sound and animation, keeping the plain fields as before', () => {
    expect(toWall(document())).toMatchObject({
      sight: 'normal',
      sound: 'normal',
      threshold: {
        light: { proximity: null, distance: null },
        sight: { proximity: 'proximity', distance: 15 },
        sound: { proximity: 'reverse-proximity', distance: 30 },
        attenuation: true
      },
      doorSound: 'jail',
      animation: { type: 'slide', reverse: true, double: false, duration: 900, flip: false, strength: 1.5, texture: null }
    });
  });

  it('reads an unset or blank door sound as none and a missing animation as not configured', () => {
    expect(toWall(document({ doorSound: undefined, animation: null }))).toMatchObject({ doorSound: null, animation: null });
    expect(toWall(document({ doorSound: '' })).doorSound).toBeNull();
  });

  it('leaves the details out for a document that does not store them', () => {
    const wall = toWall(document({ threshold: undefined, doorSound: undefined, animation: undefined }));
    expect(wall).not.toHaveProperty('threshold');
    expect(wall).not.toHaveProperty('doorSound');
    expect(wall).not.toHaveProperty('animation');
  });

  it('writes a proximity sense as its sense code plus the threshold distance', () => {
    expect(
      toFoundryWallData({
        threshold: { sight: { proximity: 'proximity', distance: 15 }, sound: { proximity: 'reverse-proximity', distance: 30 }, attenuation: true }
      })
    ).toEqual({ sight: 30, sound: 40, threshold: { sight: 15, sound: 30, attenuation: true } });
  });

  it('writes a cleared door sound as an empty string, as the core form does', () => {
    expect(toFoundryWallData({ doorSound: null })).toEqual({ doorSound: '' });
  });

  it('writes the full default animation under the changes for a door without one', () => {
    expect(toFoundryWallData({ animation: { type: 'ascend', reverse: true } }, document({ animation: null }))).toEqual({
      animation: { type: 'ascend', direction: -1, double: false, duration: 750, flip: false, strength: 1, texture: null }
    });
  });

  it('writes only the changed animation fields for a door that has one, and null to remove it', () => {
    expect(toFoundryWallData({ animation: { strength: 0.5 } }, document())).toEqual({ animation: { strength: 0.5 } });
    expect(toFoundryWallData({ animation: null }, document())).toEqual({ animation: null });
  });
});

describe('FoundryWallEnvironment', () => {
  it('reads the door sounds with localized labels and the animation types', () => {
    const environment = new FoundryWallEnvironment(
      () => ({
        CONFIG: {
          Wall: {
            doorSounds: { jail: { label: 'WALL.DoorSounds.Jail' }, odd: undefined },
            animationTypes: { swing: {}, slide: {} }
          }
        },
        game: { i18n: { localize: (key: string) => (key === 'WALL.DoorSounds.Jail' ? 'Jail' : key) } }
      }),
      () => 13
    );

    expect(environment.doorSounds()).toEqual([
      { id: 'jail', label: 'Jail' },
      { id: 'odd', label: 'odd' }
    ]);
    expect(environment.doorAnimationTypes()).toEqual(['swing', 'slide']);
  });

  it('answers null when the registries cannot be read', () => {
    const environment = new FoundryWallEnvironment(() => ({}), () => 13);
    expect(environment.doorSounds()).toBeNull();
    expect(environment.doorAnimationTypes()).toBeNull();
  });

  it('knows door animations from Foundry 13 on, and for an unknown generation', () => {
    expect(wallFeaturesFor(12).doorAnimation).toBe(false);
    expect(wallFeaturesFor(13).doorAnimation).toBe(true);
    expect(wallFeaturesFor(14).doorAnimation).toBe(true);
    expect(wallFeaturesFor(0).doorAnimation).toBe(true);
  });
});
