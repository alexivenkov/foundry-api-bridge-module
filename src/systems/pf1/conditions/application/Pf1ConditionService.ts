import type { Pf1ConditionPort, Pf1SetConditionOutcome } from '@/systems/pf1/conditions/domain';
import type { SetConditionCommand } from './ConditionCommands';

export class Pf1ConditionService {
  constructor(private readonly conditions: Pf1ConditionPort) {}

  async setCondition(command: SetConditionCommand): Promise<Pf1SetConditionOutcome> {
    return this.conditions.setCondition(command.target, command.condition, command.active);
  }
}
