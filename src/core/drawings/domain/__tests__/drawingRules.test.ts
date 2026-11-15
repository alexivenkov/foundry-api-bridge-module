import { DrawingShapeError } from '../errors/DrawingShapeError';
import type { DrawingShape } from '../model/Drawing';
import { findUnsupportedDrawingFeature } from '../rules/drawingFeatures';
import { normalizePolygon, planDrawingShape, type PlacedShape } from '../rules/drawingShape';
import { DRAWING_DEFAULTS, findDrawingVisibilityProblem, type DrawingVisibilityState } from '../rules/drawingVisibility';

const rectangle = (width: number, height: number): DrawingShape => ({ type: 'rectangle', width, height, points: [] });

function state(overrides: Partial<DrawingVisibilityState> = {}): DrawingVisibilityState {
  return { ...DRAWING_DEFAULTS, shape: rectangle(200, 100), text: null, ...overrides };
}

describe('normalizePolygon (port of Drawing.normalizeShape)', () => {
  it('moves the bounding box to (0, 0) and measures it', () => {
    expect(normalizePolygon([10, 20, 50, 20, 50, 60])).toEqual({
      dx: 10,
      dy: 20,
      width: 40,
      height: 40,
      points: [0, 0, 40, 0, 40, 40]
    });
  });

  it('keeps already normalized points and fractional coordinates', () => {
    expect(normalizePolygon([0, 10, 30, 0, 90, 40, 0, 10])).toEqual({
      dx: 0,
      dy: 0,
      width: 90,
      height: 40,
      points: [0, 10, 30, 0, 90, 40, 0, 10]
    });
    expect(normalizePolygon([0.5, 0.25, 5.5, 9.75]).points).toEqual([0, 0, 5, 9.5]);
  });

  it('drops a vertex that repeats the previous one, as the core does', () => {
    expect(normalizePolygon([0, 0, 0, 0, 10, 10, 10, 10, 0, 0]).points).toEqual([0, 0, 10, 10, 0, 0]);
    expect(normalizePolygon([5, 5, 5, 5])).toEqual({ dx: 5, dy: 5, width: 0, height: 0, points: [0, 0] });
  });
});

describe('planDrawingShape', () => {
  const polygonAt = (x: number, y: number): PlacedShape => ({
    x,
    y,
    shape: { type: 'polygon', width: 40, height: 40, points: [0, 0, 40, 0, 40, 40] }
  });

  it('plans a new rectangle without points', () => {
    expect(planDrawingShape(null, { x: 5, y: 6, shape: { type: 'ellipse', width: 30, height: 20 } })).toEqual({
      x: 5,
      y: 6,
      shape: { type: 'ellipse', width: 30, height: 20, points: [] }
    });
  });

  it('normalizes a new polygon and shifts its position', () => {
    expect(planDrawingShape(null, { x: 100, y: 200, shape: { type: 'polygon', points: [10, 20, 50, 20, 50, 60] } })).toEqual({
      x: 110,
      y: 220,
      shape: { type: 'polygon', width: 40, height: 40, points: [0, 0, 40, 0, 40, 40] }
    });
  });

  it('shifts the current position when only the points of a polygon change', () => {
    expect(planDrawingShape(polygonAt(100, 100), { shape: { points: [-10, 0, 30, 0, 30, 30] } })).toEqual({
      x: 90,
      y: undefined,
      shape: { type: 'polygon', width: 40, height: 30, points: [0, 0, 40, 0, 40, 30] }
    });
  });

  it('turns a polygon into a rectangle of its bounds, dropping the points', () => {
    expect(planDrawingShape(polygonAt(0, 0), { shape: { type: 'rectangle' } }).shape).toEqual(rectangle(40, 40));
  });

  it('leaves the shape alone when it is not part of the change', () => {
    expect(planDrawingShape(polygonAt(0, 0), { x: 3 })).toEqual({ x: 3, y: undefined });
  });

  it.each([
    ['points on a rectangle', null, { type: 'rectangle' as const, width: 5, height: 5, points: [0, 0, 1, 1] }, 'Only a polygon takes points'],
    ['a polygon without points', { x: 0, y: 0, shape: rectangle(10, 10) }, { type: 'polygon' as const }, 'A polygon needs points'],
    ['a size on a polygon', polygonAt(0, 0), { width: 10 }, "A polygon's width and height follow its points; set points instead"],
    [
      'a resize of a shape the canvas does not draw',
      { x: 0, y: 0, shape: { type: null, width: 0, height: 0, points: [] } },
      { width: 10 },
      'The drawing has a shape the canvas does not draw; set shape.type to replace it'
    ]
  ])('refuses %s', (_label, current, shape, message) => {
    expect(() => planDrawingShape(current, { shape })).toThrow(new DrawingShapeError(message));
  });
});

