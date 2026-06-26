import { ActorNotFoundError, RollResolutionError } from '@/systems/shared/domain/errors';
import type { RollOutcome } from '@/systems/shared/domain';
import type { Pf2eActorRollPort, RollOptions } from '@/systems/pf2e/rolls/domain';
import { parsePf2eSkillSlug, parsePf2eSaveSlug } from '@/systems/pf2e/rolls/domain';
import type { FoundryCheckRoll, FoundryPf2eActor, FoundryPf2eRollGame } from './foundryPf2eRollTypes';
import { toRollOutcome } from './pf2eRollOutcomeMapper';

/**
 * Anti-corruption layer between the neutral ActorRollPort and the PF2e Statistic
 * API (`actor.skills[slug].check.roll`, `actor.saves`, `actor.perception`). All
 * PF2e roll-API knowledge stays quarantined here.
 */
export class Pf2eActorRollGateway implements Pf2eActorRollPort {
  constructor(private readonly game: FoundryPf2eRollGame) {}

  rollSkill(actorId: string, skill: string, options: RollOptions): Promise<RollOutcome> {
    return this.roll(
      actorId,
      (actor) => {
        const slug = parsePf2eSkillSlug(skill);
        const statistic = actor.skills[slug];
        if (!statistic) {
          throw new RollResolutionError(`Skill not available on actor: ${slug}`);
        }
        return statistic.check.roll({ skipDialog: true, createMessage: options.showInChat });
      },
      'Skill check returned no result'
    );
  }

  rollSave(actorId: string, save: string, options: RollOptions): Promise<RollOutcome> {
    return this.roll(
      actorId,
      (actor) => {
        const slug = parsePf2eSaveSlug(save);
        const statistic = actor.saves[slug];
        if (!statistic) {
          throw new RollResolutionError(`Save not available on actor: ${slug}`);
        }
        return statistic.check.roll({ skipDialog: true, createMessage: options.showInChat });
      },
      'Saving throw returned no result'
    );
  }

  rollPerception(actorId: string, options: RollOptions): Promise<RollOutcome> {
    return this.roll(
      actorId,
      (actor) => actor.perception.check.roll({ skipDialog: true, createMessage: options.showInChat }),
      'Perception check returned no result'
    );
  }

  private async roll(
    actorId: string,
    invoke: (actor: FoundryPf2eActor) => Promise<FoundryCheckRoll | null>,
    noResultMessage: string
  ): Promise<RollOutcome> {
    const actor = this.game.actors.get(actorId);
    if (!actor) {
      throw new ActorNotFoundError(actorId);
    }

    const roll = await invoke(actor);
    if (!roll) {
      throw new RollResolutionError(noResultMessage);
    }

    return toRollOutcome(roll);
  }
}
