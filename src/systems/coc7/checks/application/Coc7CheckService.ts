import type { Coc7CheckOutcome } from '@/systems/coc7/shared/domain';
import type { Coc7CheckPort } from '@/systems/coc7/checks/domain';
import type { RollAttributeCommand, RollCharacteristicCommand, RollSkillCommand } from './CheckCommands';

export class Coc7CheckService {
  constructor(private readonly checks: Coc7CheckPort) {}

  async rollSkill(command: RollSkillCommand): Promise<Coc7CheckOutcome> {
    return this.checks.rollSkill(command.target, { skill: command.skill, options: command.options });
  }

  async rollCharacteristic(command: RollCharacteristicCommand): Promise<Coc7CheckOutcome> {
    return this.checks.rollCharacteristic(command.target, {
      characteristic: command.characteristic,
      options: command.options
    });
  }

  async rollAttribute(command: RollAttributeCommand): Promise<Coc7CheckOutcome> {
    return this.checks.rollAttribute(command.target, { attribute: command.attribute, options: command.options });
  }
}
