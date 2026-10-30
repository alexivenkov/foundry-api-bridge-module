import type { Coc7ConditionPort, Coc7SetConditionOutcome } from '@/systems/coc7/conditions/domain';
import type { SetConditionCommand } from './ConditionCommands';

export class Coc7ConditionService {
  constructor(private readonly conditions: Coc7ConditionPort) {}

  async setCondition(command: SetConditionCommand): Promise<Coc7SetConditionOutcome> {
    return this.conditions.setCondition(command.target, {
      condition: command.condition,
      active: command.active,
      realTime: command.realTime,
      duration: command.duration
    });
  }
}
