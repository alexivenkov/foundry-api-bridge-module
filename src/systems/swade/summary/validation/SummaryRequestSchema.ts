import { z } from 'zod';
import { swadeActorTargetShape, hasActorOrToken, targetRefinement } from '@/systems/swade/shared/validation';

export const getActorSummaryRequestSchema = z
  .object({ ...swadeActorTargetShape })
  .refine(hasActorOrToken, targetRefinement);

export type GetActorSummaryRequest = z.infer<typeof getActorSummaryRequestSchema>;
