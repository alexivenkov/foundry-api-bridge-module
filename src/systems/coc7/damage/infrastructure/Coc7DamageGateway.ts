import { ValidationError } from '@/systems/shared/domain/errors';
import type { Coc7ActorTarget } from '@/systems/coc7/shared/domain';
import { hasAttribs, readCoc7Conditions, resolveCoc7Actor, type FoundryCoc7Game } from '@/systems/coc7/shared/infrastructure';
import type { ApplyDamageOptions, Coc7ApplyDamageOutcome, Coc7DamagePort } from '@/systems/coc7/damage/domain';

/**
 * Anti-corruption layer over CoC7 hit points (CoC7 8.16). Damage goes through
 * the system's `actor.dealDamage`, which subtracts armor, sets Major Wound at
 * half the maximum, Unconscious / Dying at 0 and Dead at the maximum (or
 * posts a CON check under the pulp rule). Healing goes through `setHp`,
 * clamped at the maximum. Vehicles keep `system.stats.hp` and cannot be hit here.
 */
export class Coc7DamageGateway implements Coc7DamagePort {
  constructor(private readonly game: FoundryCoc7Game) {}

  async applyDamage(target: Coc7ActorTarget, options: ApplyDamageOptions): Promise<Coc7ApplyDamageOutcome> {
    const { actor, tokenId } = resolveCoc7Actor(this.game, target);
    if (!hasAttribs(actor)) {
      throw new ValidationError(`Actor has no hit points: ${actor.name}`);
    }
    const hpBefore = actor.system.attribs.hp.value ?? 0;
    const hpMax = actor.system.attribs.hp.max ?? 0;

    let applied = 0;
    let armorAbsorbed = 0;
    let healed = 0;
    if (options.damage !== undefined) {
      applied = await actor.dealDamage(options.damage, { armor: options.armor ?? null, ignoreArmor: options.ignoreArmor });
      armorAbsorbed = Math.max(0, options.damage - applied);
    } else if (options.heal !== undefined) {
      const after = await actor.setHp(hpBefore + options.heal);
      healed = Math.max(0, after - hpBefore);
    }

    const hpAfter = actor.system.attribs.hp.value ?? 0;
    const conditions = readCoc7Conditions(actor);
    return {
      actorId: actor.id,
      ...(tokenId !== undefined ? { tokenId } : {}),
      applied,
      armorAbsorbed,
      healed,
      hpBefore,
      hpAfter,
      hpMax,
      majorWound: conditions.criticalWounds,
      unconscious: conditions.unconscious,
      dying: conditions.dying,
      dead: conditions.dead,
      conditions
    };
  }
}
