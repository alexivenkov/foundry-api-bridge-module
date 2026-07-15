import { z } from 'zod';
import { makeRangeSchema, folderReferenceSchema } from '@/kernel/validation';
import { actorTypeArraySchema } from './ActorTypeSchema';
import { creatureTypeArraySchema } from './CreatureTypeSchema';
import { sizeArraySchema } from './SizeSchema';
import { dispositionArraySchema } from './DispositionSchema';
import { challengeRatingRangeSchema } from './ChallengeRatingRangeSchema';
import { abilityScoresSchema } from './AbilityScoresSchema';

const integerNonNegativeRange = makeRangeSchema({ integerOnly: true, minBound: 0 });

export const filterActorsRequestSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'name must be non-empty after trim'))
    .optional(),
  type: actorTypeArraySchema.optional(),
  creatureType: creatureTypeArraySchema.optional(),
  size: sizeArraySchema.optional(),
  disposition: dispositionArraySchema.optional(),
  hasPlayerOwner: z.boolean().optional(),
  cr: challengeRatingRangeSchema.optional(),
  level: integerNonNegativeRange.optional(),
  maxHp: integerNonNegativeRange.optional(),
  currentHp: integerNonNegativeRange.optional(),
  ac: integerNonNegativeRange.optional(),
  abilities: abilityScoresSchema.optional(),
  folder: folderReferenceSchema.optional(),
  limit: z.number().int().min(1).max(200).optional(),
  offset: z.number().int().min(0).optional()
});

export type FilterActorsRequest = z.infer<typeof filterActorsRequestSchema>;
