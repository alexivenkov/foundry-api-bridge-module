import { ValidationError } from '../../../../kernel';
import { isDoor, parseWallMovement, type Wall } from '..';

const wall = (overrides: Partial<Wall> = {}): Wall => ({
  id: 'w1',
  segment: [0, 0, 100, 0],
  door: 'none',
  doorState: 'closed',
  movement: 'normal',
  sight: 'normal',
  sound: 'normal',
  light: 'normal',
  direction: 'both',
  ...overrides
});

describe('parseWallMovement', () => {
  it.each(['none', 'normal'] as const)('accepts %s', (restriction) => {
    expect(parseWallMovement(restriction)).toBe(restriction);
  });

  it('rejects limited, which the core does not have for movement', () => {
    const act = (): unknown => parseWallMovement('limited');

    expect(act).toThrow(ValidationError);
    expect(act).toThrow("Wall move must be 'none' or 'normal'");
  });
});

describe('isDoor', () => {
  it.each([
    ['none', false],
    ['door', true],
    ['secret', true]
  ] as const)('a wall of door type %s → %s', (door, expected) => {
    expect(isDoor(wall({ door }))).toBe(expected);
  });
});
