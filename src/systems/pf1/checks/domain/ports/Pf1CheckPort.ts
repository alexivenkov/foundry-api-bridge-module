import type { Pf1AbilityKey, Pf1ActorTarget, Pf1CheckOptions, Pf1SaveKey } from '@/systems/pf1/shared/domain';
import type { Pf1CheckOutcome } from '../CheckOutcome';

/**
 * Outbound port for pf1 d20 checks through the actor's own roll methods
 * (`rollAbilityTest`, `rollSkill`, `rollSavingThrow`, `rollCL`,
 * `rollConcentration`) with `skipDialog`, so no dialog ever opens.
 */
export interface Pf1CheckPort {
  rollAbility(target: Pf1ActorTarget, ability: Pf1AbilityKey, options: Pf1CheckOptions): Promise<Pf1CheckOutcome>;
  rollSkill(target: Pf1ActorTarget, skill: string, options: Pf1CheckOptions): Promise<Pf1CheckOutcome>;
  rollSave(target: Pf1ActorTarget, save: Pf1SaveKey, options: Pf1CheckOptions): Promise<Pf1CheckOutcome>;
  rollCasterLevel(target: Pf1ActorTarget, spellbook: string, options: Pf1CheckOptions): Promise<Pf1CheckOutcome>;
  rollConcentration(target: Pf1ActorTarget, spellbook: string, options: Pf1CheckOptions): Promise<Pf1CheckOutcome>;
}
