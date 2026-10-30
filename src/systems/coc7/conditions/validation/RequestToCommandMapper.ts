import { toActorTarget } from '@/systems/coc7/shared/validation';
import type { SetConditionCommand } from '@/systems/coc7/conditions/application';
import type { SetConditionRequest } from './ConditionRequestSchema';

export const RequestToCommandMapper = {
  toSetConditionCommand(request: SetConditionRequest): SetConditionCommand {
    return {
      target: toActorTarget(request),
      condition: request.condition,
      active: request.active,
      realTime: request.realTime,
      duration: request.duration
    };
  }
};
