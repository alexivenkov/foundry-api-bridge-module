import type { DrawingFillType, DrawingShape } from '@/core/drawings/domain/model/Drawing';

export interface DrawingVisibilityState {
  readonly shape: DrawingShape;
  readonly strokeWidth: number;
  readonly strokeAlpha: number;
  readonly fillType: DrawingFillType;
  readonly fillAlpha: number;
  readonly text: string | null;
  readonly textAlpha: number;
}

/** The initial values of the `BaseDrawing` schema that the visibility rule reads (Foundry 13.351 and 14.368). */
export const DRAWING_DEFAULTS = {
  strokeWidth: 8,
  strokeAlpha: 1,
  fillType: 'none',
  fillAlpha: 0.5,
  textAlpha: 1
} as const satisfies Omit<DrawingVisibilityState, 'shape' | 'text'>;

function shapeProblem(state: DrawingVisibilityState): string | null {
  const { shape, strokeWidth } = state;
  switch (shape.type) {
    case 'rectangle':
    case 'ellipse':
      return shape.width <= strokeWidth || shape.height <= strokeWidth
        ? `${shape.type === 'ellipse' ? 'An ellipse' : 'A rectangle'} must be wider and taller than its stroke width (${String(strokeWidth)} px)`
        : null;
    case 'polygon':
      return (shape.width === 0 && shape.height === 0) || shape.points.length < 4
        ? 'A polygon needs at least two distinct points'
        : null;
    case null:
      return null;
  }
}

/**
 * The rule of `BaseDrawing._validateVisibleContent` (Foundry 13.351 and
 * 14.368): the shape is not empty and shows text, a fill or a line. Unlike the
 * core, a drawing without any text does not count as showing text.
 */
export function findDrawingVisibilityProblem(state: DrawingVisibilityState): string | null {
  const problem = shapeProblem(state);
  if (problem !== null) {
    return problem;
  }
  const hasText = state.text !== null && state.text !== '' && state.textAlpha > 0;
  const hasFill = state.fillType !== 'none' && state.fillAlpha > 0;
  const hasLine = state.strokeWidth > 0 && state.strokeAlpha > 0;
  return hasText || hasFill || hasLine ? null : 'A drawing needs visible text, a visible fill or a visible stroke';
}
