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

/**
 * Top-level flags of a dnd5e D20 roll process config. `D20Roll.applyKeybindings`
 * reads them and sets `advantageMode` on every roll of the process, the same
 * mechanism `Activity#rollAttack` uses (verified against dnd5e 5.3.3).
 */
export interface D20RollFlags {
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface SkillRollConfig extends D20RollFlags {
  skill: SkillKey;
}

export interface AbilityRollConfig extends D20RollFlags {
  ability: AbilityKey;
}

export interface FoundryRollActor {
  id: string;
  name: string;
  rollSkill(
    config: SkillRollConfig,
    dialog?: RollDialogConfig,
    message?: RollMessageConfig
  ): Promise<FoundryD20Roll[]>;
  rollAbilityCheck(
    config: AbilityRollConfig,
    dialog?: RollDialogConfig,
    message?: RollMessageConfig
  ): Promise<FoundryD20Roll[]>;
  rollSavingThrow(
    config: AbilityRollConfig,
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
