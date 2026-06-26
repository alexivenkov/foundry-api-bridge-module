import { ActorNotFoundError } from '@/systems/shared/domain/errors';
import { parsePf2eConditionSlug } from '@/systems/pf2e/conditions/domain';
import type {
  ConditionState,
  ConditionMutationOutcome,
  ConditionRemovalOutcome,
  ConditionListOutcome,
  Pf2eConditionPort
} from '@/systems/pf2e/conditions/domain';
import type {
  FoundryConditionItem,
  FoundryPf2eConditionActor,
  FoundryPf2eConditionGame
} from './foundryPf2eConditionTypes';

function toConditionState(item: FoundryConditionItem | null): ConditionState | null {
  if (!item) {
    return null;
  }
  return {
    slug: item.slug,
    name: item.name,
    value: item.value,
    active: item.active
  };
}

/**
 * Anti-corruption layer between the PF2e condition port and the actor condition
 * API (`increaseCondition`/`decreaseCondition`/`getCondition`/`conditions`).
 */
export class Pf2eConditionGateway implements Pf2eConditionPort {
  constructor(private readonly game: FoundryPf2eConditionGame) {}

  setCondition(actorId: string, slug: string, value: number | undefined): Promise<ConditionMutationOutcome> {
    return this.withActor(actorId, async (actor) => {
      const parsed = parsePf2eConditionSlug(slug);
      const existing = actor.getCondition(parsed);
      // `increaseCondition({ value })` ADDS value to an existing valued condition;
      // to honour "set to an exact value" we update the present condition directly.
      if (value !== undefined && existing && existing.value !== null) {
        if (existing.value !== value) {
          await existing.update({ 'system.value.value': value });
        }
      } else {
        await actor.increaseCondition(parsed, value !== undefined ? { value } : {});
      }
      return { actorId, condition: toConditionState(actor.getCondition(parsed)) };
    });
  }

  removeCondition(actorId: string, slug: string): Promise<ConditionRemovalOutcome> {
    return this.withActor(actorId, async (actor) => {
      const parsed = parsePf2eConditionSlug(slug);
      await actor.decreaseCondition(parsed, { forceRemove: true });
      return { actorId, slug: parsed, removed: actor.getCondition(parsed) === null };
    });
  }

  increaseCondition(actorId: string, slug: string): Promise<ConditionMutationOutcome> {
    return this.withActor(actorId, async (actor) => {
      const parsed = parsePf2eConditionSlug(slug);
      await actor.increaseCondition(parsed);
      return { actorId, condition: toConditionState(actor.getCondition(parsed)) };
    });
  }

  decreaseCondition(actorId: string, slug: string): Promise<ConditionMutationOutcome> {
    return this.withActor(actorId, async (actor) => {
      const parsed = parsePf2eConditionSlug(slug);
      await actor.decreaseCondition(parsed);
      return { actorId, condition: toConditionState(actor.getCondition(parsed)) };
    });
  }

  getConditions(actorId: string): Promise<ConditionListOutcome> {
    return this.withActor(actorId, (actor) => ({
      actorId,
      actorName: actor.name,
      conditions: actor.conditions.active
        .map(toConditionState)
        .filter((c): c is ConditionState => c !== null)
    }));
  }

  private withActor<T>(
    actorId: string,
    fn: (actor: FoundryPf2eConditionActor) => T | Promise<T>
  ): Promise<T> {
    const actor = this.game.actors.get(actorId);
    if (!actor) {
      return Promise.reject(new ActorNotFoundError(actorId));
    }
    return Promise.resolve(fn(actor));
  }
}
