import { ValidationError } from '../../../../kernel';
import {
  createWallRequestSchema,
  deleteWallRequestSchema,
  doorStateFromWireCode,
  doorStateToWireCode,
  doorTypeToWireCode,
  getWallsRequestSchema,
  setDoorStateRequestSchema,
  toCreateWallCommand,
  toDeleteWallCommand,
  toListWallsQuery,
  toSetDoorStateCommand,
  toUpdateWallCommand,
  updateWallRequestSchema
} from '..';

describe('wall request schemas', () => {
  it('accepts a wall with only its coordinates', () => {
    expect(createWallRequestSchema.safeParse({ c: [0, 0, 10, 10] }).success).toBe(true);
  });

  it.each([
    ['three coordinates', { c: [0, 0, 10] }],
    ['a non-numeric coordinate', { c: [0, 0, 10, 'x'] }],
    ['no coordinates', {}]
  ])('rejects a new wall with %s', (_case, request) => {
    expect(createWallRequestSchema.safeParse(request).success).toBe(false);
  });

  it('ignores an attribute value outside its enum instead of rejecting the request', () => {
    const request = { c: [0, 0, 1, 1], door: 'portcullis', doorState: '', sense: 'proximity', dir: 'up', light: 'limited' };

    expect(createWallRequestSchema.parse(request)).toEqual({ c: [0, 0, 1, 1], light: 'limited' });
    expect(updateWallRequestSchema.parse({ wallId: 'w1', move: '' })).toEqual({ wallId: 'w1' });
  });

  it('ignores unknown keys', () => {
    expect(createWallRequestSchema.parse({ c: [0, 0, 1, 1], color: 'red' })).toEqual({ c: [0, 0, 1, 1] });
  });

  it('requires the wall id for update, delete and set-door-state', () => {
    expect(updateWallRequestSchema.safeParse({ door: 'door' }).success).toBe(false);
    expect(deleteWallRequestSchema.safeParse({}).success).toBe(false);
    expect(setDoorStateRequestSchema.safeParse({ state: 1 }).success).toBe(false);
  });

  it('accepts an update that changes nothing', () => {
    expect(updateWallRequestSchema.safeParse({ wallId: 'w1' }).success).toBe(true);
  });

  it('leaves the scene optional everywhere', () => {
    expect(getWallsRequestSchema.safeParse({}).success).toBe(true);
    expect(getWallsRequestSchema.safeParse({ sceneId: 5 }).success).toBe(false);
  });
});

describe('wall request mappers', () => {
  it('maps the wire names to the domain vocabulary', () => {
    const command = toCreateWallCommand({
      sceneId: 's1',
      c: [1, 2, 3, 4],
      door: 'secret',
      doorState: 'locked',
      move: 'none',
      sense: 'limited',
      sound: 'limited',
      light: 'normal',
      dir: 'left'
    });

    expect(command).toEqual({
      sceneId: 's1',
      draft: {
        segment: [1, 2, 3, 4],
        door: 'secret',
        doorState: 'locked',
        movement: 'none',
        sight: 'limited',
        sound: 'limited',
        light: 'normal',
        direction: 'left'
      }
    });
  });

  it('rejects limited movement on create and on update', () => {
    expect(() => toCreateWallCommand({ c: [0, 0, 1, 1], move: 'limited' })).toThrow(ValidationError);
    expect(() => toUpdateWallCommand({ wallId: 'w1', move: 'limited' }))
      .toThrow("Wall move must be 'none' or 'normal'");
  });

  it('keeps an update partial', () => {
    const command = toUpdateWallCommand({ wallId: 'w1', doorState: 'open' });

    expect(command.wallId).toBe('w1');
    expect(command.sceneId).toBeUndefined();
    expect(command.changes.doorState).toBe('open');
    expect(command.changes.segment).toBeUndefined();
    expect(command.changes.movement).toBeUndefined();
  });

  it('maps list and delete requests', () => {
    expect(toListWallsQuery({ sceneId: 's1' })).toEqual({ sceneId: 's1' });
    expect(toDeleteWallCommand({ wallId: 'w1' })).toEqual({ sceneId: undefined, wallId: 'w1' });
  });

  it('turns the numeric door state of set-door-state into the domain state', () => {
    expect(toSetDoorStateCommand({ wallId: 'w1', state: 2 })).toEqual({
      sceneId: undefined,
      wallId: 'w1',
      state: 'locked'
    });
  });

  it('treats an empty or null sceneId of set-door-state as the active scene', () => {
    expect(toSetDoorStateCommand({ sceneId: '', wallId: 'w1', state: 0 }).sceneId).toBeUndefined();
    expect(toSetDoorStateCommand({ sceneId: null, wallId: 'w1', state: 0 }).sceneId).toBeUndefined();
    expect(toSetDoorStateCommand({ sceneId: 's1', wallId: 'w1', state: 0 }).sceneId).toBe('s1');
  });
});

describe('door wire codes', () => {
  it.each([
    [0, 'closed'],
    [1, 'open'],
    [2, 'locked']
  ] as const)('code %i is %s, both ways', (code, state) => {
    expect(doorStateFromWireCode(code)).toBe(state);
    expect(doorStateToWireCode(state)).toBe(code);
  });

  it.each([3, -1, 1.5])('rejects the state code %d', (code) => {
    expect(() => doorStateFromWireCode(code)).toThrow(
      `Invalid door state: ${String(code)}. Must be 0 (closed), 1 (open), or 2 (locked)`
    );
  });

  it('reports the door type as its wire code', () => {
    expect([doorTypeToWireCode('none'), doorTypeToWireCode('door'), doorTypeToWireCode('secret')]).toEqual([0, 1, 2]);
  });
});
