import type { ApplyDamageCommand, ApplyHealingCommand } from '@/systems/dnd5e/hit-points/application';
import type { ApplyDamageRequest } from './ApplyDamageRequestSchema';
import type { ApplyHealingRequest } from './ApplyHealingRequestSchema';

export const RequestToCommandMapper = {
  toApplyDamageCommand(request: ApplyDamageRequest): ApplyDamageCommand {
    return {
      actorId: request.actorId,
      tokenId: request.tokenId,
      sceneId: request.sceneId,
      amount: request.amount,
      damageType: request.type
    };
  },
  toApplyHealingCommand(request: ApplyHealingRequest): ApplyHealingCommand {
    return {
      actorId: request.actorId,
      tokenId: request.tokenId,
      sceneId: request.sceneId,
      amount: request.amount
    };
  }
};
