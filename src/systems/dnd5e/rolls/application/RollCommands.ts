import type { SkillKey, AbilityKey } from '@/systems/dnd5e/rolls/domain';

export interface RollSkillCommand {
  readonly actorId: string;
  readonly skill: SkillKey;
  readonly showInChat: boolean;
}

export interface RollAbilityCommand {
  readonly actorId: string;
  readonly ability: AbilityKey;
  readonly showInChat: boolean;
}

export interface RollSaveCommand {
  readonly actorId: string;
  readonly ability: AbilityKey;
  readonly showInChat: boolean;
}
