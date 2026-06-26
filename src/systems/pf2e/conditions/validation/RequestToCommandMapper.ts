import type {
  SetConditionCommand,
  ConditionSlugCommand,
  GetConditionsCommand
} from '@/systems/pf2e/conditions/application';
import type {
  SetConditionRequest,
  ConditionSlugRequest,
  GetConditionsRequest
} from './ConditionRequestSchemas';

export const RequestToCommandMapper = {
  toSetConditionCommand(request: SetConditionRequest): SetConditionCommand {
    return {
      actorId: request.actorId,
      slug: request.slug,
      value: request.value
    };
  },
  toConditionSlugCommand(request: ConditionSlugRequest): ConditionSlugCommand {
    return {
      actorId: request.actorId,
      slug: request.slug
    };
  },
  toGetConditionsCommand(request: GetConditionsRequest): GetConditionsCommand {
    return {
      actorId: request.actorId
    };
  }
};
