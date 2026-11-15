import type { Pf1CheckOutcome, Pf1CheckPort } from '@/systems/pf1/checks/domain';
import type {
  RollAbilityCommand,
  RollSaveCommand,
  RollSkillCommand,
  RollSpellbookCheckCommand
} from './CheckCommands';

export class Pf1CheckService {
  constructor(private readonly checks: Pf1CheckPort) {}

  async rollAbility(command: RollAbilityCommand): Promise<Pf1CheckOutcome> {
    return this.checks.rollAbility(command.target, command.ability, command.options);
  }

  async rollSkill(command: RollSkillCommand): Promise<Pf1CheckOutcome> {
    return this.checks.rollSkill(command.target, command.skill, command.options);
  }

  async rollSave(command: RollSaveCommand): Promise<Pf1CheckOutcome> {
    return this.checks.rollSave(command.target, command.save, command.options);
  }

  async rollCasterLevel(command: RollSpellbookCheckCommand): Promise<Pf1CheckOutcome> {
    return this.checks.rollCasterLevel(command.target, command.spellbook, command.options);
  }

  async rollConcentration(command: RollSpellbookCheckCommand): Promise<Pf1CheckOutcome> {
    return this.checks.rollConcentration(command.target, command.spellbook, command.options);
  }
}
