import type { SkillKey } from '@/systems/dnd5e/rolls/domain';

export interface RollSkillCommand {
  readonly actorId: string;
  readonly skill: SkillKey;
  readonly showInChat: boolean;
}
