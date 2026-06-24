import { RollResolutionError } from '@/systems/shared/domain/errors';
import type { RollOutcome } from '@/systems/shared/domain';
import type { ItemRollPort, AttackRollOptions, DamageRollOptions } from '@/systems/dnd5e/item-rolls/domain';
import type { AttackRollConfig, DamageRollConfig, FoundryItemRollGame } from './foundryItemRollTypes';
import { resolveAttackActivity } from './attackActivityResolver';
import { toRollOutcome, toDamageRollOutcome } from './rollOutcomeMapper';

/**
 * Anti-corruption layer between the domain ItemRollPort and the Foundry dnd5e
 * activity API. All dnd5e attack/damage-roll knowledge stays quarantined here.
 */
export class Dnd5eItemRollGateway implements ItemRollPort {
  constructor(private readonly game: FoundryItemRollGame) {}

  async rollAttack(
    actorId: string,
    itemId: string,
    options: AttackRollOptions
  ): Promise<RollOutcome> {
    const activity = resolveAttackActivity(this.game, actorId, itemId);

    const config: AttackRollConfig = {};
    if (options.advantage) {
      config.advantage = true;
    }
    if (options.disadvantage) {
      config.disadvantage = true;
    }

    const rolls = await activity.rollAttack(
      config,
      { configure: false },
      { create: options.showInChat }
    );

    if (!rolls || rolls.length === 0) {
      throw new RollResolutionError('Attack roll returned no results');
    }

    const roll = rolls[0];
    if (!roll) {
      throw new RollResolutionError('Attack roll returned no results');
    }

    return toRollOutcome(roll);
  }

  async rollDamage(
    actorId: string,
    itemId: string,
    options: DamageRollOptions
  ): Promise<RollOutcome> {
    const activity = resolveAttackActivity(this.game, actorId, itemId);

    const config: DamageRollConfig = {};
    if (options.critical) {
      config.isCritical = true;
    }

    const rolls = await activity.rollDamage(
      config,
      { configure: false },
      { create: options.showInChat }
    );

    if (!rolls || rolls.length === 0) {
      throw new RollResolutionError('Damage roll returned no results');
    }

    const roll = rolls[0];
    if (!roll) {
      throw new RollResolutionError('Damage roll returned no results');
    }

    return toDamageRollOutcome(roll);
  }
}
