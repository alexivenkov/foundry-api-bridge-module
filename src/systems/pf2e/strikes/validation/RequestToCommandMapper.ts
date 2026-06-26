import type {
  ListStrikesCommand,
  RollStrikeCommand,
  RollStrikeDamageCommand
} from '@/systems/pf2e/strikes/application';
import type {
  ListStrikesRequest,
  RollStrikeRequest,
  RollStrikeDamageRequest
} from './StrikeRequestSchemas';

export const RequestToCommandMapper = {
  toListStrikesCommand(request: ListStrikesRequest): ListStrikesCommand {
    return { actorId: request.actorId };
  },
  toRollStrikeCommand(request: RollStrikeRequest): RollStrikeCommand {
    return {
      actorId: request.actorId,
      slug: request.slug,
      mapIncrease: request.mapIncrease ?? 0,
      showInChat: request.showInChat ?? false
    };
  },
  toRollStrikeDamageCommand(request: RollStrikeDamageRequest): RollStrikeDamageCommand {
    return {
      actorId: request.actorId,
      slug: request.slug,
      critical: request.critical ?? false,
      showInChat: request.showInChat ?? false
    };
  }
};
