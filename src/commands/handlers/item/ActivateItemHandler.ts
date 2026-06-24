import type {
  ActivateItemParams,
  ActivateItemResult,
  MidiWorkflowResult,
  RollResult
} from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import type { RollOutcome } from '@/systems/shared/domain';
import {
  createDnd5eItemActivationService,
  Dnd5eItemActivationGateway,
  Dnd5eTargetingGateway,
  Dnd5eMidiWorkflowGateway,
  activateItemRequestSchema,
  RequestToCommandMapper,
  type ItemActivationOutcome,
  type MidiWorkflowOutcome
} from '@/systems/dnd5e/item-actions';

function toRollResult(outcome: RollOutcome): RollResult {
  const result: RollResult = {
    total: outcome.total,
    formula: outcome.formula,
    dice: outcome.dice.map((d) => ({
      type: d.type,
      count: d.count,
      results: [...d.results]
    }))
  };

  if (outcome.isCritical) {
    result.isCritical = true;
  }
  if (outcome.isFumble) {
    result.isFumble = true;
  }

  return result;
}

function toMidiWorkflowResult(workflow: MidiWorkflowOutcome): MidiWorkflowResult {
  return {
    attackTotal: workflow.attackTotal,
    damageTotal: workflow.damageTotal,
    isCritical: workflow.isCritical,
    isFumble: workflow.isFumble,
    hitTargetIds: [...workflow.hitTargetIds],
    saveTargetIds: [...workflow.saveTargetIds],
    failedSaveTargetIds: [...workflow.failedSaveTargetIds]
  };
}

function toActivateItemResult(outcome: ItemActivationOutcome): ActivateItemResult {
  const result: ActivateItemResult = {
    itemId: outcome.itemId,
    itemName: outcome.itemName,
    itemType: outcome.itemType,
    activated: outcome.activated,
    targetsSet: outcome.targetsSet,
    rolls: outcome.rolls.map(toRollResult)
  };

  if (outcome.activityUsed) {
    result.activityUsed = {
      id: outcome.activityUsed.id,
      name: outcome.activityUsed.name,
      type: outcome.activityUsed.type
    };
  }
  if (outcome.chatMessageId !== undefined) {
    result.chatMessageId = outcome.chatMessageId;
  }
  if (outcome.workflow) {
    result.workflow = toMidiWorkflowResult(outcome.workflow);
  }

  return result;
}

export async function activateItemHandler(params: ActivateItemParams): Promise<ActivateItemResult> {
  const parsed = activateItemRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toActivateItemCommand(parsed.data);

  const service = createDnd5eItemActivationService({
    activation: new Dnd5eItemActivationGateway(),
    targeting: new Dnd5eTargetingGateway(),
    midi: new Dnd5eMidiWorkflowGateway()
  });

  const outcome = await service.activate(command);
  return toActivateItemResult(outcome);
}
