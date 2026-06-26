import { ActorNotFoundError, RollResolutionError } from '@/systems/shared/domain/errors';
import type { RollOutcome } from '@/systems/shared/domain';
import type { ActorRollPort, RollOptions } from '@/systems/dnd5e/rolls/domain';
import { parseSkillKey, parseAbilityKey } from '@/systems/dnd5e/rolls/domain';
import type { FoundryD20Roll, FoundryRollActor, FoundryRollGame } from './foundryRollTypes';
import { toRollOutcome } from './rollOutcomeMapper';

/**
 * Anti-corruption layer between the neutral ActorRollPort and the Foundry
 * dnd5e API. All dnd5e roll-API knowledge — including validation of the neutral
 * string identifiers into dnd5e value-objects — stays quarantined here.
 */
export class Dnd5eActorRollGateway implements ActorRollPort {
  constructor(private readonly game: FoundryRollGame) {}

  rollSkill(actorId: string, skill: string, options: RollOptions): Promise<RollOutcome> {
    return this.rollD20(
      actorId,
      (actor) =>
        actor.rollSkill({ skill: parseSkillKey(skill) }, { configure: false }, { create: options.showInChat }),
      'Skill roll returned no results'
    );
  }

  rollSave(actorId: string, save: string, options: RollOptions): Promise<RollOutcome> {
    return this.rollD20(
      actorId,
      (actor) =>
        actor.rollSavingThrow({ ability: parseAbilityKey(save) }, { configure: false }, { create: options.showInChat }),
      'Saving throw roll returned no results'
    );
  }

  rollAbility(actorId: string, ability: string, options: RollOptions): Promise<RollOutcome> {
    return this.rollD20(
      actorId,
      (actor) =>
        actor.rollAbilityCheck({ ability: parseAbilityKey(ability) }, { configure: false }, { create: options.showInChat }),
      'Ability check roll returned no results'
    );
  }

  rollPerception(actorId: string, options: RollOptions): Promise<RollOutcome> {
    return this.rollD20(
      actorId,
      (actor) =>
        actor.rollSkill({ skill: parseSkillKey('prc') }, { configure: false }, { create: options.showInChat }),
      'Perception roll returned no results'
    );
  }

  private async rollD20(
    actorId: string,
    invoke: (actor: FoundryRollActor) => Promise<FoundryD20Roll[]>,
    noResultsMessage: string
  ): Promise<RollOutcome> {
    const actor = this.game.actors.get(actorId);
    if (!actor) {
      throw new ActorNotFoundError(actorId);
    }

    const rolls = await invoke(actor);
    const roll = rolls[0];
    if (!roll) {
      throw new RollResolutionError(noResultsMessage);
    }

    return toRollOutcome(roll);
  }
}
