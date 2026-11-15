import { z } from 'zod';
import { actorTargetRequestShape } from '@/core/shared';
import {
  effectOriginSchema,
  effectShowIconSchema,
  effectSortSchema,
  effectStatusesSchema,
  effectSystemSchema,
  effectTintSchema,
  effectTypeSchema
} from './effectAttributeSchemas';

// Deliberately tolerant, as the pre-DDD handlers were: unknown keys are ignored
// and only the types the commands declare on the wire are checked. `changes`
// and `duration` go to the core as given — its ActiveEffect schema differs
// between Foundry 13 and 14 — so they are only required to be objects, and
// their own keys are kept. `null` clears the icon or the origin.

// Every command addresses its actor by `actorId`, or by `tokenId` (+ `sceneId`)
// for one token's own actor; the request mappers read the target.

const coreData = z.record(z.string(), z.unknown());
const clearableString = z.string().nullable().optional();

export const getActorEffectsRequestSchema = z.object({
  ...actorTargetRequestShape,
  includeDisabled: z.boolean().nullish()
});

export const toggleActorStatusRequestSchema = z.object({
  ...actorTargetRequestShape,
  statusId: z.string(),
  active: z.boolean().optional(),
  overlay: z.boolean().optional()
});

// Attributes added later have no legacy clients and are validated strictly.

export const addActorEffectRequestSchema = z.object({
  ...actorTargetRequestShape,
  name: z.string(),
  img: clearableString,
  disabled: z.boolean().optional(),
  origin: clearableString,
  statuses: z.array(z.string()).optional(),
  changes: z.array(coreData).optional(),
  duration: coreData.optional(),
  type: effectTypeSchema.optional(),
  system: effectSystemSchema.optional(),
  description: z.string().optional(),
  sort: effectSortSchema.optional(),
  showIcon: effectShowIconSchema.optional()
});

export const removeActorEffectRequestSchema = z.object({
  ...actorTargetRequestShape,
  effectId: z.string()
});

export const updateActorEffectRequestSchema = z.object({
  ...actorTargetRequestShape,
  effectId: z.string(),
  name: z.string().optional(),
  img: clearableString,
  disabled: z.boolean().optional(),
  changes: z.array(coreData).optional(),
  duration: coreData.optional(),
  system: effectSystemSchema.optional(),
  description: z.string().optional(),
  sort: effectSortSchema.optional(),
  showIcon: effectShowIconSchema.optional(),
  tint: effectTintSchema.optional(),
  origin: effectOriginSchema.optional(),
  statuses: effectStatusesSchema.optional()
});

export type GetActorEffectsRequest = z.infer<typeof getActorEffectsRequestSchema>;
export type ToggleActorStatusRequest = z.infer<typeof toggleActorStatusRequestSchema>;
export type AddActorEffectRequest = z.infer<typeof addActorEffectRequestSchema>;
export type RemoveActorEffectRequest = z.infer<typeof removeActorEffectRequestSchema>;
export type UpdateActorEffectRequest = z.infer<typeof updateActorEffectRequestSchema>;
