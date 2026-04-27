import { z } from 'zod';
import { ActorType } from '@/filtering/actors/domain/value-objects';

const VALID_ACTOR_TYPES: ReadonlySet<string> = new Set<string>(Object.values(ActorType));

export const actorTypeArraySchema = z
  .array(
    z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .superRefine((val, ctx) => {
        if (!VALID_ACTOR_TYPES.has(val)) {
          ctx.addIssue({
            code: 'custom',
            message: `unknown actorType: '${val}'`
          });
        }
      })
  )
  .nonempty({ message: 'type array must not be empty' });
