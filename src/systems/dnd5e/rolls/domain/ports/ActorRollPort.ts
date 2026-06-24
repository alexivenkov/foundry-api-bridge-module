import type { RollOutcome } from '@/systems/shared/domain';
import type { SkillKey } from '@/systems/dnd5e/rolls/domain/value-objects';

export interface RollSkillOptions {
  readonly showInChat: boolean;
}

/**
 * Outbound port for actor rolls. Implemented per game system by an
 * infrastructure gateway (anti-corruption layer over the Foundry API).
 */
export interface ActorRollPort {
  rollSkill(actorId: string, skill: SkillKey, options: RollSkillOptions): Promise<RollOutcome>;
}
