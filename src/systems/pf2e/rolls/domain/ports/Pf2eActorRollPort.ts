import type { RollOutcome } from '@/systems/shared/domain';

export interface RollOptions {
  readonly showInChat: boolean;
}

/**
 * Outbound port for PF2e actor rolls via the Statistic API. PF2e has no bare
 * ability checks, so none is exposed here. Slugs arrive as plain strings and
 * are validated into PF2e value-objects inside the gateway.
 */
export interface Pf2eActorRollPort {
  rollSkill(actorId: string, skill: string, options: RollOptions): Promise<RollOutcome>;
  rollSave(actorId: string, save: string, options: RollOptions): Promise<RollOutcome>;
  rollPerception(actorId: string, options: RollOptions): Promise<RollOutcome>;
}
