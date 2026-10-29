import { ValidationError } from '@/systems/shared/domain/errors';
import type { SwadeActorTarget } from '@/systems/swade/shared/domain';
import { resolveSwadeActor, type FoundrySwadeActor, type FoundrySwadeGame } from '@/systems/swade/shared/infrastructure';
import type { SwadeBenniesOutcome, SwadeBenniesPort, SwadeBennyAction } from '@/systems/swade/bennies/domain';

const GM = 'GM';

/**
 * Anti-corruption layer over SWADE bennies (swade 6.0.4): `actor.bennies`,
 * `spendBenny()` (false when the pool is empty), `getBenny()`,
 * `refreshBennies()`; the GM keeps theirs as a user flag behind the same three
 * methods on `game.user`. The actor's `refreshBennies` does not await the
 * data model's update, so the model's own method is preferred when present.
 */
export class SwadeBenniesGateway implements SwadeBenniesPort {
  constructor(private readonly game: FoundrySwadeGame) {}

  async actorBennies(target: SwadeActorTarget, action: SwadeBennyAction): Promise<SwadeBenniesOutcome> {
    const { actor, tokenId } = resolveSwadeActor(this.game, target);
    const pool = actor.system.bennies;
    if (!pool) {
      throw new ValidationError(`Actor has no bennies: ${actor.name}`);
    }

    const before = actor.bennies;
    await this.applyToActor(actor, action);

    const outcome: {
      owner: 'actor';
      actorId: string;
      tokenId?: string;
      action: SwadeBennyAction;
      before: number;
      after: number;
      max: number;
    } = {
      owner: 'actor',
      actorId: actor.id,
      action,
      before,
      after: actor.bennies,
      max: pool.max
    };
    if (tokenId !== undefined) {
      outcome.tokenId = tokenId;
    }
    return outcome;
  }

  async gmBennies(action: SwadeBennyAction): Promise<SwadeBenniesOutcome> {
    const user = this.game.user;
    if (!user?.isGM) {
      throw new ValidationError('Current user is not a GM');
    }

    const before = user.bennies;
    switch (action) {
      case 'spend': {
        if (before < 1) {
          throw new ValidationError(`No bennies left: ${GM}`);
        }
        const spent = await user.spendBenny();
        if (spent !== true) {
          throw new ValidationError(`No bennies left: ${GM}`);
        }
        break;
      }
      case 'give':
        await user.getBenny();
        break;
      case 'refresh':
        await user.refreshBennies(true);
        break;
    }
    return { owner: 'gm', action, before, after: user.bennies };
  }

  private async applyToActor(actor: FoundrySwadeActor, action: SwadeBennyAction): Promise<void> {
    switch (action) {
      case 'spend': {
        if (actor.bennies < 1) {
          throw new ValidationError(`No bennies left: ${actor.name}`);
        }
        const spent = await actor.spendBenny();
        if (!spent) {
          throw new ValidationError(`No bennies left: ${actor.name}`);
        }
        return;
      }
      case 'give':
        await actor.getBenny();
        return;
      case 'refresh': {
        const modelRefresh = actor.system.refreshBennies;
        if (typeof modelRefresh === 'function') {
          await modelRefresh.call(actor.system, true);
        } else {
          await actor.refreshBennies(true);
        }
        return;
      }
    }
  }
}
