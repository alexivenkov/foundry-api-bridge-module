import { ActorNotFoundError, RollResolutionError } from '@/systems/shared/domain/errors';
import type { RollOutcome } from '@/systems/shared/domain';
import type { ActorRollPort, RollSkillOptions, SkillKey } from '@/systems/dnd5e/rolls/domain';
import type { FoundryRollGame } from './foundryRollTypes';
import { toRollOutcome } from './rollOutcomeMapper';

/**
 * Anti-corruption layer between the domain ActorRollPort and the Foundry
 * dnd5e API. All dnd5e roll-API knowledge stays quarantined here.
 */
export class Dnd5eActorRollGateway implements ActorRollPort {
  constructor(private readonly game: FoundryRollGame) {}

  async rollSkill(
    actorId: string,
    skill: SkillKey,
    options: RollSkillOptions
  ): Promise<RollOutcome> {
    const actor = this.game.actors.get(actorId);
    if (!actor) {
      throw new ActorNotFoundError(actorId);
    }

    const rolls = await actor.rollSkill(
      { skill },
      { configure: false },
      { create: options.showInChat }
    );

    const roll = rolls[0];
    if (!roll) {
      throw new RollResolutionError('Skill roll returned no results');
    }

    return toRollOutcome(roll);
  }
}
