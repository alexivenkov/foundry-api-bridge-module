import {
  createDoorAwareCollision,
  findDoorsAlongPath,
  isOpenableDoor,
  type DoorOnPath,
  type PassageWall
} from './DoorAwareCollision';
import { findGridPath, type CollisionChecker, type Point } from './GridPathfinder';

export interface MovementRequest {
  /** Top-left corner of the token now. */
  readonly from: Point;
  /** Top-left corner of the destination. */
  readonly to: Point;
  /** Token size in grid cells. */
  readonly width: number;
  readonly height: number;
  readonly gridSize: number;
  readonly collision: CollisionChecker;
  /** The scene's walls when the mover may open doors; null when doors stay shut. */
  readonly walls: readonly PassageWall[] | null;
}

export type MovementPlan =
  /** Nothing in the way: one move straight to the destination. */
  | { readonly kind: 'direct' }
  /** A route around obstacles, walked cell by cell. */
  | { readonly kind: 'path'; readonly steps: readonly Point[]; readonly pathCost: number }
  /** A route that may cross doors; `doors` says before which step each one is opened. */
  | {
      readonly kind: 'doors';
      readonly steps: readonly Point[];
      readonly doors: readonly DoorOnPath[];
      readonly pathCost?: number;
    }
  | { readonly kind: 'blocked' };

function cellCenter(corner: number, cell: number, gridSize: number): number {
  return corner + cell * gridSize + gridSize / 2;
}

/** A straight move is blocked when any cell of the token's footprint would cross an obstacle. */
export function isDirectPathBlocked(request: Pick<
  MovementRequest,
  'from' | 'to' | 'width' | 'height' | 'gridSize'
>, collision: CollisionChecker): boolean {
  const { from, to, width, height, gridSize } = request;
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const origin = { x: cellCenter(from.x, i, gridSize), y: cellCenter(from.y, j, gridSize) };
      const destination = { x: cellCenter(to.x, i, gridSize), y: cellCenter(to.y, j, gridSize) };
      if (collision.testCollision(origin, destination, { type: 'move', mode: 'any' })) {
        return true;
      }
    }
  }
  return false;
}

function findRoute(request: MovementRequest, collision: CollisionChecker): { steps: Point[]; cost: number } | null {
  const route = findGridPath({
    startX: request.from.x,
    startY: request.from.y,
    endX: request.to.x,
    endY: request.to.y,
    gridSize: request.gridSize,
    collision,
    tokenWidth: request.width,
    tokenHeight: request.height
  });
  return route !== null && route.path.length > 0 ? { steps: route.path, cost: route.cost } : null;
}

function planAroundObstacles(request: MovementRequest): MovementPlan {
  if (!isDirectPathBlocked(request, request.collision)) {
    return { kind: 'direct' };
  }
  const route = findRoute(request, request.collision);
  return route !== null ? { kind: 'path', steps: route.steps, pathCost: route.cost } : { kind: 'blocked' };
}

function planThroughDoors(request: MovementRequest, walls: readonly PassageWall[]): MovementPlan {
  const { collision } = createDoorAwareCollision(request.collision, walls);
  const openableDoors = walls.filter(isOpenableDoor);
  const { from, to, gridSize } = request;

  if (!isDirectPathBlocked(request, collision)) {
    const doors = findDoorsAlongPath([to], from.x, from.y, gridSize, openableDoors);
    return doors.length > 0 ? { kind: 'doors', steps: [to], doors } : { kind: 'direct' };
  }

  const route = findRoute(request, collision);
  if (route === null) {
    return { kind: 'blocked' };
  }
  return {
    kind: 'doors',
    steps: route.steps,
    doors: findDoorsAlongPath(route.steps, from.x, from.y, gridSize, openableDoors),
    pathCost: route.cost
  };
}

/** Decides how a token gets to its destination: straight, around obstacles, through doors, or not at all. */
export function planMovement(request: MovementRequest): MovementPlan {
  return request.walls !== null ? planThroughDoors(request, request.walls) : planAroundObstacles(request);
}
