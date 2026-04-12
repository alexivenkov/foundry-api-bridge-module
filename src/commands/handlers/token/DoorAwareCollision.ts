import type { CollisionChecker, Point } from './GridPathfinder';

export interface WallInfo {
  id: string;
  c: number[];
  door: number;
  ds: number;
  move: number;
}

export interface DoorOnPath {
  wallId: string;
  betweenIndex: number;
}

export interface DoorAwareResult {
  collision: CollisionChecker;
  getEncounteredDoors(): string[];
}

function direction(a: Point, b: Point, c: Point): number {
  return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
}

export function segmentsIntersect(
  p1: Point, p2: Point,
  p3: Point, p4: Point
): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function onSegment(p: Point, q: Point, r: Point): boolean {
  return r.x <= Math.max(p.x, q.x) && r.x >= Math.min(p.x, q.x) &&
         r.y <= Math.max(p.y, q.y) && r.y >= Math.min(p.y, q.y);
}

export function segmentsIntersectRelaxed(
  p1: Point, p2: Point,
  p3: Point, p4: Point
): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
}

function wallToSegment(wall: WallInfo): [Point, Point] {
  return [
    { x: wall.c[0] ?? 0, y: wall.c[1] ?? 0 },
    { x: wall.c[2] ?? 0, y: wall.c[3] ?? 0 }
  ];
}

export function createDoorAwareCollision(
  realCollision: CollisionChecker,
  walls: WallInfo[]
): DoorAwareResult {
  const openableDoors = walls.filter(w =>
    w.door === 1 && (w.ds === 0) && w.move !== 0
  );

  const impassableWalls = walls.filter(w => {
    if (w.move === 0) return false;
    if (w.door === 1 && w.ds === 0) return false;
    if (w.door === 1 && w.ds === 1) return false;
    return true;
  });

  const encounteredDoors = new Set<string>();

  const collision: CollisionChecker = {
    testCollision(origin: Point, destination: Point, config: { type: string; mode: string }): boolean {
      const blocked = realCollision.testCollision(origin, destination, config);
      if (!blocked) return false;

      for (const wall of impassableWalls) {
        const [p3, p4] = wallToSegment(wall);
        if (segmentsIntersect(origin, destination, p3, p4)) {
          return true;
        }
      }

      for (const door of openableDoors) {
        const [p3, p4] = wallToSegment(door);
        if (segmentsIntersectRelaxed(origin, destination, p3, p4)) {
          encounteredDoors.add(door.id);
        }
      }

      return false;
    }
  };

  return {
    collision,
    getEncounteredDoors(): string[] {
      return [...encounteredDoors];
    }
  };
}

export function findDoorsAlongPath(
  path: Point[],
  startX: number,
  startY: number,
  gridSize: number,
  openableDoors: WallInfo[]
): DoorOnPath[] {
  const centers: Point[] = [
    { x: startX + gridSize / 2, y: startY + gridSize / 2 },
    ...path.map(p => ({ x: p.x + gridSize / 2, y: p.y + gridSize / 2 }))
  ];

  const result: DoorOnPath[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < centers.length - 1; i++) {
    const from = centers[i];
    const to = centers[i + 1];
    if (!from || !to) continue;

    for (const door of openableDoors) {
      if (seen.has(door.id)) continue;
      const [p3, p4] = wallToSegment(door);
      if (segmentsIntersectRelaxed(from, to, p3, p4)) {
        result.push({ wallId: door.id, betweenIndex: i + 1 });
        seen.add(door.id);
      }
    }
  }

  return result;
}
