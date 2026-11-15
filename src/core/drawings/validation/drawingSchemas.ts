import { z } from 'zod';
import { DRAWING_FILL_TYPES, DRAWING_SHAPE_TYPES } from '@/core/drawings/domain';

// New commands without legacy clients: wrong types, out-of-enum values and
// out-of-range numbers are rejected; unknown keys are ignored. An addressing
// `sceneId` given as null or '' reads as absent. Ranges are the core's
// (`BaseDrawing`, Foundry 13.351 and 14.368).

const sceneIdSchema = z.string().nullish();
const drawingIdSchema = z.string().min(1);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a #rrggbb color');
const unitInterval = z.number().min(0).max(1);
const documentId = z.string().regex(/^[a-zA-Z0-9]{16}$/, 'Expected a 16-character document id');
const pixelSize = z.number().min(1);
const polygonPoints = z
  .array(z.number())
  .min(4)
  .refine((points) => points.length % 2 === 0, 'Expected an even number of coordinates: [x0, y0, x1, y1, …]');

const createShapeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.enum(['rectangle', 'ellipse']), width: pixelSize, height: pixelSize }),
  z.object({ type: z.literal('polygon'), points: polygonPoints })
]);

const updateShapeSchema = z.object({
  type: z.enum(DRAWING_SHAPE_TYPES).optional(),
  width: pixelSize.optional(),
  height: pixelSize.optional(),
  points: polygonPoints.optional()
});

const drawingAttributesShape = {
  elevation: z.number().optional(),
  sort: z.number().int().optional(),
  rotation: z.number().optional(),
  bezierFactor: z.number().min(0).max(0.5).optional(),
  fill: z
    .object({
      type: z.enum(DRAWING_FILL_TYPES).optional(),
      color: hexColor.optional(),
      alpha: unitInterval.optional(),
      texture: z.string().min(1).nullable().optional()
    })
    .optional(),
  stroke: z
    .object({
      width: z.number().int().min(0).optional(),
      color: hexColor.optional(),
      alpha: unitInterval.optional()
    })
    .optional(),
  text: z
    .object({
      content: z.string().nullable().optional(),
      fontFamily: z.string().min(1).nullable().optional(),
      fontSize: z.number().int().min(8).max(256).optional(),
      color: hexColor.optional(),
      alpha: unitInterval.optional()
    })
    .optional(),
  hidden: z.boolean().optional(),
  locked: z.boolean().optional(),
  interface: z.boolean().optional(),
  name: z.string().nullable().optional(),
  levels: z.array(documentId).optional()
};

export const getDrawingsRequestSchema = z.object({
  sceneId: sceneIdSchema
});

export const createDrawingRequestSchema = z.object({
  sceneId: sceneIdSchema,
  x: z.number(),
  y: z.number(),
  shape: createShapeSchema,
  authorId: documentId.optional(),
  ...drawingAttributesShape
});

export const updateDrawingRequestSchema = z.object({
  sceneId: sceneIdSchema,
  drawingId: drawingIdSchema,
  x: z.number().optional(),
  y: z.number().optional(),
  shape: updateShapeSchema.optional(),
  ...drawingAttributesShape
});

export const deleteDrawingRequestSchema = z.object({
  sceneId: sceneIdSchema,
  drawingId: drawingIdSchema
});

export type GetDrawingsRequest = z.infer<typeof getDrawingsRequestSchema>;
export type CreateDrawingRequest = z.infer<typeof createDrawingRequestSchema>;
export type UpdateDrawingRequest = z.infer<typeof updateDrawingRequestSchema>;
export type DeleteDrawingRequest = z.infer<typeof deleteDrawingRequestSchema>;
