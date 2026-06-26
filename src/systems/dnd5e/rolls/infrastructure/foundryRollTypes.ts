import type { SkillKey, AbilityKey } from '@/systems/dnd5e/rolls/domain';

export interface FoundryDiceTerm {
  faces?: number;
  number?: number;
  results?: Array<{ result: number }>;
}

export interface FoundryD20Roll {
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
  isCritical: boolean;
  isFumble: boolean;
}

export interface RollDialogConfig {
  configure: boolean;
}

export interface RollMessageConfig {
  create: boolean;
}

export interface FoundryRollActor {
  id: string;
  name: string;
  rollSkill(
    config: { skill: SkillKey },
    dialog?: RollDialogConfig,
    message?: RollMessageConfig
  ): Promise<FoundryD20Roll[]>;
  rollAbilityCheck(
    config: { ability: AbilityKey },
    dialog?: RollDialogConfig,
    message?: RollMessageConfig
  ): Promise<FoundryD20Roll[]>;
  rollSavingThrow(
    config: { ability: AbilityKey },
    dialog?: RollDialogConfig,
    message?: RollMessageConfig
  ): Promise<FoundryD20Roll[]>;
}

export interface FoundryRollActorsCollection {
  get(id: string): FoundryRollActor | undefined;
}

export interface FoundryRollGame {
  actors: FoundryRollActorsCollection;
}

export function getDnd5eRollGame(): FoundryRollGame {
  return (globalThis as unknown as { game: FoundryRollGame }).game;
}
