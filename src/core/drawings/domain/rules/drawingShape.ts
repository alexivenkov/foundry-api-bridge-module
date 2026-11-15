import { DrawingShapeError } from '@/core/drawings/domain/errors/DrawingShapeError';
import type { DrawingShape, DrawingShapeChanges, DrawingShapeType } from '@/core/drawings/domain/model/Drawing';

export interface PolygonGeometry {
  /** How far the drawing's position moves so that the points start at (0, 0). */
  readonly dx: number;
  readonly dy: number;
  readonly width: number;
  readonly height: number;
  readonly points: readonly number[];
}

/**
 * Port of `Drawing.normalizeShape` (identical in Foundry 13.351 and 14.368):
 * drops a vertex that repeats the previous one, moves the bounding box to start
 * at (0, 0) and measures it.
 */
export function normalizePolygon(rawPoints: readonly number[]): PolygonGeometry {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 1; i < rawPoints.length; i += 2) {
    const x1 = rawPoints[i - 1] ?? 0;
    const y1 = rawPoints[i] ?? 0;
    if (i >= 3 && x1 === rawPoints[i - 3] && y1 === rawPoints[i - 2]) {
      continue;
    }
    xs.push(x1);
    ys.push(y1);
  }
  if (xs.length === 0) {
    return { dx: 0, dy: 0, width: 0, height: 0, points: [] };
  }
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const points: number[] = [];
  xs.forEach((x, index) => points.push(x - minX, (ys[index] ?? 0) - minY));
  return {
    dx: minX,
    dy: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
    points
  };
}

export interface PlacedShape {
  readonly x: number;
  readonly y: number;
  readonly shape: DrawingShape;
}

export interface ShapePlacementChanges {
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly shape?: DrawingShapeChanges | undefined;
}

/** A shape the canvas draws, with every dimension known. */
export interface CompleteDrawingShape extends DrawingShape {
  readonly type: DrawingShapeType;
}

export interface PlannedShape {
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly shape?: CompleteDrawingShape | undefined;
}

/**
 * The complete shape a change leads to, and the position it implies. A
 * polygon's size follows its points, which are normalized; a rectangle or an
 * ellipse keeps no points. `current` is null when the drawing is new.
 */
export function planDrawingShape(current: PlacedShape | null, changes: ShapePlacementChanges): PlannedShape {
  const requested = changes.shape;
  if (requested === undefined) {
    return { x: changes.x, y: changes.y };
  }

  const type = requested.type ?? current?.shape.type ?? null;
  if (type === null) {
    throw new DrawingShapeError('The drawing has a shape the canvas does not draw; set shape.type to replace it');
  }

  if (type !== 'polygon') {
    if (requested.points !== undefined) {
      throw new DrawingShapeError('Only a polygon takes points');
    }
    const width = requested.width ?? current?.shape.width;
    const height = requested.height ?? current?.shape.height;
    if (width === undefined || height === undefined) {
      throw new DrawingShapeError(`${type === 'ellipse' ? 'An ellipse' : 'A rectangle'} needs a width and a height`);
    }
    return { x: changes.x, y: changes.y, shape: { type, width, height, points: [] } };
  }

  if (requested.width !== undefined || requested.height !== undefined) {
    throw new DrawingShapeError("A polygon's width and height follow its points; set points instead");
  }
  if (requested.points === undefined) {
    if (current?.shape.type !== 'polygon') {
      throw new DrawingShapeError('A polygon needs points');
    }
    return { x: changes.x, y: changes.y };
  }

  const geometry = normalizePolygon(requested.points);
  const shape: CompleteDrawingShape = {
    type,
    width: geometry.width,
    height: geometry.height,
    points: geometry.points
  };
  const baseX = changes.x ?? current?.x;
  const baseY = changes.y ?? current?.y;
  return {
    x: baseX !== undefined && (changes.x !== undefined || geometry.dx !== 0) ? baseX + geometry.dx : undefined,
    y: baseY !== undefined && (changes.y !== undefined || geometry.dy !== 0) ? baseY + geometry.dy : undefined,
    shape
  };
}
