import { toActorTarget } from '@/systems/coc7/shared/validation';
import type { LuckCommand } from '@/systems/coc7/luck/application';
import type { LuckRequest } from './LuckRequestSchema';

export const RequestToCommandMapper = {
  toLuckCommand(request: LuckRequest): LuckCommand {
    return { target: toActorTarget(request), action: request.action, amount: request.amount };
  }
};
