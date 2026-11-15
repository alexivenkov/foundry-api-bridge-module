import { z } from 'zod';
import {
  REGION_HIGHLIGHT_MODES,
  REGION_RESTRICTION_TYPES,
  REGION_VISIBILITIES
} from '@/core/regions/domain';
import { regionShapeSchema } from './shapeSchemas';

// New commands without legacy clients: wrong types, values outside an enum and
// numbers out of range are rejected; unknown keys are ignored. An addressing
// `sceneId` given as null or '' reads as absent (the active scene).

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const sceneId = z.string().nullish();
const id = z.string().min(1);
const nonBlank = z.string().refine((value) => value.trim().length > 0, 'may not be blank');
const elevationBound = z.number().nullable().optional();

const regionAttributesShape = {
  color: z.string().regex(HEX_COLOR, 'must be a #rrggbb color').optional(),
  shapes: z.array(regionShapeSchema).optional(),
  elevation: z
    .object({ bottom: elevationBound, top: elevationBound, topInclusive: z.boolean().optional() })
    .optional(),
  visibility: z.enum(REGION_VISIBILITIES).optional(),
  locked: z.boolean().optional(),
  levelIds: z.array(id).optional(),
  restriction: z
    .object({
      enabled: z.boolean().optional(),
      type: z.enum(REGION_RESTRICTION_TYPES).optional(),
      priority: z.number().int().nonnegative().optional()
    })
    .optional(),
  attachedTokenId: id.nullable().optional(),
  highlightMode: z.enum(REGION_HIGHLIGHT_MODES).optional(),
  displayMeasurements: z.boolean().optional(),
  hidden: z.boolean().optional()
};

export const getRegionsRequestSchema = z.object({ sceneId });

export const getRegionRequestSchema = z.object({ sceneId, regionId: id });

export const createRegionRequestSchema = z.object({
  sceneId,
  name: nonBlank,
  ...regionAttributesShape
});

export const updateRegionRequestSchema = z.object({
  sceneId,
  regionId: id,
  name: nonBlank.optional(),
  ...regionAttributesShape
});

export const deleteRegionRequestSchema = getRegionRequestSchema;

export const getRegionTokensRequestSchema = getRegionRequestSchema;

export const testRegionPointRequestSchema = z.object({
  sceneId,
  regionId: id,
  x: z.number(),
  y: z.number(),
  elevation: z.number().optional()
});

export const createRegionBehaviorRequestSchema = z.object({
  sceneId,
  regionId: id,
  type: id,
  name: z.string().optional(),
  disabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional()
});

export const updateRegionBehaviorRequestSchema = z.object({
  sceneId,
  regionId: id,
  behaviorId: id,
  type: id.optional(),
  name: z.string().optional(),
  disabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional()
});

export const deleteRegionBehaviorRequestSchema = z.object({ sceneId, regionId: id, behaviorId: id });

export type GetRegionsRequest = z.infer<typeof getRegionsRequestSchema>;
export type GetRegionRequest = z.infer<typeof getRegionRequestSchema>;
export type CreateRegionRequest = z.infer<typeof createRegionRequestSchema>;
export type UpdateRegionRequest = z.infer<typeof updateRegionRequestSchema>;
export type DeleteRegionRequest = z.infer<typeof deleteRegionRequestSchema>;
export type GetRegionTokensRequest = z.infer<typeof getRegionTokensRequestSchema>;
export type TestRegionPointRequest = z.infer<typeof testRegionPointRequestSchema>;
export type CreateRegionBehaviorRequest = z.infer<typeof createRegionBehaviorRequestSchema>;
export type UpdateRegionBehaviorRequest = z.infer<typeof updateRegionBehaviorRequestSchema>;
export type DeleteRegionBehaviorRequest = z.infer<typeof deleteRegionBehaviorRequestSchema>;
