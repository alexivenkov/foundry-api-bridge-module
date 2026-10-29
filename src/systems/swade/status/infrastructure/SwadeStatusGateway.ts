import type { SwadeActorTarget } from '@/systems/swade/shared/domain';
import { resolveSwadeActor, type FoundrySwadeGame } from '@/systems/swade/shared/infrastructure';
import type { SetStatusOptions, SwadeSetStatusOutcome, SwadeStatusPort } from '@/systems/swade/status/domain';

/**
 * Anti-corruption layer over SWADE statuses (swade 6.0.4). The system's
 * `actor.toggleActiveEffect(id, { active, overlay })` creates the effect with
 * its static `_id` and applies linked statuses (Stunned adds Distracted and
 * Prone, Bound adds Entangled) in `SwadeActiveEffect#_onCreate`. Forcing an
 * already active status on would try to create a duplicate id, so that case
 * is a no-op here, as the system's own damage applicator does.
 */
export class SwadeStatusGateway implements SwadeStatusPort {
  constructor(private readonly game: FoundrySwadeGame) {}

  async setStatus(target: SwadeActorTarget, options: SetStatusOptions): Promise<SwadeSetStatusOutcome> {
    const { actor, tokenId } = resolveSwadeActor(this.game, target);

    const alreadyActive = actor.statuses.has(options.status);
    if (options.active !== alreadyActive) {
      const toggleOptions: { active: boolean; overlay?: boolean } = { active: options.active };
      if (options.overlay !== undefined) {
        toggleOptions.overlay = options.overlay;
      }
      await actor.toggleActiveEffect(options.status, toggleOptions);
    }

    const outcome: {
      actorId: string;
      tokenId?: string;
      status: string;
      active: boolean;
      statuses: string[];
    } = {
      actorId: actor.id,
      status: options.status,
      active: options.active,
      statuses: Array.from(actor.statuses)
    };
    if (tokenId !== undefined) {
      outcome.tokenId = tokenId;
    }
    return outcome;
  }
}
