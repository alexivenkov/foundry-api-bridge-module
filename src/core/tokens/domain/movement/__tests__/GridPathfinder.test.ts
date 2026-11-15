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
  it('should return empty path with zero cost when start equals end', () => {
    const result = findGridPath({
      startX: 200, startY: 300,
      endX: 250, endY: 350,
      gridSize: GRID,
      collision: createCollision()
    });

    expect(result).toEqual({ path: [], cost: 0 });
  });

  it('should return single waypoint for adjacent cells with clear path', () => {
    const result = findGridPath({
      startX: 0, startY: 0,
      endX: 100, endY: 0,
      gridSize: GRID,
      collision: createCollision()
    });

    expect(result?.path).toEqual([{ x: 100, y: 0 }]);
    expect(result?.cost).toBe(1);
  });

  it('should find straight path without walls', () => {
    const result = findGridPath({
      startX: 0, startY: 0,
      endX: 300, endY: 0,
      gridSize: GRID,
      collision: createCollision()
    });

    expect(result).not.toBeNull();
    const lastPoint = result?.path[result.path.length - 1];
    expect(lastPoint).toEqual({ x: 300, y: 0 });
    expect(result?.cost).toBe(3);
  });

  it('should find path around a vertical wall', () => {
    // Wall between cell (1,1) and (2,1)
    const walls: WallSegment[] = [verticalWall(1, 1, GRID)];
    const collision = createCollision(walls);

    const result = findGridPath({
      startX: 100, startY: 100,  // grid (1,1)
      endX: 200, endY: 100,      // grid (2,1)
      gridSize: GRID,
      collision
    });

    expect(result).not.toBeNull();
    expect(result!.path.length).toBeGreaterThan(1); // must go around
    expect(result?.path[result.path.length - 1]).toEqual({ x: 200, y: 100 });
    expect(result!.cost).toBeGreaterThan(1);
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

    const result = findGridPath({
      startX: 0, startY: 0,      // grid (0,0)
      endX: 200, endY: 200,      // grid (2,2)
      gridSize: GRID,
      collision
    });

    expect(result).not.toBeNull();
    expect(result?.path[result.path.length - 1]).toEqual({ x: 200, y: 200 });
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

    const result = findGridPath({
      startX: 200, startY: 200,  // grid (2,2) — enclosed
      endX: 400, endY: 400,      // grid (4,4)
      gridSize: GRID,
      collision
    });

    expect(result).toBeNull();
  });

  it('should use diagonal movement', () => {
    const result = findGridPath({
      startX: 0, startY: 0,      // grid (0,0)
      endX: 200, endY: 200,      // grid (2,2)
      gridSize: GRID,
      collision: createCollision()
    });

    expect(result).not.toBeNull();
    // Diagonal should be 2 steps, not 4 (orthogonal zigzag)
    expect(result?.path.length).toBe(2);
    expect(result?.cost).toBe(2);
  });

  it('should follow corridor around walls', () => {
    // Long vertical wall from y=0 to y=400, with gap at y=400-500
    const walls: WallSegment[] = [];
    for (let gy = 0; gy < 4; gy++) {
      walls.push(verticalWall(2, gy, GRID));
    }
    const collision = createCollision(walls);

    const result = findGridPath({
      startX: 100, startY: 100,  // grid (1,1)
      endX: 300, endY: 100,      // grid (3,1)
      gridSize: GRID,
      collision
    });

    expect(result).not.toBeNull();
    // Must go around the wall (down past y=4, then right, then up)
    const lastPoint = result?.path[result.path.length - 1];
    expect(lastPoint).toEqual({ x: 300, y: 100 });
  });

  it('should return null when maxNodes exceeded', () => {
    const result = findGridPath({
      startX: 0, startY: 0,
      endX: 5000, endY: 5000,    // very far
      gridSize: GRID,
      collision: createCollision(),
      maxNodes: 5                 // extremely low limit
    });

    expect(result).toBeNull();
  });

  it('should find path in open space efficiently', () => {
    const result = findGridPath({
      startX: 0, startY: 0,
      endX: 500, endY: 0,        // 5 cells right
      gridSize: GRID,
      collision: createCollision()
    });

    expect(result).not.toBeNull();
    expect(result?.path.length).toBe(5);
    expect(result?.path[4]).toEqual({ x: 500, y: 0 });
    expect(result?.cost).toBe(5);
  });

  it('should handle non-grid-aligned start position', () => {
    // Token at pixel (150, 150) is in grid cell (1,1)
    const result = findGridPath({
      startX: 150, startY: 150,
      endX: 300, endY: 100,      // grid (3,1)
      gridSize: GRID,
      collision: createCollision()
    });

    expect(result).not.toBeNull();
    expect(result?.path[result.path.length - 1]).toEqual({ x: 300, y: 100 });
  });

  it('should have higher cost for detour than direct path', () => {
    const walls: WallSegment[] = [verticalWall(1, 1, GRID)];
    const collision = createCollision(walls);

    const detour = findGridPath({
      startX: 100, startY: 100,  // grid (1,1) — wall to the right
      endX: 200, endY: 100,      // grid (2,1)
      gridSize: GRID,
      collision
    });

    const direct = findGridPath({
      startX: 100, startY: 100,
      endX: 200, endY: 100,
      gridSize: GRID,
      collision: createCollision() // no walls
    });

    expect(detour).not.toBeNull();
    expect(direct).not.toBeNull();
    expect(detour!.cost).toBeGreaterThan(direct!.cost);
  });

  describe('large token support', () => {
    it('should block 2x2 token from 1-wide gap', () => {
      // Infinite vertical barrier at x=200 with a single gap at row 2
      const collision: CollisionChecker = {
        testCollision: jest.fn((origin: Point, dest: Point) => {
          const crossesBarrier =
            (origin.x < 200 && dest.x >= 200) || (origin.x >= 200 && dest.x < 200);
          if (!crossesBarrier) return false;
          const originRow = Math.floor(origin.y / GRID);
          const destRow = Math.floor(dest.y / GRID);
          return originRow !== 2 || destRow !== 2;
        })
      };

      // 1x1 token CAN pass through the gap at row 2
      const resultSmall = findGridPath({
        startX: 0, startY: 200,
        endX: 200, endY: 200,
        gridSize: GRID,
        collision,
        tokenWidth: 1,
        tokenHeight: 1
      });
      expect(resultSmall).not.toBeNull();

      // 2x2 token CANNOT — bottom row (row 3) hits the barrier
      const resultLarge = findGridPath({
        startX: 0, startY: 200,
        endX: 200, endY: 200,
        gridSize: GRID,
        collision,
        tokenWidth: 2,
        tokenHeight: 2
      });
      expect(resultLarge).toBeNull();
    });

    it('should allow 2x2 token through 2-wide corridor', () => {
      // Walls creating a 2-cell-wide corridor at columns 2-3
      const walls: WallSegment[] = [];
      for (let gy = 0; gy < 4; gy++) {
        walls.push(verticalWall(1, gy, GRID));
        walls.push(verticalWall(3, gy, GRID));
      }
      const collision = createCollision(walls);

      const result = findGridPath({
        startX: 0, startY: 0,
        endX: 400, endY: 0,
        gridSize: GRID,
        collision,
        tokenWidth: 2,
        tokenHeight: 2
      });

      expect(result).not.toBeNull();
      expect(result?.path[result.path.length - 1]).toEqual({ x: 400, y: 0 });
    });

    it('should route 3x3 token around obstacle', () => {
      // Single vertical wall segment between (2,2) and (3,2)
      const walls: WallSegment[] = [verticalWall(2, 2, GRID)];
      const collision = createCollision(walls);

      const result = findGridPath({
        startX: 0, startY: 200,
        endX: 300, endY: 200,
        gridSize: GRID,
        collision,
        tokenWidth: 3,
        tokenHeight: 3
      });

      expect(result).not.toBeNull();
      expect(result?.path[result.path.length - 1]).toEqual({ x: 300, y: 200 });
    });

    it('should handle 2x2 token diagonal in open space', () => {
      const result = findGridPath({
        startX: 0, startY: 0,
        endX: 200, endY: 200,
        gridSize: GRID,
        collision: createCollision(),
        tokenWidth: 2,
        tokenHeight: 2
      });

      expect(result).not.toBeNull();
      expect(result?.path.length).toBe(2);
      expect(result?.cost).toBe(2);
    });

    it('should detect wall clipping footprint edge', () => {
      // Wall between (1,0) and (2,0)
      const walls: WallSegment[] = [verticalWall(1, 0, GRID)];
      const collision = createCollision(walls);

      // 1x1 token can pass
      const resultSmall = findGridPath({
        startX: 0, startY: 0,
        endX: 200, endY: 0,
        gridSize: GRID,
        collision,
        tokenWidth: 1,
        tokenHeight: 1
      });
      expect(resultSmall).not.toBeNull();

      // 2x1 token must detour — its right cell would clip the wall
      const resultLarge = findGridPath({
        startX: 0, startY: 0,
        endX: 200, endY: 0,
        gridSize: GRID,
        collision,
        tokenWidth: 2,
        tokenHeight: 1
      });
      expect(resultLarge).not.toBeNull();
      // Must take a different route than a straight line
      const hasVerticalMovement = resultLarge!.path.some(p => p.y !== 0);
      expect(hasVerticalMovement).toBe(true);
    });

    it('should default to 1x1 when tokenWidth/tokenHeight omitted', () => {
      const resultDefault = findGridPath({
        startX: 0, startY: 0,
        endX: 200, endY: 0,
        gridSize: GRID,
        collision: createCollision()
      });

      const resultExplicit = findGridPath({
        startX: 0, startY: 0,
        endX: 200, endY: 0,
        gridSize: GRID,
        collision: createCollision(),
        tokenWidth: 1,
        tokenHeight: 1
      });

      expect(resultDefault).toEqual(resultExplicit);
    });
  });

  describe('getCellCost', () => {
    it('should use getCellCost for path cost calculation', () => {
      // Column 2 costs 3 instead of 1
      const result = findGridPath({
        startX: 0, startY: 0,
        endX: 300, endY: 0,
        gridSize: GRID,
        collision: createCollision(),
        getCellCost: (gx) => gx === 2 ? 3 : 1
      });

      expect(result).not.toBeNull();
      // Path: (0,0) → (1,0) cost 1 → (2,0) cost 3 → (3,0) cost 1 = total 5
      expect(result?.cost).toBe(5);
    });

    it('should avoid expensive cells when cheaper route exists', () => {
      // Column 1 costs 10 — going around should be cheaper
      const expensive = findGridPath({
        startX: 0, startY: 0,
        endX: 200, endY: 0,
        gridSize: GRID,
        collision: createCollision(),
        getCellCost: (gx) => gx === 1 ? 10 : 1
      });

      const cheap = findGridPath({
        startX: 0, startY: 0,
        endX: 200, endY: 0,
        gridSize: GRID,
        collision: createCollision(),
        getCellCost: () => 1
      });

      expect(expensive).not.toBeNull();
      expect(cheap).not.toBeNull();
      // With expensive column, path should either go through (cost 12) or around (lower cost)
      // The A* should find the cheaper option
      expect(expensive!.cost).toBeGreaterThan(cheap!.cost);
    });

    it('should default to cost 1 when getCellCost omitted', () => {
      const withDefault = findGridPath({
        startX: 0, startY: 0,
        endX: 300, endY: 0,
        gridSize: GRID,
        collision: createCollision()
      });

      const withExplicit = findGridPath({
        startX: 0, startY: 0,
        endX: 300, endY: 0,
        gridSize: GRID,
        collision: createCollision(),
        getCellCost: () => 1
      });

      expect(withDefault?.cost).toBe(withExplicit?.cost);
    });
  });
});
