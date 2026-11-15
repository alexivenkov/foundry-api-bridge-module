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

export interface PathResult {
  path: Point[];
  cost: number;
}

export interface PathfinderConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  gridSize: number;
  collision: CollisionChecker;
  tokenWidth?: number | undefined;
  tokenHeight?: number | undefined;
  getCellCost?: ((gx: number, gy: number) => number) | undefined;
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
  collision: CollisionChecker,
  tokenW: number,
  tokenH: number
): boolean {
  for (let i = 0; i < tokenW; i++) {
    for (let j = 0; j < tokenH; j++) {
      if (collision.testCollision(
        { x: gridCenter(fromGX + i, gridSize), y: gridCenter(fromGY + j, gridSize) },
        { x: gridCenter(toGX + i, gridSize), y: gridCenter(toGY + j, gridSize) },
        { type: 'move', mode: 'any' }
      )) {
        return true;
      }
    }
  }
  return false;
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

export function findGridPath(config: PathfinderConfig): PathResult | null {
  const { startX, startY, endX, endY, gridSize, collision } = config;
  const maxNodes = config.maxNodes ?? DEFAULT_MAX_NODES;
  const tokenW = config.tokenWidth ?? 1;
  const tokenH = config.tokenHeight ?? 1;
  const cellCost = config.getCellCost ?? ((): number => 1);

  const startGX = Math.floor(startX / gridSize);
  const startGY = Math.floor(startY / gridSize);
  const endGX = Math.floor(endX / gridSize);
  const endGY = Math.floor(endY / gridSize);

  if (startGX === endGX && startGY === endGY) {
    return { path: [], cost: 0 };
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
      return { path: reconstructPath(cameFrom, endGX, endGY, gridSize), cost: current.g };
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

      if (isBlocked(current.gx, current.gy, nx, ny, gridSize, collision, tokenW, tokenH)) continue;

      const tentativeG = current.g + cellCost(nx, ny);
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
