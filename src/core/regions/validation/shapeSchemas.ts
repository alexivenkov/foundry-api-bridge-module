import { z } from 'zod';
import { CONE_CURVATURES, CONE_MAX_ANGLE, TOKEN_SHAPE_KINDS } from '@/core/regions/domain';

// Pixels and degrees. Dimensions must be positive on every core (Foundry 13 rejects
// zero; Foundry 14 would silently clamp a negative one to zero). Which shape types and
// options the running core has is checked by the service.

const coordinate = z.number();
const positive = z.number().positive();
const nonNegative = z.number().nonnegative();
const hole = z.boolean().optional();
const rotation = z.number().optional();
const gridBased = z.boolean().optional();

export const regionPointSchema = z.object({ x: coordinate, y: coordinate });

const rectangleShape = z.object({
  type: z.literal('rectangle'),
  x: coordinate,
  y: coordinate,
  width: positive,
  height: positive,
  rotation,
  hole,
  anchorX: z.number().optional(),
  anchorY: z.number().optional(),
  gridBased
});

const circleShape = z.object({ type: z.literal('circle'), x: coordinate, y: coordinate, radius: positive, hole, gridBased });

const ellipseShape = z.object({
  type: z.literal('ellipse'),
  x: coordinate,
  y: coordinate,
  radiusX: positive,
  radiusY: positive,
  rotation,
  hole,
  gridBased
});

const polygonShape = z.object({
  type: z.literal('polygon'),
  points: z.array(regionPointSchema).min(3, 'must have at least 3 points'),
  hole,
  origin: regionPointSchema.nullable().optional()
});

const coneShape = z
  .object({
    type: z.literal('cone'),
    x: coordinate,
    y: coordinate,
    radius: positive,
    angle: z.number().positive().max(360),
    rotation,
    curvature: z.enum(CONE_CURVATURES).optional(),
    hole,
    gridBased
  })
  .superRefine((cone, context) => {
    const curvature = cone.curvature ?? 'round';
    const max = CONE_MAX_ANGLE[curvature];
    if (cone.angle > max) {
      context.addIssue({
        code: 'custom',
        path: ['angle'],
        message: `may not exceed ${String(max)} degrees for a ${curvature} cone`
      });
    }
  });

const ringShape = z.object({
  type: z.literal('ring'),
  x: coordinate,
  y: coordinate,
  radius: positive,
  innerWidth: nonNegative,
  outerWidth: nonNegative,
  hole,
  gridBased
});

const lineShape = z.object({
  type: z.literal('line'),
  x: coordinate,
  y: coordinate,
  length: positive,
  width: positive,
  rotation,
  hole,
  gridBased
});

const tokenShape = z.object({
  type: z.literal('token'),
  x: z.number().int(),
  y: z.number().int(),
  width: positive,
  height: positive,
  shape: z.enum(TOKEN_SHAPE_KINDS),
  hole
});

const gridShape = z.object({
  type: z.literal('grid'),
  cells: z.array(z.object({ row: z.number().int(), column: z.number().int() })),
  origin: regionPointSchema.nullable().optional(),
  hole
});

const emanationBaseShape = z.discriminatedUnion('type', [
  rectangleShape,
  circleShape,
  ellipseShape,
  coneShape,
  lineShape,
  polygonShape,
  tokenShape,
  gridShape
]);

const emanationShape = z.object({
  type: z.literal('emanation'),
  base: emanationBaseShape,
  radius: nonNegative,
  hole,
  gridBased
});

export const regionShapeSchema = z.discriminatedUnion('type', [
  rectangleShape,
  circleShape,
  ellipseShape,
  polygonShape,
  coneShape,
  ringShape,
  lineShape,
  emanationShape,
  tokenShape,
  gridShape
]);
