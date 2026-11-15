import type { Pf1AbilityKey, Pf1ActorTarget, Pf1CheckOptions, Pf1SaveKey } from '@/systems/pf1/shared/domain';

export interface RollAbilityCommand {
  readonly target: Pf1ActorTarget;
  readonly ability: Pf1AbilityKey;
  readonly options: Pf1CheckOptions;
}

export interface RollSkillCommand {
  readonly target: Pf1ActorTarget;
  readonly skill: string;
  readonly options: Pf1CheckOptions;
}

export interface RollSaveCommand {
  readonly target: Pf1ActorTarget;
  readonly save: Pf1SaveKey;
  readonly options: Pf1CheckOptions;
}

/** Caster level and concentration checks both address a spellbook. */
export interface RollSpellbookCheckCommand {
  readonly target: Pf1ActorTarget;
  readonly spellbook: string;
  readonly options: Pf1CheckOptions;
}
