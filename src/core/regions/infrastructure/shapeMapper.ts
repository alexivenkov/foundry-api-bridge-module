import {
  CONE_CURVATURES,
  type ConeCurvature,
  type EmanationBaseShape,
  type GridCell,
  type RegionPoint,
  type RegionShape
} from '@/core/regions/domain';
import { tokenShapeFromCode, tokenShapeToCode } from './regionCodes';

// Shape data of Foundry 13.351 (rectangle, circle, ellipse, polygon) and 14.368
// (+ cone, ring, line, emanation, token, grid; `anchorX/Y`, `gridBased`, `origin`).
// Polygon points are stored flat ([x0, y0, x1, y1, …]) and grid cells as {i: row, j: column}.

type Data = Record<string, unknown>;

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function point(value: unknown): RegionPoint | null {
  if (value === null || typeof value !== 'object') {
    return null;
  }
  const { x, y } = value as Data;
  return { x: num(x), y: num(y) };
}

function pointsFromFlat(value: unknown): RegionPoint[] {
  const flat = Array.isArray(value) ? value.map((entry) => num(entry)) : [];
  const points: RegionPoint[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    points.push({ x: flat[i] ?? 0, y: flat[i + 1] ?? 0 });
  }
  return points;
}

function cellsFromOffsets(value: unknown): GridCell[] {
  return (Array.isArray(value) ? value : [])
    .filter((entry): entry is Data => entry !== null && typeof entry === 'object')
    .map((entry) => ({ row: num(entry['i']), column: num(entry['j']) }));
}

function curvature(value: unknown): ConeCurvature {
  return (CONE_CURVATURES as readonly unknown[]).includes(value) ? (value as ConeCurvature) : 'round';
}

/** Adds the keys the stored data has: the Foundry 14 options are absent from older shapes. */
function optional(data: Data, keys: readonly string[], read: (key: string) => unknown): Data {
  const out: Data = {};
  for (const key of keys) {
    if (key in data) {
      out[key] = read(key);
    }
  }
  return out;
}

function baseFromFoundry(data: Data): EmanationBaseShape | null {
  const shape = fromFoundryShape(data);
  return shape !== null && shape.type !== 'emanation' && shape.type !== 'ring' ? shape : null;
}

export function fromFoundryShape(data: Data): RegionShape | null {
  const hole = data['hole'] === true;
  const gridBased = optional(data, ['gridBased'], (key) => data[key] === true);
  switch (data['type']) {
    case 'rectangle':
      return {
        type: 'rectangle',
        x: num(data['x']),
        y: num(data['y']),
        width: num(data['width']),
        height: num(data['height']),
        rotation: num(data['rotation']),
        hole,
        ...optional(data, ['anchorX', 'anchorY'], (key) => num(data[key])),
        ...gridBased
      };
    case 'circle':
      return { type: 'circle', x: num(data['x']), y: num(data['y']), radius: num(data['radius']), hole, ...gridBased };
    case 'ellipse':
      return {
        type: 'ellipse',
        x: num(data['x']),
        y: num(data['y']),
        radiusX: num(data['radiusX']),
        radiusY: num(data['radiusY']),
        rotation: num(data['rotation']),
        hole,
        ...gridBased
      };
    case 'polygon':
      return {
        type: 'polygon',
        points: pointsFromFlat(data['points']),
        hole,
        ...optional(data, ['origin'], (key) => point(data[key]))
      };
    case 'cone':
      return {
        type: 'cone',
        x: num(data['x']),
        y: num(data['y']),
        radius: num(data['radius']),
        angle: num(data['angle']),
        rotation: num(data['rotation']),
        curvature: curvature(data['curvature']),
        hole,
        gridBased: data['gridBased'] === true
      };
    case 'ring':
      return {
        type: 'ring',
        x: num(data['x']),
        y: num(data['y']),
        radius: num(data['radius']),
        innerWidth: num(data['innerWidth']),
        outerWidth: num(data['outerWidth']),
        hole,
        gridBased: data['gridBased'] === true
      };
    case 'line':
      return {
        type: 'line',
        x: num(data['x']),
        y: num(data['y']),
        length: num(data['length']),
        width: num(data['width']),
        rotation: num(data['rotation']),
        hole,
        gridBased: data['gridBased'] === true
      };
    case 'token': {
      const kind = tokenShapeFromCode(data['shape']);
      return kind === null
        ? null
        : {
            type: 'token',
            x: num(data['x']),
            y: num(data['y']),
            width: num(data['width']),
            height: num(data['height']),
            shape: kind,
            hole
          };
    }
    case 'grid':
      return { type: 'grid', cells: cellsFromOffsets(data['offsets']), origin: point(data['origin']), hole };
    case 'emanation': {
      const base = data['base'] !== null && typeof data['base'] === 'object' ? baseFromFoundry(data['base'] as Data) : null;
      return base === null
        ? null
        : { type: 'emanation', base, radius: num(data['radius']), hole, gridBased: data['gridBased'] === true };
    }
    default:
      return null;
  }
}

/** Shapes of a type this module does not know are left out. */
export function fromFoundryShapes(shapes: readonly Data[]): RegionShape[] {
  return shapes.map(fromFoundryShape).filter((shape): shape is RegionShape => shape !== null);
}

function defined(data: Data): Data {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function originToFoundry(origin: RegionPoint | null | undefined): Data | null | undefined {
  return origin === undefined || origin === null ? origin : { x: origin.x, y: origin.y };
}

export function toFoundryShape(shape: RegionShape): Data {
  const common = { type: shape.type, hole: shape.hole };
  switch (shape.type) {
    case 'rectangle':
      return defined({
        ...common,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation,
        anchorX: shape.anchorX,
        anchorY: shape.anchorY,
        gridBased: shape.gridBased
      });
    case 'circle':
      return defined({ ...common, x: shape.x, y: shape.y, radius: shape.radius, gridBased: shape.gridBased });
    case 'ellipse':
      return defined({
        ...common,
        x: shape.x,
        y: shape.y,
        radiusX: shape.radiusX,
        radiusY: shape.radiusY,
        rotation: shape.rotation,
        gridBased: shape.gridBased
      });
    case 'polygon':
      return defined({
        ...common,
        points: shape.points.flatMap((vertex) => [vertex.x, vertex.y]),
        origin: originToFoundry(shape.origin)
      });
    case 'cone':
      return defined({
        ...common,
        x: shape.x,
        y: shape.y,
        radius: shape.radius,
        angle: shape.angle,
        rotation: shape.rotation,
        curvature: shape.curvature,
        gridBased: shape.gridBased
      });
    case 'ring':
      return defined({
        ...common,
        x: shape.x,
        y: shape.y,
        radius: shape.radius,
        innerWidth: shape.innerWidth,
        outerWidth: shape.outerWidth,
        gridBased: shape.gridBased
      });
    case 'line':
      return defined({
        ...common,
        x: shape.x,
        y: shape.y,
        length: shape.length,
        width: shape.width,
        rotation: shape.rotation,
        gridBased: shape.gridBased
      });
    case 'token':
      return defined({
        ...common,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        shape: tokenShapeToCode(shape.shape)
      });
    case 'grid':
      return defined({
        ...common,
        offsets: shape.cells.map((cell) => ({ i: cell.row, j: cell.column })),
        origin: originToFoundry(shape.origin)
      });
    case 'emanation':
      return defined({ ...common, base: toFoundryShape(shape.base), radius: shape.radius, gridBased: shape.gridBased });
  }
}
