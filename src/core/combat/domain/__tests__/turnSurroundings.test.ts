import {
  TURN_MAP_RADIUS,
  cellOf,
  centreOf,
  footprintDistance,
  footprintOf,
  participantTokens,
  surveyNearbyTokens,
  type BattlefieldGrid,
  type BattlefieldToken,
  type Footprint,
  type Point,
  type SightTest
} from '..';
import { battlefieldToken } from './fixtures';

const GRID: BattlefieldGrid = { size: 100, distance: 5, units: 'ft' };

function survey(options: {
  current?: BattlefieldToken;
  tokens: BattlefieldToken[];
  participants?: string[];
  grid?: BattlefieldGrid;
  sightTest?: SightTest;
}): ReturnType<typeof surveyNearbyTokens> {
  const current = options.current ?? battlefieldToken({ id: 'hero', x: 0, y: 0 });
  return surveyNearbyTokens({
    current,
    tokens: [current, ...options.tokens],
    participantTokenIds: new Set(options.participants ?? ['hero', ...options.tokens.map((token) => token.id)]),
    grid: options.grid ?? GRID,
    sightTest: options.sightTest
  });
}

function block(column: number, row: number, columns = 1, rows = 1): Footprint {
  return { column, row, columns, rows };
}

describe('grid geometry', () => {
  it('places a token in the cell its top-left corner is in', () => {
    expect(cellOf({ x: 500, y: 300 }, 100)).toEqual({ column: 5, row: 3 });
    expect(cellOf({ x: 599, y: 301 }, 100)).toEqual({ column: 5, row: 3 });
    expect(cellOf({ x: 140, y: 70 }, 70)).toEqual({ column: 2, row: 1 });
  });

  it('counts cells to the left of and above the origin as negative', () => {
    expect(cellOf({ x: -1, y: -150 }, 100)).toEqual({ column: -1, row: -2 });
  });

  it('draws the map of a turn twelve cells around the current combatant', () => {
    expect(TURN_MAP_RADIUS).toBe(12);
  });
});

describe('footprintOf', () => {
  it('gives a 1x1 token the one cell its top-left corner is in, snapped to the grid or not', () => {
    expect(footprintOf({ x: 500, y: 300, width: 1, height: 1 }, 100)).toEqual(block(5, 3));
    expect(footprintOf({ x: 560, y: 349, width: 1, height: 1 }, 100)).toEqual(block(5, 3));
  });

  it('extends a larger token to the right and down from that cell', () => {
    expect(footprintOf({ x: 200, y: 100, width: 2, height: 2 }, 100)).toEqual(block(2, 1, 2, 2));
    expect(footprintOf({ x: 0, y: 0, width: 4, height: 3 }, 50)).toEqual(block(0, 0, 4, 3));
  });

  it.each([
    [0.5, 1],
    [0.2, 1],
    [1, 1],
    [1.2, 1],
    [1.5, 2],
    [2, 2],
    [2.4, 3]
  ])('counts a size of %s as %i cells, rounding to half cells first as the core does', (size, cells) => {
    expect(footprintOf({ x: 0, y: 0, width: size, height: 1 }, 100).columns).toBe(cells);
    expect(footprintOf({ x: 0, y: 0, width: 1, height: size }, 100).rows).toBe(cells);
  });
});

