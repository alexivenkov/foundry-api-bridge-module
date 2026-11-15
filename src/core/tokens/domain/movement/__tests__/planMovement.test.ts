import type { PassageWall } from '../DoorAwareCollision';
import type { CollisionChecker, Point } from '../GridPathfinder';
import { isDirectPathBlocked, planMovement, type MovementRequest } from '../planMovement';

const GRID = 100;

/** An infinite vertical barrier at x = `at`: any ray crossing it collides. */
function barrierAt(at: number): CollisionChecker {
  return {
    testCollision: (origin: Point, destination: Point): boolean =>
      (origin.x < at && destination.x >= at) || (origin.x >= at && destination.x < at)
  };
}

/** A short wall at x = `at` covering only the row of cells at y ∈ [0, 100). */
function shortWallAt(at: number): CollisionChecker {
  return {
    testCollision: (origin: Point, destination: Point): boolean => {
      const crosses = (origin.x < at && destination.x >= at) || (origin.x >= at && destination.x < at);
      return crosses && origin.y < 100 && destination.y < 100 && origin.y >= 0 && destination.y >= 0;
    }
  };
}

const open: CollisionChecker = { testCollision: () => false };

function door(state: PassageWall['doorState'] = 'closed'): PassageWall {
  return { id: 'door-1', segment: [200, -10000, 200, 10000], door: 'door', doorState: state, blocksMovement: true };
}

function request(overrides: Partial<MovementRequest> = {}): MovementRequest {
  return {
    from: { x: 100, y: 0 },
    to: { x: 300, y: 0 },
    width: 1,
    height: 1,
    gridSize: GRID,
    collision: open,
    walls: null,
    ...overrides
  };
}

describe('isDirectPathBlocked', () => {
  it('tests the centre of every cell of the token footprint', () => {
    const collision = { testCollision: jest.fn().mockReturnValue(false) };

    isDirectPathBlocked(request({ width: 2, height: 2 }), collision);

    expect(collision.testCollision).toHaveBeenCalledTimes(4);
    expect(collision.testCollision).toHaveBeenCalledWith(
      { x: 150, y: 50 },
      { x: 350, y: 50 },
      { type: 'move', mode: 'any' }
    );
  });

  it('is blocked when any cell of the footprint collides', () => {
    expect(isDirectPathBlocked(request(), barrierAt(200))).toBe(true);
    expect(isDirectPathBlocked(request(), open)).toBe(false);
  });
});

describe('planMovement', () => {
  it('goes straight when nothing is in the way', () => {
    expect(planMovement(request())).toEqual({ kind: 'direct' });
  });

  it('routes around an obstacle and reports the cost of the route', () => {
    const plan = planMovement(request({ collision: shortWallAt(200) }));

    expect(plan.kind).toBe('path');
    if (plan.kind === 'path') {
      expect(plan.steps.at(-1)).toEqual({ x: 300, y: 0 });
      expect(plan.pathCost).toBeGreaterThan(0);
    }
  });

  it('is blocked when no route exists', () => {
    expect(planMovement(request({ collision: barrierAt(200) }))).toEqual({ kind: 'blocked' });
  });

  it('keeps doors shut unless the mover may open them', () => {
    expect(planMovement(request({ collision: barrierAt(200), walls: null }))).toEqual({ kind: 'blocked' });
  });

  it('walks straight through a closed door that lies on the direct line', () => {
    const plan = planMovement(request({ collision: barrierAt(200), walls: [door()] }));

    expect(plan).toEqual({
      kind: 'doors',
      steps: [{ x: 300, y: 0 }],
      doors: [{ wallId: 'door-1', betweenIndex: 1 }]
    });
  });

  it.each(['locked'] as const)('does not pass a %s door', (state) => {
    expect(planMovement(request({ collision: barrierAt(200), walls: [door(state)] }))).toEqual({ kind: 'blocked' });
  });

  it('does not pass a secret door', () => {
    const secret: PassageWall = { ...door(), door: 'secret' };

    expect(planMovement(request({ collision: barrierAt(200), walls: [secret] }))).toEqual({ kind: 'blocked' });
  });

  it('goes straight when the mover may open doors but meets none', () => {
    const farWall: PassageWall = { id: 'w1', segment: [500, 0, 500, 100], door: 'none', doorState: 'closed', blocksMovement: true };

    expect(planMovement(request({ walls: [farWall] }))).toEqual({ kind: 'direct' });
  });
});
