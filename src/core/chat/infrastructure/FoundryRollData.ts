import { requireFoundryActor, type GameProvider } from '@/core/shared';
import type { RollDataSpec } from '@/core/chat/domain';
import type { FoundryRollDataGame } from './foundryRollTypes';

/** The data object a roll substitutes its `@path` references from. */
export class FoundryRollData {
  constructor(private readonly gameProvider: GameProvider<FoundryRollDataGame>) {}

  materialize(spec: RollDataSpec): object {
    const actorData =
      spec.actor !== undefined ? requireFoundryActor(this.gameProvider.getGame(), spec.actor).getRollData() : undefined;
    const base = typeof actorData === 'object' && actorData !== null ? actorData : undefined;

    if (spec.values === undefined) {
      return base ?? {};
    }
    if (base === undefined) {
      return spec.values;
    }
    // The core's Actor#getRollData returns the actor's live system data, so the
    // caller's values are layered over it, never written into it or copied. The
    // core resolves a path with `in`, which follows the prototype.
    return Object.assign(Object.create(base) as object, spec.values);
  }
}
