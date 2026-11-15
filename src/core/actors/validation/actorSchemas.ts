import { z } from 'zod';
import { actorTargetRequestShape } from '@/core/shared';

// Deliberately tolerant, as the pre-DDD handlers were: unknown keys are ignored
// and only the types the commands declare on the wire are checked. `system` is
// opaque game-system data. `null` clears the folder or the image; the core
// decides what it accepts.

const systemData = z.record(z.string(), z.unknown());
const clearableString = z.string().nullable().optional();

export const getActorRequestSchema = z.object({
  actorId: z.string()
});

export const createActorRequestSchema = z.object({
  name: z.string(),
  type: z.string(),
  folder: clearableString,
  img: clearableString,
  system: systemData.optional()
});

// The actor is addressed by `actorId`, or by `tokenId` (+ `sceneId`) for one
// token's own actor; the request mapper reads the target.
export const updateActorRequestSchema = z.object({
  ...actorTargetRequestShape,
  name: z.string().optional(),
  img: clearableString,
  folder: clearableString,
  system: systemData.optional()
});

export const deleteActorRequestSchema = z.object({
  actorId: z.string()
});

export type GetActorRequest = z.infer<typeof getActorRequestSchema>;
export type CreateActorRequest = z.infer<typeof createActorRequestSchema>;
export type UpdateActorRequest = z.infer<typeof updateActorRequestSchema>;
export type DeleteActorRequest = z.infer<typeof deleteActorRequestSchema>;
