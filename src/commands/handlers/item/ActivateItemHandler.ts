import type { ActivateItemParams, ActivateItemResult, MidiWorkflowResult, RollResult } from '@/commands/types';
import {
  extractDiceResults,
  getGame,
  getCanvas,
  getHooks,
  isMidiQolActive,
  type FoundryActivity,
  type FoundryRoll,
  type FoundryUsageResult,
  type MidiWorkflow
} from './itemTypes';

const MIDI_WORKFLOW_TIMEOUT = 5000;

function setTargets(tokenIds: string[]): number {
  const canvas = getCanvas();
  const game = getGame();

  for (const existing of game.user.targets) {
    existing.setTarget(false, { user: game.user, releaseOthers: false });
  }

  let count = 0;
  for (const tokenId of tokenIds) {
    const token = canvas.tokens.get(tokenId);
    if (!token) {
      throw new Error(`Target token not found: ${tokenId}`);
    }
    token.setTarget(true, { user: game.user, releaseOthers: false });
    count++;
  }

  return count;
}

function extractRolls(rolls: FoundryRoll[] | undefined): RollResult[] {
  if (!rolls || rolls.length === 0) return [];

  return rolls.map(roll => {
    const result: RollResult = {
      total: roll.total,
      formula: roll.formula,
      dice: extractDiceResults(roll.terms)
    };
    if (roll.isCritical) result.isCritical = true;
    if (roll.isFumble) result.isFumble = true;
    return result;
  });
}

function extractWorkflow(workflow: MidiWorkflow): MidiWorkflowResult {
  return {
    attackTotal: workflow.attackTotal,
    damageTotal: workflow.damageTotal,
    isCritical: workflow.isCritical ?? false,
    isFumble: workflow.isFumble ?? false,
    hitTargetIds: [...(workflow.hitTargets ?? [])].map(t => t.id),
    saveTargetIds: [...(workflow.saves ?? [])].map(t => t.id),
    failedSaveTargetIds: [...(workflow.failedSaves ?? [])].map(t => t.id)
  };
}

function waitForMidiWorkflow(): { promise: Promise<MidiWorkflow | undefined>; cleanup: () => void } {
  const hooks = getHooks();
  let hookId: number | undefined;

  const promise = Promise.race([
    new Promise<MidiWorkflow>((resolve) => {
      hookId = hooks.once('midi-qol.RollComplete', resolve);
    }),
    new Promise<undefined>((resolve) => {
      setTimeout(() => { resolve(undefined); }, MIDI_WORKFLOW_TIMEOUT);
    })
  ]);

  const cleanup = (): void => {
    if (hookId !== undefined) {
      hooks.off('midi-qol.RollComplete', hookId);
    }
  };

  return { promise, cleanup };
}

export async function activateItemHandler(params: ActivateItemParams): Promise<ActivateItemResult> {
  const game = getGame();
  const actor = game.actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  const item = actor.items.get(params.itemId);

  if (!item) {
    throw new Error(`Item not found: ${params.itemId}`);
  }

  const targetsSet = params.targetTokenIds?.length
    ? setTargets(params.targetTokenIds)
    : 0;

  const activities = item.system.activities?.contents ?? [];

  let targetActivity: FoundryActivity | undefined;

  if (params.activityId) {
    targetActivity = item.system.activities?.get(params.activityId);
    if (!targetActivity) {
      throw new Error(`Activity not found: ${params.activityId}`);
    }
  } else if (params.activityType) {
    targetActivity = item.system.activities?.find(a => a.type === params.activityType);
    if (!targetActivity) {
      throw new Error(`No activity of type '${params.activityType}' found on item: ${item.name}`);
    }
  } else if (activities.length > 0) {
    targetActivity = activities[0];
  }

  const midiActive = isMidiQolActive();
  const midiListener = midiActive ? waitForMidiWorkflow() : undefined;

  const usageConfig = { create: { measuredTemplate: false } };

  let useResult: FoundryUsageResult | null = null;

  if (targetActivity) {
    useResult = await targetActivity.use(usageConfig);
  } else {
    useResult = await item.use(usageConfig);
  }

  let workflow: MidiWorkflowResult | undefined;

  if (midiListener) {
    const midiWorkflow = await midiListener.promise;
    midiListener.cleanup();
    if (midiWorkflow) {
      workflow = extractWorkflow(midiWorkflow);
    }
  }

  const result: ActivateItemResult = {
    itemId: item.id,
    itemName: item.name,
    itemType: item.type,
    activated: true,
    targetsSet,
    rolls: extractRolls(useResult?.rolls)
  };

  if (workflow) {
    result.workflow = workflow;
  }

  if (useResult?.message) {
    result.chatMessageId = useResult.message.id;
  }

  if (targetActivity) {
    result.activityUsed = {
      id: targetActivity._id,
      name: targetActivity.name,
      type: targetActivity.type
    };
  }

  return result;
}
