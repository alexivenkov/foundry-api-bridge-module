import { chebyshevDistanceFromPoint } from '../geometry';

describe('chebyshevDistanceFromPoint', () => {
  it('returns 0 when origin point is inside token footprint', () => {
    const token = { x: 100, y: 100, width: 1, height: 1 };
    expect(chebyshevDistanceFromPoint(150, 150, token, 100, 5)).toBe(0);
  });

  it('returns 0 when origin point sits on token edge', () => {
    const token = { x: 100, y: 100, width: 1, height: 1 };
    expect(chebyshevDistanceFromPoint(100, 100, token, 100, 5)).toBe(0);
  });

  it('measures from closest corner using Chebyshev metric', () => {
    // 1x1 token at (100,100). Origin at (300,100).
    // Closest point on token bbox: (200, 100) -> dx = 100, dy = 0
    // Chebyshev = 100 px = 1 cell = 5 ft
    const token = { x: 100, y: 100, width: 1, height: 1 };
    expect(chebyshevDistanceFromPoint(300, 100, token, 100, 5)).toBe(5);
  });

  it('uses max(dx, dy) — not Euclidean — for diagonal points', () => {
    // Token at (100,100), origin at (300,300).
    // Closest point: (200, 200) -> dx = 100, dy = 100
    // Chebyshev = max(100,100) = 100 px = 1 cell = 5 ft
    // (Euclidean would be sqrt(2)*100 ≈ 141.4, giving ~7.07 — explicitly NOT used)
    const token = { x: 100, y: 100, width: 1, height: 1 };
    expect(chebyshevDistanceFromPoint(300, 300, token, 100, 5)).toBe(5);
  });

  it('respects multi-cell token width', () => {
    // 2-wide token at (100,100): occupies x [100..300], y [100..200]
    // Origin (400, 150): closest = (300, 150) -> dx = 100 -> 1 cell -> 5 ft
    const token = { x: 100, y: 100, width: 2, height: 1 };
    expect(chebyshevDistanceFromPoint(400, 150, token, 100, 5)).toBe(5);
  });

  it('scales by gridDistance when grid units differ', () => {
    // Token at (0,0) 1x1 with gridSize=100, gridDistance=10 (e.g. 10 m per cell)
    // Origin (300,0): dx=200 px, 2 cells, 20 m
    const token = { x: 0, y: 0, width: 1, height: 1 };
    expect(chebyshevDistanceFromPoint(300, 0, token, 100, 10)).toBe(20);
  });

  it('produces fractional distance for sub-cell offsets', () => {
    // Token at (0,0) 1x1 gridSize=100 distance=5
    // Origin (150, 0): closest = (100, 0) -> dx=50 px = 0.5 cell = 2.5 ft
    const token = { x: 0, y: 0, width: 1, height: 1 };
    expect(chebyshevDistanceFromPoint(150, 0, token, 100, 5)).toBe(2.5);
  });

  it('handles different grid sizes correctly', () => {
    // gridSize=50, distance=5: 100px = 2 cells = 10 ft
    const token = { x: 0, y: 0, width: 1, height: 1 };
    // Token now occupies x [0..50] (1 cell of 50px)
    // Origin (150, 0): dx = 150 - 50 = 100 px = 2 cells = 10 ft
    expect(chebyshevDistanceFromPoint(150, 0, token, 50, 5)).toBe(10);
  });
});