describe('findDrawingVisibilityProblem (rule of BaseDrawing._validateVisibleContent)', () => {
  it('accepts the core defaults: an 8 px line on a large enough shape', () => {
    expect(findDrawingVisibilityProblem(state())).toBeNull();
    expect(findDrawingVisibilityProblem(state({ shape: rectangle(9, 9) }))).toBeNull();
  });

  it('accepts a text label without line or fill', () => {
    expect(findDrawingVisibilityProblem(state({ strokeWidth: 0, text: 'Tavern' }))).toBeNull();
  });

  it('refuses a rectangle or ellipse not larger than its stroke width', () => {
    expect(findDrawingVisibilityProblem(state({ shape: rectangle(8, 100) }))).toBe(
      'A rectangle must be wider and taller than its stroke width (8 px)'
    );
    expect(findDrawingVisibilityProblem(state({ shape: { ...rectangle(100, 4), type: 'ellipse' } }))).toBe(
      'An ellipse must be wider and taller than its stroke width (8 px)'
    );
  });

  it('refuses a polygon with fewer than two distinct points', () => {
    expect(findDrawingVisibilityProblem(state({ shape: { type: 'polygon', width: 0, height: 0, points: [0, 0, 0, 0] } }))).toBe(
      'A polygon needs at least two distinct points'
    );
    expect(findDrawingVisibilityProblem(state({ shape: { type: 'polygon', width: 10, height: 10, points: [0, 0] } }))).toBe(
      'A polygon needs at least two distinct points'
    );
  });

  it.each([
    ['no line, fill or text', { strokeWidth: 0 }],
    ['an empty text', { strokeWidth: 0, text: '' }],
    ['a transparent text', { strokeWidth: 0, text: 'Hi', textAlpha: 0 }],
    ['a transparent fill', { strokeWidth: 0, fillType: 'solid' as const, fillAlpha: 0 }],
    ['a transparent line', { strokeAlpha: 0 }]
  ])('refuses a drawing with %s', (_label, overrides) => {
    expect(findDrawingVisibilityProblem(state(overrides))).toBe(
      'A drawing needs visible text, a visible fill or a visible stroke'
    );
  });

  it('accepts a visible fill alone', () => {
    expect(findDrawingVisibilityProblem(state({ strokeWidth: 0, fillType: 'pattern' }))).toBeNull();
  });
});

describe('findUnsupportedDrawingFeature', () => {
  const thirteen = { supported: true, names: false, levels: false };

  it('refuses drawings before Foundry 12 and names / levels before 14', () => {
    expect(findUnsupportedDrawingFeature({ ...thirteen, supported: false })).toBe(
      'Drawing commands require Foundry 12 or newer'
    );
    expect(findUnsupportedDrawingFeature(thirteen, { name: 'Label' })).toBe('Drawing names require Foundry 14 or newer');
    expect(findUnsupportedDrawingFeature(thirteen, { levels: [] })).toBe('Drawing levels require Foundry 14 or newer');
    expect(findUnsupportedDrawingFeature(thirteen, { x: 1 })).toBeNull();
    expect(findUnsupportedDrawingFeature({ supported: true, names: true, levels: true }, { name: null })).toBeNull();
  });
});
