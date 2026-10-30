import { ValidationError } from '@/systems/shared/domain/errors';
import type { Coc7ActorTarget } from '@/systems/coc7/shared/domain';
import { hasAttribs, resolveCoc7Actor, type FoundryCoc7Game } from '@/systems/coc7/shared/infrastructure';
import type { Coc7LuckOutcome, Coc7LuckPort, LuckOptions } from '@/systems/coc7/luck/domain';

/**
 * Anti-corruption layer over CoC7 Luck (CoC7 8.16): `spendLuck` answers
 * `false` when the actor is short, `setLuck` caps at 99 and returns the
 * stored value.
 */
export class Coc7LuckGateway implements Coc7LuckPort {
  constructor(private readonly game: FoundryCoc7Game) {}

  async luck(target: Coc7ActorTarget, options: LuckOptions): Promise<Coc7LuckOutcome> {
    const { actor, tokenId } = resolveCoc7Actor(this.game, target);
    if (!hasAttribs(actor)) {
      throw new ValidationError(`Actor has no luck: ${actor.name}`);
    }
    const before = actor.system.attribs.lck.value ?? 0;
    let after: number;
    switch (options.action) {
      case 'spend': {
        const spent = await actor.spendLuck(options.amount);
        if (spent === false) {
          throw new ValidationError(`Not enough Luck: has ${String(before)}, needs ${String(options.amount)}`);
        }
        after = before - options.amount;
        break;
      }
      case 'set':
        after = await actor.setLuck(options.amount);
        break;
      case 'add':
        after = await actor.setLuck(before + options.amount);
        break;
    }
    return {
      actorId: actor.id,
      ...(tokenId !== undefined ? { tokenId } : {}),
      action: options.action,
      before,
      after
    };
  }
}
