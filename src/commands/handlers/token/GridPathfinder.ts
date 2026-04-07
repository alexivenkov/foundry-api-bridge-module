export interface Point {
  x: number;
  y: number;
}

export interface CollisionChecker {
  testCollision(
    origin: Point,
    destination: Point,
    config: { type: string; mode: string }
  ): boolean;
}

export interface PathfinderConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  gridSize: number;
  collision: CollisionChecker;
  maxNodes?: number | undefined;
}

interface Node {
  gx: number;
  gy: number;
  g: number;
  f: number;
}

const DEFAULT_MAX_NODES = 2500;

const DIRECTIONS: ReadonlyArray<[number, number]> = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [-1, 1], [1, -1], [1, 1]
];

function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

function toKey(gx: number, gy: number): string {
  return `${String(gx)},${String(gy)}`;
}

function gridCenter(gx: number, gridSize: number): number {
  return gx * gridSize + gridSize / 2;
}

function isBlocked(
  fromGX: number,
  fromGY: number,
  toGX: number,
  toGY: number,
  gridSize: number,
  collision: CollisionChecker
): boolean {
  return collision.testCollision(
    { x: gridCenter(fromGX, gridSize), y: gridCenter(fromGY, gridSize) },
    { x: gridCenter(toGX, gridSize), y: gridCenter(toGY, gridSize) },
    { type: 'move', mode: 'any' }
  );
}

function findLowestF(openSet: Node[]): number {
  let minIdx = 0;
  let minF = openSet[0]?.f ?? Infinity;

  for (let i = 1; i < openSet.length; i++) {
    const f = openSet[i]?.f ?? Infinity;
    if (f < minF) {
      minF = f;
      minIdx = i;
    }
  }

  return minIdx;
}

function reconstructPath(
  cameFrom: Map<string, string>,
  endGX: number,
  endGY: number,
  gridSize: number
): Point[] {
  const path: Point[] = [];
  let key = toKey(endGX, endGY);

  while (cameFrom.has(key)) {
    const [gxStr, gyStr] = key.split(',');
    const gx = Number(gxStr);
    const gy = Number(gyStr);
    path.push({ x: gx * gridSize, y: gy * gridSize });
    key = cameFrom.get(key) ?? '';
  }

  path.reverse();
  return path;
}

export function findGridPath(config: PathfinderConfig): Point[] | null {
  const { startX, startY, endX, endY, gridSize, collision } = config;
  const maxNodes = config.maxNodes ?? DEFAULT_MAX_NODES;

  const startGX = Math.floor(startX / gridSize);
  const startGY = Math.floor(startY / gridSize);
  const endGX = Math.floor(endX / gridSize);
  const endGY = Math.floor(endY / gridSize);

  if (startGX === endGX && startGY === endGY) {
    return [];
  }

  const startKey = toKey(startGX, startGY);
  const h = chebyshev(startGX, startGY, endGX, endGY);

  const openSet: Node[] = [{ gx: startGX, gy: startGY, g: 0, f: h }];
  const gScore = new Map<string, number>([[startKey, 0]]);
  const cameFrom = new Map<string, string>();
  const closed = new Set<string>();

  let explored = 0;

  while (openSet.length > 0) {
    if (explored >= maxNodes) {
      return null;
    }

    const idx = findLowestF(openSet);
    const current = openSet[idx];
    if (!current) break;

    if (current.gx === endGX && current.gy === endGY) {
      return reconstructPath(cameFrom, endGX, endGY, gridSize);
    }

    openSet.splice(idx, 1);
    const currentKey = toKey(current.gx, current.gy);
    closed.add(currentKey);
    explored++;

    for (const [dx, dy] of DIRECTIONS) {
      const nx = current.gx + dx;
      const ny = current.gy + dy;
      const neighborKey = toKey(nx, ny);

      if (closed.has(neighborKey)) continue;

      if (isBlocked(current.gx, current.gy, nx, ny, gridSize, collision)) continue;

      const tentativeG = current.g + 1;
      const existingG = gScore.get(neighborKey);

      if (existingG !== undefined && tentativeG >= existingG) continue;

      cameFrom.set(neighborKey, currentKey);
      gScore.set(neighborKey, tentativeG);

      const f = tentativeG + chebyshev(nx, ny, endGX, endGY);
      const existingIdx = openSet.findIndex(n => n.gx === nx && n.gy === ny);

      if (existingIdx >= 0) {
        const existing = openSet[existingIdx];
        if (existing) {
          existing.g = tentativeG;
          existing.f = f;
        }
      } else {
        openSet.push({ gx: nx, gy: ny, g: tentativeG, f });
      }
    }
  }

  return null;
}
