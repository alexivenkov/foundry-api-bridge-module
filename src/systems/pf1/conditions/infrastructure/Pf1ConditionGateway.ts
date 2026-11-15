import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import {
  activePf1Conditions,
  resolvePf1Actor,
  resolvePf1ConditionId,
  runForActor,
  type FoundryPf1Game,
  type FoundryPf1Registry
} from '@/systems/pf1/shared/infrastructure';
import type { Pf1ConditionPort, Pf1SetConditionOutcome } from '@/systems/pf1/conditions/domain';

/**
 * Anti-corruption layer over `ActorPF#setConditions` (pf1 11.11). The system
 * creates or deletes the condition's active effect, clears the other
 * conditions of the same track, and skips (with a console warning) a
 * condition the actor is immune to; its answer lists only the changes it made.
 */
export class Pf1ConditionGateway implements Pf1ConditionPort {
  constructor(
    private readonly game: FoundryPf1Game,
    private readonly registry: FoundryPf1Registry | undefined
  ) {}

  async setCondition(target: Pf1ActorTarget, condition: string, active: boolean): Promise<Pf1SetConditionOutcome> {
    const id = resolvePf1ConditionId(this.registry, condition);
    const { actor, tokenId } = resolvePf1Actor(this.game, target);
    return runForActor(actor, async () => {
      const changes = await actor.setConditions({ [id]: active });
      return {
        actorId: actor.id,
        ...(tokenId !== undefined ? { tokenId } : {}),
        condition: id,
        active: actor.statuses.has(id),
        changed: Object.prototype.hasOwnProperty.call(changes, id),
        conditions: activePf1Conditions(actor, this.registry)
      };
    });
  }
}
