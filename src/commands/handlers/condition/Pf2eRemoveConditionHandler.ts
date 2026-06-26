import type { ConditionSlugParams, ConditionRemovalResult } from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import { requireSystem } from '@/systems';
import {
  createPf2eConditionService,
  Pf2eConditionGateway,
  getPf2eConditionGame,
  conditionSlugRequestSchema,
  RequestToCommandMapper
} from '@/systems/pf2e/conditions';

export async function pf2eRemoveConditionHandler(
  params: ConditionSlugParams
): Promise<ConditionRemovalResult> {
  requireSystem('pf2e', 'pf2e/remove-condition');

  const parsed = conditionSlugRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toConditionSlugCommand(parsed.data);

  const gateway = new Pf2eConditionGateway(getPf2eConditionGame());
  const service = createPf2eConditionService({ conditions: gateway });

  const outcome = await service.removeCondition(command);
  return {
    actorId: outcome.actorId,
    slug: outcome.slug,
    removed: outcome.removed
  };
}
