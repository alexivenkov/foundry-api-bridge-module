import { toActorTarget } from '@/systems/swade/shared/validation';
import type { SetStatusCommand } from '@/systems/swade/status/application';
import type { SetStatusRequest } from './StatusRequestSchemas';

export const RequestToCommandMapper = {
  toSetStatusCommand(request: SetStatusRequest): SetStatusCommand {
    return {
      target: toActorTarget(request),
      status: request.status,
      active: request.active,
      overlay: request.overlay
    };
  }
};
