import { z } from 'zod';
import { coc7ActorTargetShape, hasActorOrToken, targetRefinement } from '@/systems/coc7/shared/validation';

export const getActorSummaryRequestSchema = z.object({ ...coc7ActorTargetShape }).refine(hasActorOrToken, targetRefinement);

export type GetActorSummaryRequest = z.infer<typeof getActorSummaryRequestSchema>;
