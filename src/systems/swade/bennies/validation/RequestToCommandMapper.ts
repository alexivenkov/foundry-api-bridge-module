import { toActorTarget } from '@/systems/swade/shared/validation';
import type { BenniesCommand } from '@/systems/swade/bennies/application';
import type { BenniesRequest } from './BenniesRequestSchema';

export const RequestToCommandMapper = {
  toBenniesCommand(request: BenniesRequest): BenniesCommand {
    return {
      target: request.gm === true ? undefined : toActorTarget(request),
      action: request.action
    };
  }
};
