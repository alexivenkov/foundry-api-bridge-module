import type { HitPointsChangeOutcome, HitPointsPort } from '@/systems/dnd5e/hit-points/domain';
import type { ApplyDamageCommand, ApplyHealingCommand } from './HitPointsCommands';

export class Dnd5eHitPointsService {
  constructor(private readonly hitPoints: HitPointsPort) {}

  async applyDamage(command: ApplyDamageCommand): Promise<HitPointsChangeOutcome> {
    return this.hitPoints.applyDamage(
      { actorId: command.actorId, tokenId: command.tokenId, sceneId: command.sceneId },
      command.amount,
      command.damageType
    );
  }

  async applyHealing(command: ApplyHealingCommand): Promise<HitPointsChangeOutcome> {
    return this.hitPoints.applyHealing(
      { actorId: command.actorId, tokenId: command.tokenId, sceneId: command.sceneId },
      command.amount
    );
  }
}
