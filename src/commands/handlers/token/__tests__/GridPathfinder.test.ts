import { findGridPath, type CollisionChecker, type Point } from '../GridPathfinder';

type WallSegment = [Point, Point];

function createCollision(walls: WallSegment[] = []): CollisionChecker {
  return {
    testCollision: jest.fn((origin: Point, dest: Point) => {
      for (const [a, b] of walls) {
        if (segmentsIntersect(origin, dest, a, b)) return true;
      }
      return false;
    })
  };
}

function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

function direction(a: Point, b: Point, c: Point): number {
  return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
}

// Helper: create a vertical wall between grid cells (gx, gy) and (gx+1, gy)
// Wall runs along the right edge of cell (gx, gy) in pixel coordinates
function verticalWall(gx: number, gy: number, gridSize: number): WallSegment {
  const wx = (gx + 1) * gridSize;
  return [
    { x: wx, y: gy * gridSize },
    { x: wx, y: (gy + 1) * gridSize }
  ];
}

// Helper: create a horizontal wall between grid cells (gx, gy) and (gx, gy+1)
function horizontalWall(gx: number, gy: number, gridSize: number): WallSegment {
  const wy = (gy + 1) * gridSize;
  return [
    { x: gx * gridSize, y: wy },
    { x: (gx + 1) * gridSize, y: wy }
  ];
}

const GRID = 100;

describe('findGridPath', () => {
  it('should return empty array when start equals end', () => {
    const path = findGridPath({
      startX: 200, startY: 300,
      endX: 250, endY: 350,
      gridSize: GRID,
      collision: createCollision()
    });

    expect(path).toEqual([]);
  });

  it('should return single waypoint for adjacent cells with clear path', () => {
    const path = findGridPath({
      startX: 0, startY: 0,
      endX: 100, endY: 0,
      gridSize: GRID,
      collision: createCollision()
    });

    expect(path).toEqual([{ x: 100, y: 0 }]);
  });

  it('should find straight path without walls', () => {
    const path = findGridPath({
      startX: 0, startY: 0,
      endX: 300, endY: 0,
      gridSize: GRID,
      collision: createCollision()
    });

    expect(path).not.toBeNull();
    const lastPoint = path?.[path.length - 1];
    expect(lastPoint).toEqual({ x: 300, y: 0 });
  });

  it('should find path around a vertical wall', () => {
    // Wall between cell (1,1) and (2,1)
    const walls: WallSegment[] = [verticalWall(1, 1, GRID)];
    const collision = createCollision(walls);

    const path = findGridPath({
      startX: 100, startY: 100,  // grid (1,1)
      endX: 200, endY: 100,      // grid (2,1)
      gridSize: GRID,
      collision
    });

    expect(path).not.toBeNull();
    expect(path?.length).toBeGreaterThan(1); // must go around
    expect(path?.[path.length - 1]).toEqual({ x: 200, y: 100 });
  });

  it('should find path around L-shaped wall', () => {
    // L-shape: vertical wall at x=200 from y=0 to y=200, horizontal wall at y=200 from x=0 to x=200
    const walls: WallSegment[] = [
      verticalWall(1, 0, GRID),
      verticalWall(1, 1, GRID),
      horizontalWall(0, 1, GRID),
      horizontalWall(1, 1, GRID)
    ];
    const collision = createCollision(walls);

    const path = findGridPath({
      startX: 0, startY: 0,      // grid (0,0)
      endX: 200, endY: 200,      // grid (2,2)
      gridSize: GRID,
      collision
    });

    expect(path).not.toBeNull();
    expect(path?.[path.length - 1]).toEqual({ x: 200, y: 200 });
  });

  it('should return null when completely enclosed', () => {
    // Block ALL 8 directions from cell (2,2)
    const collision: CollisionChecker = {
      testCollision: jest.fn((origin: Point, dest: Point) => {
        const fromGX = Math.floor(origin.x / GRID);
        const fromGY = Math.floor(origin.y / GRID);
        // Block everything leaving cell (2,2)
        if (fromGX === 2 && fromGY === 2) return true;
        // Block everything entering cell (2,2)
        const toGX = Math.floor(dest.x / GRID);
        const toGY = Math.floor(dest.y / GRID);
        if (toGX === 2 && toGY === 2) return true;
        return false;
      })
    };

    const path = findGridPath({
      startX: 200, startY: 200,  // grid (2,2) — enclosed
      endX: 400, endY: 400,      // grid (4,4)
      gridSize: GRID,
      collision
    });

    expect(path).toBeNull();
  });

  it('should use diagonal movement', () => {
    const path = findGridPath({
      startX: 0, startY: 0,      // grid (0,0)
      endX: 200, endY: 200,      // grid (2,2)
      gridSize: GRID,
      collision: createCollision()
    });

    expect(path).not.toBeNull();
    // Diagonal should be 2 steps, not 4 (orthogonal zigzag)
    expect(path?.length).toBe(2);
  });

  it('should follow corridor around walls', () => {
    // Long vertical wall from y=0 to y=400, with gap at y=400-500
    const walls: WallSegment[] = [];
    for (let gy = 0; gy < 4; gy++) {
      walls.push(verticalWall(2, gy, GRID));
    }
    const collision = createCollision(walls);

    const path = findGridPath({
      startX: 100, startY: 100,  // grid (1,1)
      endX: 300, endY: 100,      // grid (3,1)
      gridSize: GRID,
      collision
    });

    expect(path).not.toBeNull();
    // Must go around the wall (down past y=4, then right, then up)
    const lastPoint = path?.[path.length - 1];
    expect(lastPoint).toEqual({ x: 300, y: 100 });
  });

  it('should return null when maxNodes exceeded', () => {
    const path = findGridPath({
      startX: 0, startY: 0,
      endX: 5000, endY: 5000,    // very far
      gridSize: GRID,
      collision: createCollision(),
      maxNodes: 5                 // extremely low limit
    });

    expect(path).toBeNull();
  });

  it('should find path in open space efficiently', () => {
    const path = findGridPath({
      startX: 0, startY: 0,
      endX: 500, endY: 0,        // 5 cells right
      gridSize: GRID,
      collision: createCollision()
    });

    expect(path).not.toBeNull();
    expect(path?.length).toBe(5);
    expect(path?.[4]).toEqual({ x: 500, y: 0 });
  });

  it('should handle non-grid-aligned start position', () => {
    // Token at pixel (150, 150) is in grid cell (1,1)
    const path = findGridPath({
      startX: 150, startY: 150,
      endX: 300, endY: 100,      // grid (3,1)
      gridSize: GRID,
      collision: createCollision()
    });

    expect(path).not.toBeNull();
    expect(path?.[path.length - 1]).toEqual({ x: 300, y: 100 });
  });
});
