export { DRAWING_FILL_TYPES, DRAWING_SHAPE_TYPES } from './model/Drawing';
export type {
  Drawing,
  DrawingChanges,
  DrawingDraft,
  DrawingFill,
  DrawingFillType,
  DrawingShape,
  DrawingShapeChanges,
  DrawingShapeType,
  DrawingStroke,
  DrawingText
} from './model/Drawing';
export { normalizePolygon, planDrawingShape } from './rules/drawingShape';
export type {
  CompleteDrawingShape,
  PlacedShape,
  PlannedShape,
  PolygonGeometry,
  ShapePlacementChanges
} from './rules/drawingShape';
export { DRAWING_DEFAULTS, findDrawingVisibilityProblem } from './rules/drawingVisibility';
export type { DrawingVisibilityState } from './rules/drawingVisibility';
export { findUnsupportedDrawingFeature } from './rules/drawingFeatures';
export type { DrawingCapabilities } from './rules/drawingFeatures';
export { DrawingNotFoundError } from './errors/DrawingNotFoundError';
export { DrawingCreationFailedError } from './errors/DrawingCreationFailedError';
export { DrawingAuthorNotFoundError } from './errors/DrawingAuthorNotFoundError';
export { DrawingShapeError } from './errors/DrawingShapeError';
export { InvisibleDrawingError } from './errors/InvisibleDrawingError';
export type { DrawingAuthors, DrawingStore } from './ports/DrawingStore';
