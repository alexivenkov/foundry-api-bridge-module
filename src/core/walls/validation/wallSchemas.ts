import { z } from 'zod';
import { DOOR_STATES, DOOR_TYPES, WALL_DIRECTIONS, WALL_PROXIMITIES, WALL_RESTRICTIONS } from '@/core/walls/domain';

// Deliberately tolerant, as the pre-DDD handlers were: unknown keys are ignored,
// and so is an attribute value outside its enum — the REST API forwards these
// strings unchecked, and rejecting them here would break its callers. The
// threshold, door sound and animation fields have no legacy callers and are
// validated strictly; ranges follow `BaseWall` (Foundry 13–14), but a value the
// core would clamp or round is rejected instead.

const STRENGTH_STEP = 0.05;

function isStrengthStep(value: number): boolean {
  const steps = value / STRENGTH_STEP;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

const senseThresholdSchema = z.object({
  proximity: z.enum(WALL_PROXIMITIES).nullable().optional(),
  distance: z.number().positive().nullable().optional()
});

const thresholdSchema = z.object({
  light: senseThresholdSchema.optional(),
  sight: senseThresholdSchema.optional(),
  sound: senseThresholdSchema.optional(),
  attenuation: z.boolean().optional()
});

const doorAnimationSchema = z.object({
  type: z.string().min(1).optional(),
  reverse: z.boolean().optional(),
  double: z.boolean().optional(),
  duration: z.number().int().positive().optional(),
  flip: z.boolean().optional(),
  strength: z.number().min(0).max(2).refine(isStrengthStep, 'must be a multiple of 0.05').optional(),
  texture: z.string().min(1).nullable().optional()
});

const wallDetailsShape = {
  threshold: thresholdSchema.optional(),
  doorSound: z.string().nullable().optional(),
  animation: doorAnimationSchema.nullable().optional()
};

const segmentSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

const wallAttributesShape = {
  door: z.enum(DOOR_TYPES).optional().catch(undefined),
  doorState: z.enum(DOOR_STATES).optional().catch(undefined),
  move: z.enum(WALL_RESTRICTIONS).optional().catch(undefined),
  sense: z.enum(WALL_RESTRICTIONS).optional().catch(undefined),
  sound: z.enum(WALL_RESTRICTIONS).optional().catch(undefined),
  light: z.enum(WALL_RESTRICTIONS).optional().catch(undefined),
  dir: z.enum(WALL_DIRECTIONS).optional().catch(undefined)
};

export const getWallsRequestSchema = z.object({
  sceneId: z.string().optional()
});

export const createWallRequestSchema = z.object({
  sceneId: z.string().optional(),
  c: segmentSchema,
  ...wallAttributesShape,
  ...wallDetailsShape
});

export const updateWallRequestSchema = z.object({
  sceneId: z.string().optional(),
  wallId: z.string(),
  c: segmentSchema.optional(),
  ...wallAttributesShape,
  ...wallDetailsShape
});

export const deleteWallRequestSchema = z.object({
  sceneId: z.string().optional(),
  wallId: z.string()
});

export const setDoorStateRequestSchema = z.object({
  sceneId: z.string().nullish(),
  wallId: z.string(),
  state: z.number()
});

export type GetWallsRequest = z.infer<typeof getWallsRequestSchema>;
export type CreateWallRequest = z.infer<typeof createWallRequestSchema>;
export type UpdateWallRequest = z.infer<typeof updateWallRequestSchema>;
export type DeleteWallRequest = z.infer<typeof deleteWallRequestSchema>;
export type SetDoorStateRequest = z.infer<typeof setDoorStateRequestSchema>;
