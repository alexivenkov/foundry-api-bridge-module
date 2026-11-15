import type { ConeCurvature, TokenShapeKind } from '@/core/regions/domain/value-objects';

export interface RegionPoint {
  readonly x: number;
  readonly y: number;
}

export interface GridCell {
  readonly row: number;
  readonly column: number;
}

// Defaultable fields are optional: a caller may omit them, a snapshot always carries
// them. Fields the Foundry 14 model added (`anchorX`, `gridBased`, `origin`) are
// absent from the snapshots of older cores.

interface ShapeBase {
  readonly hole?: boolean | undefined;
}

export interface RectangleShape extends ShapeBase {
  readonly type: 'rectangle';
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation?: number | undefined;
  readonly anchorX?: number | undefined;
  readonly anchorY?: number | undefined;
  readonly gridBased?: boolean | undefined;
}

export interface CircleShape extends ShapeBase {
  readonly type: 'circle';
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly gridBased?: boolean | undefined;
}

export interface EllipseShape extends ShapeBase {
  readonly type: 'ellipse';
  readonly x: number;
  readonly y: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly rotation?: number | undefined;
  readonly gridBased?: boolean | undefined;
}

export interface PolygonShape extends ShapeBase {
  readonly type: 'polygon';
  readonly points: readonly RegionPoint[];
  readonly origin?: RegionPoint | null | undefined;
}

export interface ConeShape extends ShapeBase {
  readonly type: 'cone';
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly angle: number;
  readonly rotation?: number | undefined;
  readonly curvature?: ConeCurvature | undefined;
  readonly gridBased?: boolean | undefined;
}

export interface RingShape extends ShapeBase {
  readonly type: 'ring';
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly innerWidth: number;
  readonly outerWidth: number;
  readonly gridBased?: boolean | undefined;
}

export interface LineShape extends ShapeBase {
  readonly type: 'line';
  readonly x: number;
  readonly y: number;
  readonly length: number;
  readonly width: number;
  readonly rotation?: number | undefined;
  readonly gridBased?: boolean | undefined;
}

export interface TokenFootprintShape extends ShapeBase {
  readonly type: 'token';
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly shape: TokenShapeKind;
}

export interface GridShape extends ShapeBase {
  readonly type: 'grid';
  readonly cells: readonly GridCell[];
  readonly origin?: RegionPoint | null | undefined;
}

export type EmanationBaseShape =
  | RectangleShape
  | CircleShape
  | EllipseShape
  | ConeShape
  | LineShape
  | PolygonShape
  | TokenFootprintShape
  | GridShape;

export interface EmanationShape extends ShapeBase {
  readonly type: 'emanation';
  readonly base: EmanationBaseShape;
  readonly radius: number;
  readonly gridBased?: boolean | undefined;
}

export type RegionShape = EmanationBaseShape | RingShape | EmanationShape;
