import { ActorNotFoundError, RollResolutionError } from '@/systems/shared/domain/errors';
import type { RollOutcome } from '@/systems/shared/domain';
import { parseMapIncrease, StrikeNotFoundError } from '@/systems/pf2e/strikes/domain';
import type {
  Pf2eStrikePort,
  StrikeListOutcome,
  StrikeRollOptions
} from '@/systems/pf2e/strikes/domain';
import type {
  FoundryStrikeAction,
  FoundryStrikeActor,
  FoundryPf2eStrikeGame
} from './foundryPf2eStrikeTypes';
import { checkToRollOutcome, damageToRollOutcome } from './pf2eStrikeOutcomeMapper';

/**
 * Anti-corruption layer between the PF2e strike port and `actor.system.actions`
 * (`variants[].roll` / `damage` / `critical`).
 */
export class Pf2eStrikeGateway implements Pf2eStrikePort {
  constructor(private readonly game: FoundryPf2eStrikeGame) {}

  listStrikes(actorId: string): Promise<StrikeListOutcome> {
    return this.withActor(actorId, (actor) => ({
      actorId,
      actorName: actor.name,
      strikes: this.strikeActions(actor).map((strike) => ({
        slug: strike.slug,
        label: strike.label,
        ready: strike.ready,
        variants: strike.variants.map((variant) => variant.label)
      }))
    }));
  }

  rollStrike(
    actorId: string,
    slug: string,
    mapIncrease: number,
    options: StrikeRollOptions
  ): Promise<RollOutcome> {
    return this.withActor(actorId, async (actor) => {
      const step = parseMapIncrease(mapIncrease);
      const strike = this.findStrike(actor, slug);
      const variant = strike.variants[step];
      if (!variant) {
        throw new RollResolutionError(`Strike '${slug}' has no variant for MAP increase ${String(step)}`);
      }
      const roll = await variant.roll({ createMessage: options.showInChat });
      if (!roll) {
        throw new RollResolutionError('Strike attack returned no result');
      }
      return checkToRollOutcome(roll);
    });
  }

  rollStrikeDamage(
    actorId: string,
    slug: string,
    critical: boolean,
    options: StrikeRollOptions
  ): Promise<RollOutcome> {
    return this.withActor(actorId, async (actor) => {
      const strike = this.findStrike(actor, slug);
      const rollDamage = critical ? strike.critical : strike.damage;
      if (!rollDamage) {
        throw new RollResolutionError(`Strike '${slug}' has no ${critical ? 'critical ' : ''}damage`);
      }
      const roll = await rollDamage({ createMessage: options.showInChat });
      if (!roll || typeof roll === 'string') {
        throw new RollResolutionError('Strike damage returned no result');
      }
      return damageToRollOutcome(roll);
    });
  }

  private strikeActions(actor: FoundryStrikeActor): FoundryStrikeAction[] {
    return (actor.system.actions ?? []).filter((action) => action.type === 'strike');
  }

  private findStrike(actor: FoundryStrikeActor, slug: string): FoundryStrikeAction {
    const strike = this.strikeActions(actor).find((action) => action.slug === slug);
    if (!strike) {
      throw new StrikeNotFoundError(slug);
    }
    return strike;
  }

  private withActor<T>(
    actorId: string,
    fn: (actor: FoundryStrikeActor) => T | Promise<T>
  ): Promise<T> {
    const actor = this.game.actors.get(actorId);
    if (!actor) {
      return Promise.reject(new ActorNotFoundError(actorId));
    }
    return Promise.resolve(fn(actor));
  }
}
