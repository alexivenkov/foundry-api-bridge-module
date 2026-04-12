import {
  createDoorAwareCollision,
  findDoorsAlongPath,
  segmentsIntersect,
  type WallInfo
} from '../DoorAwareCollision';
import type { CollisionChecker } from '../GridPathfinder';

const GRID = 100;

function makeWall(id: string, c: number[], overrides: Partial<WallInfo> = {}): WallInfo {
  return { id, c, door: 0, ds: 0, move: 20, ...overrides };
}

function makeDoor(id: string, c: number[], ds = 0): WallInfo {
  return { id, c, door: 1, ds, move: 20 };
}

function alwaysBlocked(): CollisionChecker {
  return { testCollision: jest.fn().mockReturnValue(true) };
}

function neverBlocked(): CollisionChecker {
  return { testCollision: jest.fn().mockReturnValue(false) };
}

describe('segmentsIntersect', () => {
  it('detects crossing segments', () => {
    expect(segmentsIntersect(
      { x: 0, y: 0 }, { x: 100, y: 100 },
      { x: 100, y: 0 }, { x: 0, y: 100 }
    )).toBe(true);
  });

  it('returns false for parallel segments', () => {
    expect(segmentsIntersect(
      { x: 0, y: 0 }, { x: 100, y: 0 },
      { x: 0, y: 10 }, { x: 100, y: 10 }
    )).toBe(false);
  });

  it('returns false for endpoint-touching segments', () => {
    expect(segmentsIntersect(
      { x: 0, y: 0 }, { x: 50, y: 50 },
      { x: 50, y: 50 }, { x: 100, y: 0 }
    )).toBe(false);
  });

  it('returns false for non-intersecting segments', () => {
    expect(segmentsIntersect(
      { x: 0, y: 0 }, { x: 10, y: 0 },
      { x: 20, y: 0 }, { x: 30, y: 0 }
    )).toBe(false);
  });
});

describe('createDoorAwareCollision', () => {
  it('passes through when real collision says clear', () => {
    const real = neverBlocked();
    const walls = [makeWall('w1', [200, 0, 200, 100])];
    const { collision } = createDoorAwareCollision(real, walls);

    const result = collision.testCollision(
      { x: 50, y: 50 }, { x: 150, y: 50 }, { type: 'move', mode: 'any' }
    );

    expect(result).toBe(false);
  });

  it('stays blocked by real wall', () => {
    const real = alwaysBlocked();
    // Wall at x=200 from y=0 to y=100
    const walls = [makeWall('w1', [200, 0, 200, 100])];
    const { collision } = createDoorAwareCollision(real, walls);

    // Ray crosses the wall
    const result = collision.testCollision(
      { x: 150, y: 50 }, { x: 250, y: 50 }, { type: 'move', mode: 'any' }
    );

    expect(result).toBe(true);
  });

  it('passes through closed unlocked door', () => {
    const real = alwaysBlocked();
    // Only a closed door at x=200
    const walls = [makeDoor('door1', [200, 0, 200, 100], 0)];
    const { collision, getEncounteredDoors } = createDoorAwareCollision(real, walls);

    const result = collision.testCollision(
      { x: 150, y: 50 }, { x: 250, y: 50 }, { type: 'move', mode: 'any' }
    );

    expect(result).toBe(false);
    expect(getEncounteredDoors()).toContain('door1');
  });

  it('stays blocked by locked door', () => {
    const real = alwaysBlocked();
    const walls = [makeDoor('door1', [200, 0, 200, 100], 2)]; // locked
    const { collision } = createDoorAwareCollision(real, walls);

    const result = collision.testCollision(
      { x: 150, y: 50 }, { x: 250, y: 50 }, { type: 'move', mode: 'any' }
    );

    expect(result).toBe(true);
  });

  it('stays blocked by secret door', () => {
    const real = alwaysBlocked();
    const walls: WallInfo[] = [{ id: 'secret1', c: [200, 0, 200, 100], door: 2, ds: 0, move: 20 }];
    const { collision } = createDoorAwareCollision(real, walls);

    const result = collision.testCollision(
      { x: 150, y: 50 }, { x: 250, y: 50 }, { type: 'move', mode: 'any' }
    );

    expect(result).toBe(true);
  });

  it('stays blocked when wall AND door both on path', () => {
    const real = alwaysBlocked();
    const walls = [
      makeWall('w1', [200, 0, 200, 100]),      // real wall
      makeDoor('door1', [300, 0, 300, 100], 0)  // door (further along)
    ];
    const { collision } = createDoorAwareCollision(real, walls);

    // Ray crosses both wall and door
    const result = collision.testCollision(
      { x: 150, y: 50 }, { x: 350, y: 50 }, { type: 'move', mode: 'any' }
    );

    expect(result).toBe(true);
  });

  it('records multiple doors', () => {
    const real = alwaysBlocked();
    const walls = [
      makeDoor('door1', [200, 0, 200, 100], 0),
      makeDoor('door2', [300, 0, 300, 100], 0)
    ];
    const { collision, getEncounteredDoors } = createDoorAwareCollision(real, walls);

    collision.testCollision(
      { x: 150, y: 50 }, { x: 350, y: 50 }, { type: 'move', mode: 'any' }
    );

    const doors = getEncounteredDoors();
    expect(doors).toContain('door1');
    expect(doors).toContain('door2');
  });

  it('ignores non-blocking walls (move=0)', () => {
    const real = alwaysBlocked();
    const walls = [makeWall('w1', [200, 0, 200, 100], { move: 0 })];
    const { collision } = createDoorAwareCollision(real, walls);

    const result = collision.testCollision(
      { x: 150, y: 50 }, { x: 250, y: 50 }, { type: 'move', mode: 'any' }
    );

    // Wall has move=0, so it's not impassable — real collision is blocked but no impassable wall found
    expect(result).toBe(false);
  });
});

