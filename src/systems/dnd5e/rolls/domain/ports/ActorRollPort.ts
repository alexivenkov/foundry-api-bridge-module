import type { RollOutcome } from '@/systems/shared/domain';

export interface RollOptions {
  readonly showInChat: boolean;
}

/**
 * Outbound port for D&D 5e actor rolls. Implemented by the dnd5e infrastructure
 * gateway. Identifiers arrive as plain strings and are validated into dnd5e
 * value-objects inside the gateway.
 */
export interface ActorRollPort {
  rollSkill(actorId: string, skill: string, options: RollOptions): Promise<RollOutcome>;
  rollSave(actorId: string, ability: string, options: RollOptions): Promise<RollOutcome>;
  rollAbility(actorId: string, ability: string, options: RollOptions): Promise<RollOutcome>;
  rollPerception(actorId: string, options: RollOptions): Promise<RollOutcome>;
}
