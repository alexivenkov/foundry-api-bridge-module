import { z } from 'zod';
import { TILE_OCCLUSION_MODES, TILE_TEXTURE_FITS } from '@/core/tiles/domain';

// New commands without legacy clients: wrong types, out-of-enum values and
// out-of-range numbers are rejected; unknown keys are ignored. An addressing
// `sceneId` given as null or '' reads as absent.

const sceneIdSchema = z.string().nullish();
const tileIdSchema = z.string().min(1);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a #rrggbb color');
const unitInterval = z.number().min(0).max(1);
const documentId = z.string().regex(/^[a-zA-Z0-9]{16}$/, 'Expected a 16-character document id');
const pixelSize = z.number().min(1);

const textureSchema = z.object({
  src: z.string().min(1).nullable().optional(),
  tint: hexColor.optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  anchorX: z.number().optional(),
  anchorY: z.number().optional(),
  fit: z.enum(TILE_TEXTURE_FITS).optional(),
  alphaThreshold: unitInterval.optional(),
  offsetX: z.number().int().optional(),
  offsetY: z.number().int().optional(),
  rotation: z.number().optional()
});

const tileAttributesShape = {
  elevation: z.number().optional(),
  sort: z.number().int().optional(),
  rotation: z.number().optional(),
  alpha: unitInterval.optional(),
  hidden: z.boolean().optional(),
  locked: z.boolean().optional(),
  texture: textureSchema.optional(),
  restrictions: z.object({ light: z.boolean().optional(), weather: z.boolean().optional() }).optional(),
  occlusion: z
    .object({ modes: z.array(z.enum(TILE_OCCLUSION_MODES)).optional(), alpha: unitInterval.optional() })
    .optional(),
  video: z
    .object({ loop: z.boolean().optional(), autoplay: z.boolean().optional(), volume: unitInterval.optional() })
    .optional(),
  name: z.string().nullable().optional(),
  levels: z.array(documentId).optional()
};

export const getTilesRequestSchema = z.object({
  sceneId: sceneIdSchema
});

export const createTileRequestSchema = z.object({
  sceneId: sceneIdSchema,
  x: z.number(),
  y: z.number(),
  width: pixelSize,
  height: pixelSize,
  ...tileAttributesShape
});

export const updateTileRequestSchema = z.object({
  sceneId: sceneIdSchema,
  tileId: tileIdSchema,
  x: z.number().optional(),
  y: z.number().optional(),
  width: pixelSize.optional(),
  height: pixelSize.optional(),
  ...tileAttributesShape
});

export const deleteTileRequestSchema = z.object({
  sceneId: sceneIdSchema,
  tileId: tileIdSchema
});

export type GetTilesRequest = z.infer<typeof getTilesRequestSchema>;
export type CreateTileRequest = z.infer<typeof createTileRequestSchema>;
export type UpdateTileRequest = z.infer<typeof updateTileRequestSchema>;
export type DeleteTileRequest = z.infer<typeof deleteTileRequestSchema>;