describe('footprintDistance', () => {
  it.each([
    [block(0, 0), block(6, 4), 6],
    [block(0, 0), block(3, 3), 3],
    [block(2, 7), block(2, 1), 6],
    [block(-2, 0), block(3, -1), 5],
    [block(4, 4), block(5, 5), 1],
    [block(4, 4), block(4, 4), 0]
  ])('between the single cells %j and %j is their Chebyshev distance, %i', (from, to, cells) => {
    expect(footprintDistance(from, to)).toBe(cells);
    expect(footprintDistance(to, from)).toBe(cells);
  });

  it.each([
    ['a 2x2 block and the cell right of it', block(2, 2, 2, 2), block(4, 2), 1],
    ['a 2x2 block and the cell below its far corner', block(2, 2, 2, 2), block(3, 4), 1],
    ['a 2x2 block and a cell diagonally off its far corner', block(2, 2, 2, 2), block(4, 4), 1],
    ['a 2x2 block and a cell three to its left', block(2, 2, 2, 2), block(-1, 3), 3],
    ['a 3x3 block and a cell two below it', block(0, 0, 3, 3), block(1, 4), 2],
    ['two 2x2 blocks with one column between them', block(0, 0, 2, 2), block(3, 0, 2, 2), 2],
    ['two 2x2 blocks side by side', block(0, 0, 2, 2), block(2, 1, 2, 2), 1],
    ['a wide block and a tall one far apart on both axes', block(0, 0, 4, 1), block(6, 5, 1, 4), 5]
  ])('between %s is the gap between their nearest cells', (_case, from, to, cells) => {
    expect(footprintDistance(from, to)).toBe(cells);
    expect(footprintDistance(to, from)).toBe(cells);
  });

  it.each([
    ['a cell inside a larger block', block(2, 2, 3, 3), block(3, 3)],
    ['overlapping blocks', block(0, 0, 2, 2), block(1, 1, 2, 2)],
    ['a block and itself', block(5, 5, 2, 2), block(5, 5, 2, 2)]
  ])('is 0 for %s', (_case, from, to) => {
    expect(footprintDistance(from, to)).toBe(0);
    expect(footprintDistance(to, from)).toBe(0);
  });
});

describe('centreOf', () => {
  it('is the middle of the cell for a 1x1 token', () => {
    expect(centreOf({ x: 100, y: 100, width: 1, height: 1 }, 100)).toEqual({ x: 150, y: 150 });
    expect(centreOf({ x: 0, y: 0, width: 1, height: 1 }, 70)).toEqual({ x: 35, y: 35 });
  });

  it('is the middle of the whole token for a larger one', () => {
    expect(centreOf({ x: 300, y: 100, width: 3, height: 3 }, 100)).toEqual({ x: 450, y: 250 });
    expect(centreOf({ x: 0, y: 0, width: 2, height: 1 }, 100)).toEqual({ x: 100, y: 50 });
  });

  it('is the middle of the token for one smaller than a cell', () => {
    expect(centreOf({ x: 200, y: 200, width: 0.5, height: 0.5 }, 100)).toEqual({ x: 225, y: 225 });
  });
});

describe('participantTokens', () => {
  it('keeps the tokens that take part, in scene order', () => {
    const tokens = [
      battlefieldToken({ id: 'barrel' }),
      battlefieldToken({ id: 'goblin' }),
      battlefieldToken({ id: 'hero' })
    ];

    expect(participantTokens(tokens, new Set(['hero', 'goblin'])).map((token) => token.id)).toEqual([
      'goblin',
      'hero'
    ]);
  });

  it('ignores participants that have no token on the scene', () => {
    expect(participantTokens([battlefieldToken({ id: 'hero' })], new Set(['elsewhere']))).toEqual([]);
  });
});

