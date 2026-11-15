import { z } from 'zod';

// Deliberately tolerant, as the pre-DDD handlers were: unknown keys are ignored.
// Every command has always tested `combatId` for truthiness, so it may be empty
// or null; `activate` and `npcsOnly` were tested the same way, so any truthy
// value turns them on. A null `tokenId`, `initiative` or `formula` is passed on:
// the core reads it as "no token", "no initiative" and "the system's formula".

const combatId = z.string().nullish();
const combatantId = z.string();
const formula = z.string().nullish();

export const combatAddressRequestSchema = z.object({ combatId });

export const createCombatRequestSchema = z.object({
  sceneId: z.string().nullish(),
  activate: z.unknown().optional()
});

export const combatantAddressRequestSchema = z.object({ combatId, combatantId });

// `sceneId` and `groupId` came later and are checked as new parameters are; a
// request without `actorId` must name the token to look up.
export const addCombatantRequestSchema = z
  .object({
    combatId,
    actorId: z.string().optional(),
    tokenId: z.string().nullable().optional(),
    sceneId: z.string().nullish(),
    initiative: z.number().nullable().optional(),
    hidden: z.boolean().optional(),
    groupId: z.string().min(1).nullish()
  })
  .superRefine((request, context) => {
    const namesToken = typeof request.tokenId === 'string' && request.tokenId !== '';
    if (request.actorId === undefined && !namesToken) {
      context.addIssue({ code: 'custom', path: ['actorId'], message: 'actorId or tokenId is required' });
    }
    if (typeof request.sceneId === 'string' && request.sceneId !== '' && !namesToken) {
      context.addIssue({ code: 'custom', path: ['sceneId'], message: 'sceneId needs a tokenId' });
    }
  });

// The REST API sends the changes nested in an `updates` object. It used to be
// ignored, so whatever it holds must never fail the request: a field of the
// wrong type inside it is dropped, as is an `updates` that is not an object.
const combatantUpdatesEnvelope = z
  .object({
    initiative: z.number().nullable().optional().catch(undefined),
    defeated: z.boolean().optional().catch(undefined),
    hidden: z.boolean().optional().catch(undefined)
  })
  .optional()
  .catch(undefined);

export const updateCombatantRequestSchema = z.object({
  combatId,
  combatantId,
  initiative: z.number().nullable().optional(),
  defeated: z.boolean().optional(),
  hidden: z.boolean().optional(),
  updates: combatantUpdatesEnvelope,
  groupId: z.string().min(1).nullable().optional()
});

export const setCombatantDefeatedRequestSchema = z.object({
  combatId,
  combatantId,
  defeated: z.boolean()
});

export const setInitiativeRequestSchema = z.object({
  combatId,
  combatantId,
  initiative: z.number().nullable()
});

export const rollInitiativeRequestSchema = z.object({
  combatId,
  combatantIds: z.array(z.string()),
  formula
});

export const rollAllInitiativeRequestSchema = z.object({
  combatId,
  formula,
  npcsOnly: z.unknown().optional()
});

export type CombatAddressRequest = z.infer<typeof combatAddressRequestSchema>;
export type CreateCombatRequest = z.infer<typeof createCombatRequestSchema>;
export type CombatantAddressRequest = z.infer<typeof combatantAddressRequestSchema>;
export type AddCombatantRequest = z.infer<typeof addCombatantRequestSchema>;
export type UpdateCombatantRequest = z.infer<typeof updateCombatantRequestSchema>;
export type SetCombatantDefeatedRequest = z.infer<typeof setCombatantDefeatedRequestSchema>;
export type SetInitiativeRequest = z.infer<typeof setInitiativeRequestSchema>;
export type RollInitiativeRequest = z.infer<typeof rollInitiativeRequestSchema>;
export type RollAllInitiativeRequest = z.infer<typeof rollAllInitiativeRequestSchema>;
