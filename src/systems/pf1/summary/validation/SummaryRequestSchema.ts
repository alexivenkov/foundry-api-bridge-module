import { z } from 'zod';
import { hasActorOrToken, pf1ActorTargetShape, targetRefinement } from '@/systems/pf1/shared/validation';

export const getSummaryRequestSchema = z.object({ ...pf1ActorTargetShape }).refine(hasActorOrToken, targetRefinement);

export type GetSummaryRequest = z.infer<typeof getSummaryRequestSchema>;
