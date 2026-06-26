import type {
  ConditionMutationOutcome,
  ConditionRemovalOutcome,
  ConditionListOutcome,
  Pf2eConditionPort
} from '@/systems/pf2e/conditions/domain';
import type {
  SetConditionCommand,
  ConditionSlugCommand,
  GetConditionsCommand
} from './ConditionCommands';

export class Pf2eConditionService {
  constructor(private readonly conditions: Pf2eConditionPort) {}

  async setCondition(command: SetConditionCommand): Promise<ConditionMutationOutcome> {
    return this.conditions.setCondition(command.actorId, command.slug, command.value);
  }

  async removeCondition(command: ConditionSlugCommand): Promise<ConditionRemovalOutcome> {
    return this.conditions.removeCondition(command.actorId, command.slug);
  }

  async increaseCondition(command: ConditionSlugCommand): Promise<ConditionMutationOutcome> {
    return this.conditions.increaseCondition(command.actorId, command.slug);
  }

  async decreaseCondition(command: ConditionSlugCommand): Promise<ConditionMutationOutcome> {
    return this.conditions.decreaseCondition(command.actorId, command.slug);
  }

  async getConditions(command: GetConditionsCommand): Promise<ConditionListOutcome> {
    return this.conditions.getConditions(command.actorId);
  }
}