describe('surveyNearbyTokens', () => {
  it('describes another participant by its cell and its distance in grid units', () => {
    const goblin = battlefieldToken({ id: 'goblin', x: 600, y: 400 });

    expect(survey({ tokens: [goblin] })).toEqual([
      { token: goblin, cell: { column: 6, row: 4 }, distance: 30, lineOfSight: true }
    ]);
  });

  it('measures in the units of the scene grid', () => {
    const goblin = battlefieldToken({ id: 'goblin', x: 140, y: 0 });

    const [nearby] = survey({ tokens: [goblin], grid: { size: 70, distance: 1.5, units: 'm' } });

    expect(nearby?.distance).toBe(3);
  });

  it('measures to the nearest cell of a large token, and reports its top-left cell', () => {
    const ogre = battlefieldToken({ id: 'ogre', x: 100, y: 300, width: 2, height: 2 });
    const hero = battlefieldToken({ id: 'hero', x: 400, y: 400 });

    expect(survey({ current: hero, tokens: [ogre] })).toEqual([
      { token: ogre, cell: { column: 1, row: 3 }, distance: 10, lineOfSight: true }
    ]);
  });

  it('measures from the nearest cell of a large current combatant', () => {
    const dragon = battlefieldToken({ id: 'hero', x: 0, y: 0, width: 3, height: 3 });
    const beside = battlefieldToken({ id: 'beside', x: 300, y: 200 });
    const farther = battlefieldToken({ id: 'farther', x: 500, y: 0 });

    const nearby = survey({ current: dragon, tokens: [beside, farther] });

    expect(nearby.map((entry) => [entry.token.id, entry.distance])).toEqual([
      ['beside', 5],
      ['farther', 15]
    ]);
  });

  it('puts a token standing inside the footprint of a large one at distance 0', () => {
    const dragon = battlefieldToken({ id: 'hero', x: 0, y: 0, width: 3, height: 3 });
    const rider = battlefieldToken({ id: 'rider', x: 100, y: 100 });

    expect(survey({ current: dragon, tokens: [rider] })[0]?.distance).toBe(0);
  });

  it('leaves out the current combatant', () => {
    const hero = battlefieldToken({ id: 'hero', x: 0, y: 0 });

    expect(survey({ current: hero, tokens: [] })).toEqual([]);
  });

  it('leaves out tokens that do not take part in the encounter', () => {
    const goblin = battlefieldToken({ id: 'goblin', x: 100, y: 0 });
    const barrel = battlefieldToken({ id: 'barrel', x: 200, y: 0 });

    const nearby = survey({ tokens: [goblin, barrel], participants: ['hero', 'goblin'] });

    expect(nearby.map((entry) => entry.token.id)).toEqual(['goblin']);
  });

  it('lists the nearest first', () => {
    const far = battlefieldToken({ id: 'far', x: 1000, y: 0 });
    const near = battlefieldToken({ id: 'near', x: 100, y: 0 });
    const middle = battlefieldToken({ id: 'middle', x: 0, y: 400 });

    expect(survey({ tokens: [far, near, middle] }).map((entry) => entry.token.id)).toEqual(['near', 'middle', 'far']);
  });

  it('keeps scene order among tokens at the same distance', () => {
    const east = battlefieldToken({ id: 'east', x: 200, y: 0 });
    const south = battlefieldToken({ id: 'south', x: 0, y: 200 });
    const diagonal = battlefieldToken({ id: 'diagonal', x: 200, y: 200 });

    expect(survey({ tokens: [east, south, diagonal] }).map((entry) => entry.token.id)).toEqual([
      'east',
      'south',
      'diagonal'
    ]);
  });

  it('counts every token as visible when nothing can test sight', () => {
    const goblin = battlefieldToken({ id: 'goblin', x: 300, y: 100 });

    expect(survey({ tokens: [goblin] })[0]?.lineOfSight).toBe(true);
  });

  it('asks whether sight is blocked between the centres of the two tokens', () => {
    const asked: Array<[Point, Point]> = [];
    const sightTest: SightTest = (from, to) => {
      asked.push([from, to]);
      return to.x === 350;
    };
    const hero = battlefieldToken({ id: 'hero', x: 100, y: 100 });
    const hiddenGoblin = battlefieldToken({ id: 'behind-wall', x: 300, y: 100 });
    const seenGoblin = battlefieldToken({ id: 'in-the-open', x: 100, y: 300 });

    const nearby = survey({ current: hero, tokens: [hiddenGoblin, seenGoblin], sightTest });

    expect(asked).toEqual([
      [{ x: 150, y: 150 }, { x: 350, y: 150 }],
      [{ x: 150, y: 150 }, { x: 150, y: 350 }]
    ]);
    expect(nearby.map((entry) => [entry.token.id, entry.lineOfSight])).toEqual([
      ['behind-wall', false],
      ['in-the-open', true]
    ]);
  });

  it('looks from the middle of a large combatant to the middle of a large token', () => {
    const sightTest = jest.fn().mockReturnValue(false);
    const dragon = battlefieldToken({ id: 'hero', x: 0, y: 0, width: 3, height: 3 });
    const ogre = battlefieldToken({ id: 'ogre', x: 600, y: 100, width: 2, height: 2 });

    survey({ current: dragon, tokens: [ogre], sightTest });

    expect(sightTest).toHaveBeenCalledWith({ x: 150, y: 150 }, { x: 700, y: 200 });
  });

  it('does not test sight for tokens it leaves out', () => {
    const sightTest = jest.fn().mockReturnValue(false);
    const barrel = battlefieldToken({ id: 'barrel', x: 200, y: 0 });

    survey({ tokens: [barrel], participants: ['hero'], sightTest });

    expect(sightTest).not.toHaveBeenCalled();
  });
});
