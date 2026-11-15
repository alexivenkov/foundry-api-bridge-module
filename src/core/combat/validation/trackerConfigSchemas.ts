import { z } from 'zod';
import { imageOrVideoPath } from './mediaPaths';

/** A dotted path into the actor's system data, as the tracker's attribute choices are (`attributes.hp.value`). */
const attributePath = z.string().regex(/^[\w-]+(\.[\w-]+)*$/, 'must be a dotted attribute path');

export const getCombatTrackerConfigRequestSchema = z.object({});

export const updateCombatTrackerConfigRequestSchema = z.object({
  resource: attributePath.nullable().optional(),
  skipDefeated: z.boolean().optional(),
  turnMarker: z
    .object({
      enabled: z.boolean().optional(),
      animation: z.string().min(1).optional(),
      src: imageOrVideoPath.nullable().optional(),
      disposition: z.boolean().optional()
    })
    .optional()
});

export type UpdateCombatTrackerConfigRequest = z.infer<typeof updateCombatTrackerConfigRequestSchema>;
