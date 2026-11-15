import { z } from 'zod';

// New commands: checked strictly, unknown keys ignored. An addressing id may
// be null or empty, and then means "the active one".

const combatId = z.string().nullish();

export const getCombatsRequestSchema = z.object({});

export const encounterAddressRequestSchema = z.object({ combatId });

export const toggleCombatSceneLinkRequestSchema = z.object({
  combatId,
  sceneId: z.string().nullish()
});

export type EncounterAddressRequest = z.infer<typeof encounterAddressRequestSchema>;
export type ToggleCombatSceneLinkRequest = z.infer<typeof toggleCombatSceneLinkRequestSchema>;