describe('findDoorsAlongPath', () => {
  it('finds door between start and first waypoint', () => {
    const doors = [makeDoor('door1', [150, 0, 150, 100], 0)];

    const result = findDoorsAlongPath(
      [{ x: 200, y: 0 }],  // path: one waypoint
      0, 0,                 // start at (0,0)
      GRID,
      doors
    );

    expect(result).toEqual([{ wallId: 'door1', betweenIndex: 1 }]);
  });

  it('finds door between waypoints', () => {
    const doors = [makeDoor('door1', [250, 0, 250, 100], 0)];

    const result = findDoorsAlongPath(
      [{ x: 100, y: 0 }, { x: 300, y: 0 }],  // two waypoints
      0, 0,
      GRID,
      doors
    );

    // Door is between center of waypoint[0] (150,50) and center of waypoint[1] (350,50)
    expect(result).toEqual([{ wallId: 'door1', betweenIndex: 2 }]);
  });

  it('finds multiple doors in order', () => {
    // Doors at x=200 and x=400 — crossed between waypoint centers
    const doors = [
      makeDoor('door1', [200, 0, 200, 100], 0),
      makeDoor('door2', [400, 0, 400, 100], 0)
    ];

    const result = findDoorsAlongPath(
      [{ x: 100, y: 0 }, { x: 200, y: 0 }, { x: 300, y: 0 }, { x: 400, y: 0 }, { x: 500, y: 0 }],
      0, 0,
      GRID,
      doors
    );

    expect(result).toHaveLength(2);
    expect(result[0]?.wallId).toBe('door1');
    expect(result[1]?.wallId).toBe('door2');
  });

  it('returns empty when no doors on path', () => {
    const doors = [makeDoor('door1', [500, 0, 500, 100], 0)]; // far away

    const result = findDoorsAlongPath(
      [{ x: 100, y: 0 }],
      0, 0,
      GRID,
      doors
    );

    expect(result).toEqual([]);
  });

  it('does not duplicate doors', () => {
    // Door right at a waypoint — could intersect two segments
    const doors = [makeDoor('door1', [150, 0, 150, 100], 0)];

    const result = findDoorsAlongPath(
      [{ x: 100, y: 0 }, { x: 200, y: 0 }],
      0, 0,
      GRID,
      doors
    );

    const doorIds = result.map(d => d.wallId);
    expect(new Set(doorIds).size).toBe(doorIds.length);
  });
});
