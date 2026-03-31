import type { ActivateItemParams, ActivateItemResult, MidiWorkflowResult, RollResult } from '@/commands/types';
import {
  extractDiceResults,
  getGame,
  getCanvas,
  getHooks,
  isMidiQolActive,
  getDnd5eCanvas,
  type FoundryActivity,
  type FoundryItem,
  type FoundryRoll,
  type FoundryTargetToken,
  type FoundryUsageResult,
  type MidiWorkflow
} from './itemTypes';

const MIDI_WORKFLOW_TIMEOUT = 30000;

function setTargets(tokenIds: string[]): FoundryTargetToken[] {
  const canvas = getCanvas();
  const game = getGame();

  for (const existing of game.user.targets) {
    existing.setTarget(false, { user: game.user, releaseOthers: false });
  }

  const tokens: FoundryTargetToken[] = [];
  for (const tokenId of tokenIds) {
    const token = canvas.tokens.get(tokenId);
    if (!token) {
      throw new Error(`Target token not found: ${tokenId}`);
    }
    token.setTarget(true, { user: game.user, releaseOthers: false });
    tokens.push(token);
  }

  return tokens;
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

function setupAutoTemplatePlace(position: { x: number; y: number; direction?: number }): void {
  const dnd5eCanvas = getDnd5eCanvas();
  if (!dnd5eCanvas) return;

  const canvas = getCanvas();
  const AbilityTemplate = dnd5eCanvas.AbilityTemplate;
  const origDrawPreview = AbilityTemplate.prototype.drawPreview;

  AbilityTemplate.prototype.drawPreview = async function (this: { document: { toObject(): Record<string, unknown>; updateSource(data: Record<string, unknown>): void } }): Promise<unknown> {
    const update: Record<string, unknown> = { x: position.x, y: position.y };
    if (position.direction !== undefined) {
      update['direction'] = position.direction;
    }
    this.document.updateSource(update);
    const data = this.document.toObject();
    AbilityTemplate.prototype.drawPreview = origDrawPreview;
    const result = await canvas.scene?.createEmbeddedDocuments('MeasuredTemplate', [data]);
    return result;
  };
}

function resolveActivity(item: FoundryItem, params: ActivateItemParams): FoundryActivity | undefined {
  const activities = item.system.activities?.contents ?? [];

  if (params.activityId) {
    const activity = item.system.activities?.get(params.activityId);
    if (!activity) {
      throw new Error(`Activity not found: ${params.activityId}`);
    }
    return activity;
  }

  if (params.activityType) {
    const activity = item.system.activities?.find((a: FoundryActivity) => a.type === params.activityType);
    if (!activity) {
      throw new Error(`No activity of type '${params.activityType}' found on item: ${item.name}`);
    }
    return activity;
  }

  if (activities.length > 0) {
    return activities[0];
  }

  return undefined;
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

  const targetTokens = params.targetTokenIds?.length
    ? setTargets(params.targetTokenIds)
    : [];

  const targetActivity = resolveActivity(item, params);
  const midiActive = isMidiQolActive();
  const midiListener = midiActive ? waitForMidiWorkflow() : undefined;

  if (params.templatePosition) {
    setupAutoTemplatePlace(params.templatePosition);
  }

  const usageConfig: Record<string, unknown> = {};

  if (!params.templatePosition) {
    usageConfig['create'] = { measuredTemplate: false };
  }

  if (params.spellLevel !== undefined) {
    usageConfig['spell'] = { slot: `spell${String(params.spellLevel)}` };
  }

  const config = Object.keys(usageConfig).length > 0 ? usageConfig : undefined;

  let useResult: FoundryUsageResult | null = null;

  if (targetActivity) {
    useResult = await targetActivity.use(config as Parameters<typeof targetActivity.use>[0]);
  } else {
    useResult = await item.use(config as Parameters<typeof item.use>[0]);
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
    targetsSet: targetTokens.length,
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
