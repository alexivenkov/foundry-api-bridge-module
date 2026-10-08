import type {
  ActivateItemParams,
  ActivateItemResult,
  AppliedHitPointsResult,
  MidiWorkflowResult,
  RollResult
} from '@/commands/types';
import { formatZodError } from '@/systems/shared/validation';
import type { RollOutcome } from '@/systems/shared/domain';
import { requireSystem } from '@/systems';
import {
  createDnd5eItemActivationService,
  Dnd5eItemActivationGateway,
  Dnd5eTargetingGateway,
  Dnd5eMidiWorkflowGateway,
  Dnd5eActivationDialogGateway,
  activateItemRequestSchema,
  RequestToCommandMapper,
  type AppliedHitPoints,
  type ItemActivationOutcome,
  type MidiWorkflowOutcome
} from '@/systems/dnd5e/item-actions';

export function toRollResult(outcome: RollOutcome): RollResult {
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
  if (outcome.mode !== undefined) {
    result.mode = outcome.mode;
  }
  if (outcome.kept !== undefined) {
    result.kept = outcome.kept;
  }

  return result;
}

export function toAppliedHitPointsResult(applied: AppliedHitPoints): AppliedHitPointsResult {
  const result: AppliedHitPointsResult = {};
  for (const [key, delta] of Object.entries(applied)) {
    const entry: AppliedHitPointsResult[string] = {
      applied: delta.applied,
      hpBefore: delta.hpBefore,
      hpAfter: delta.hpAfter
    };
    if (delta.tempBefore !== undefined) entry.tempBefore = delta.tempBefore;
    if (delta.tempAfter !== undefined) entry.tempAfter = delta.tempAfter;
    result[key] = entry;
  }
  return result;
}

function toMidiWorkflowResult(workflow: MidiWorkflowOutcome): MidiWorkflowResult {
  const result: MidiWorkflowResult = {
    attackTotal: workflow.attackTotal,
    damageTotal: workflow.damageTotal,
    isCritical: workflow.isCritical,
    isFumble: workflow.isFumble,
    hitTargetIds: [...workflow.hitTargetIds],
    saveTargetIds: [...workflow.saveTargetIds],
    failedSaveTargetIds: [...workflow.failedSaveTargetIds]
  };
  if (workflow.appliedDamage) {
    result.appliedDamage = toAppliedHitPointsResult(workflow.appliedDamage);
  }
  if (workflow.appliedHealing) {
    result.appliedHealing = toAppliedHitPointsResult(workflow.appliedHealing);
  }
  return result;
}

export function toActivateItemResult(outcome: ItemActivationOutcome): ActivateItemResult {
  const result: ActivateItemResult = {
    itemId: outcome.itemId,
    itemName: outcome.itemName,
    itemType: outcome.itemType,
    activated: outcome.activated,
    status: outcome.status,
    targetsSet: outcome.targetsSet,
    rolls: outcome.rolls.map(toRollResult)
  };

  if (outcome.dialog !== undefined) {
    result.dialog = outcome.dialog;
  }
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
  if (outcome.appliedDamage) {
    result.appliedDamage = toAppliedHitPointsResult(outcome.appliedDamage);
  }
  if (outcome.appliedHealing) {
    result.appliedHealing = toAppliedHitPointsResult(outcome.appliedHealing);
  }
  if (outcome.warning !== undefined) {
    result.warning = outcome.warning;
  }

  return result;
}

export function createActivationService(): ReturnType<typeof createDnd5eItemActivationService> {
  return createDnd5eItemActivationService({
    activation: new Dnd5eItemActivationGateway(),
    targeting: new Dnd5eTargetingGateway(),
    midi: new Dnd5eMidiWorkflowGateway(),
    dialogs: new Dnd5eActivationDialogGateway()
  });
}

export async function activateItemHandler(params: ActivateItemParams): Promise<ActivateItemResult> {
  requireSystem('dnd5e', 'dnd5e/activate-item');

  const parsed = activateItemRequestSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const command = RequestToCommandMapper.toActivateItemCommand(parsed.data);
  const outcome = await createActivationService().activate(command);
  return toActivateItemResult(outcome);
}
