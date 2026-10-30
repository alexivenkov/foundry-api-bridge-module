import { ValidationError } from '@/systems/shared/domain/errors';
import type { Coc7ActorTarget } from '@/systems/coc7/shared/domain';
import {
  readCoc7Conditions,
  readCoc7Statuses,
  resolveCoc7Actor,
  settleConditionCleared,
  type FoundryCoc7Game
} from '@/systems/coc7/shared/infrastructure';
import type { Coc7ConditionPort, Coc7SetConditionOutcome, SetConditionOptions } from '@/systems/coc7/conditions/domain';

/**
 * Anti-corruption layer over CoC7 conditions (CoC7 8.16). `conditionsSet` /
 * `conditionsUnset` create or delete the status effect when status icons are
 * enabled (the sheet flag follows from the effect hooks) and set the flag
 * directly otherwise; `realTime` / `duration` only matter for `tempoInsane`.
 */
export class Coc7ConditionGateway implements Coc7ConditionPort {
  constructor(private readonly game: FoundryCoc7Game) {}

  async setCondition(target: Coc7ActorTarget, options: SetConditionOptions): Promise<Coc7SetConditionOutcome> {
    const { actor, tokenId } = resolveCoc7Actor(this.game, target);
    if (actor.system.conditions === undefined) {
      throw new ValidationError(`Actor has no conditions: ${actor.name}`);
    }
    if (options.active) {
      const extra: { realTime?: boolean; duration?: number } = {};
      if (options.realTime !== undefined) {
        extra.realTime = options.realTime;
      }
      if (options.duration !== undefined) {
        extra.duration = options.duration;
      }
      await actor.conditionsSet([options.condition], extra);
    } else {
      await actor.conditionsUnset([options.condition]);
      await settleConditionCleared(actor, options.condition);
    }
    return {
      actorId: actor.id,
      ...(tokenId !== undefined ? { tokenId } : {}),
      conditions: readCoc7Conditions(actor),
      statuses: readCoc7Statuses(actor)
    };
  }
}
