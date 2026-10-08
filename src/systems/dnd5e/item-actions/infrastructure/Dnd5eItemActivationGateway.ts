import {
  ActorNotFoundError,
  ItemNotFoundError,
  TargetTokenNotFoundError,
  ValidationError
} from '@/systems/shared/domain/errors';
import type { RollOutcome } from '@/systems/shared/domain';
import type {
  ActivateItemOptions,
  ActivationUseOutcome,
  ActivityUsedInfo,
  AppliedHitPoints,
  HitPointsDelta,
  ItemActivationPort,
  ItemDescription,
  TemplatePosition
} from '@/systems/dnd5e/item-actions/domain';
import type {
  ActivityConsumeConfig,
  ActivityUsageConfig,
  FoundryActivity,
  FoundryItem,
  FoundryItemActionActor,
  FoundryTargetToken,
  FoundryUsageResult,
  MidiWorkflowOptions
} from './foundryItemActionTypes';
import { getGame, getCanvas, getDnd5eCanvas, getHooks, isMidiQolActive } from './foundryItemActionTypes';
import { resolveActivity } from './activityResolver';
import { toRollOutcomes } from './rollResultMapper';
import { ActivationRollHooks, SUBSEQUENT_ROLL_WAIT_MS } from './activationRollHooks';

interface MutableActivationUseOutcome {
  itemId: string;
  itemName: string;
  itemType: string;
  activityUsed?: ActivityUsedInfo;
  rolls: RollOutcome[];
  chatMessageId?: string;
  warning?: string;
  appliedHealing?: AppliedHitPoints;
  deferredCleanup?: () => Promise<void>;
}

/**
 * Monkeypatches dnd5e's AbilityTemplate.drawPreview so the next template draw
 * auto-places at `position` (and restores the prototype). Infra-only — a hack
 * against the dnd5e use-pipeline, intentionally not modelled as a domain port.
 */
function setupAutoTemplatePlace(position: TemplatePosition): void {
  const dnd5eCanvas = getDnd5eCanvas();
  if (!dnd5eCanvas) {
    return;
  }

  const canvas = getCanvas();
  const AbilityTemplate = dnd5eCanvas.AbilityTemplate;
  const origDrawPreview = AbilityTemplate.prototype.drawPreview;

  AbilityTemplate.prototype.drawPreview = async function (this: {
    document: {
      toObject(): Record<string, unknown>;
      updateSource(data: Record<string, unknown>): void;
    };
  }): Promise<unknown> {
    const update: Record<string, unknown> = { x: position.x, y: position.y };
    if (position.direction !== undefined) {
      update['direction'] = position.direction;
    }
    this.document.updateSource(update);
    const data = this.document.toObject();
    AbilityTemplate.prototype.drawPreview = origDrawPreview;
    return canvas.scene?.createEmbeddedDocuments('MeasuredTemplate', [data]);
  };
}

const ROLLING_ACTIVITY_TYPES = new Set(['attack', 'damage', 'heal', 'save']);

function affectsSelf(activity: FoundryActivity): boolean {
  return activity.target?.affects?.type === 'self';
}

/** Fast-forward every Midi-QOL dialog and auto-roll (verified field names, midi-qol 14.0.13). */
function midiFastForward(): MidiWorkflowOptions {
  return {
    autoFastAttack: true,
    fastForwardAttack: true,
    fastForwardDamage: true,
    autoRollAttack: true,
    autoRollDamage: 'onHit',
    targetConfirmation: 'none'
  };
}

export function buildUsageConfig(options: ActivateItemOptions): ActivityUsageConfig {
  const usage: ActivityUsageConfig = {};
  if (!options.templatePosition) {
    usage.create = { measuredTemplate: false };
  }
  if (options.spellLevel !== undefined) {
    usage.spell = { slot: `spell${String(options.spellLevel)}` };
  }
  if (options.consume) {
    const consume: ActivityConsumeConfig = {};
    if (options.consume.spellSlot !== undefined) consume.spellSlot = options.consume.spellSlot;
    if (options.consume.itemUses !== undefined) consume.resources = options.consume.itemUses;
    if (Object.keys(consume).length > 0) usage.consume = consume;
  }

  const workflowOptions: MidiWorkflowOptions = options.fastForward ? midiFastForward() : {};
  if (options.advantage) workflowOptions.advantage = true;
  if (options.disadvantage) workflowOptions.disadvantage = true;
  if (options.attackMode !== undefined) workflowOptions.attackMode = options.attackMode;

  if (options.fastForward) {
    // Shift is dnd5e's "skip the dialog" key for the rolls use() triggers.
    usage.event = { shiftKey: true };
    usage.midiOptions = { configureDialog: false, workflowOptions };
  } else if (Object.keys(workflowOptions).length > 0) {
    usage.midiOptions = { workflowOptions };
  }
  return usage;
}

/**
 * Anti-corruption layer for the native item-activation pipeline (activity.use
 * / item.use), including the AoE template auto-placement hack, the one-shot
 * roll hooks that carry the caller's choices into dnd5e's subsequent rolls,
 * and — without Midi-QOL — the healing dnd5e only offers as a card button.
 */
export class Dnd5eItemActivationGateway implements ItemActivationPort {
  describe(actorId: string, itemId: string): ItemDescription {
    const { item } = this.resolve(actorId, itemId, undefined);
    return { itemId: item.id, itemName: item.name, itemType: item.type };
  }

  async activate(
    actorId: string,
    itemId: string,
    options: ActivateItemOptions
  ): Promise<ActivationUseOutcome> {
    const { actor, item, tokenId } = this.resolve(actorId, itemId, options.attackerTokenId);
    const activity = resolveActivity(item, {
      activityId: options.activityId,
      activityType: options.activityType
    });

    if (options.templatePosition) {
      setupAutoTemplatePlace(options.templatePosition);
    }

    const usage = buildUsageConfig(options);
    const config = Object.keys(usage).length > 0 ? usage : undefined;
    const dialog = { configure: !options.fastForward };
    const message = { create: true };
    const midiActive = isMidiQolActive();

    const hooks = new ActivationRollHooks(getHooks(), item, activity?._id, options);
    hooks.arm();

    let useResult: FoundryUsageResult | null;
    try {
      useResult = activity
        ? await activity.use(config, dialog, message)
        : await item.use(config, dialog, message);
    } catch (error) {
      hooks.dispose();
      throw error;
    }

    const outcome: MutableActivationUseOutcome = {
      itemId: item.id,
      itemName: item.name,
      itemType: item.type,
      rolls: toRollOutcomes(useResult?.rolls)
    };
    if (activity) {
      outcome.activityUsed = { id: activity._id, name: activity.name, type: activity.type };
    }
    if (useResult?.message) {
      outcome.chatMessageId = useResult.message.id;
    }

    if (!midiActive && activity && options.fastForward) {
      await this.collectVanillaRolls(activity, actor, tokenId, hooks, outcome);
    }

    outcome.deferredCleanup = async (): Promise<void> => {
      hooks.dispose();
      if (hooks.deferredDelete) {
        await actor.items.get(item.id)?.delete?.();
      }
    };
    return outcome;
  }

  // dnd5e rolls after use() without awaiting: wait for that roll so the answer
  // carries it, and apply healing itself since vanilla only offers a button.
  private async collectVanillaRolls(
    activity: FoundryActivity,
    actor: FoundryItemActionActor,
    tokenId: string | undefined,
    hooks: ActivationRollHooks,
    outcome: MutableActivationUseOutcome
  ): Promise<void> {
    if (!ROLLING_ACTIVITY_TYPES.has(activity.type)) {
      return;
    }
    const rolled =
      activity.type === 'attack'
        ? await hooks.waitForAttack(SUBSEQUENT_ROLL_WAIT_MS)
        : activity.type === 'save'
          ? true
          : await hooks.waitForDamage(SUBSEQUENT_ROLL_WAIT_MS);

    outcome.rolls = [...outcome.rolls, ...toRollOutcomes(hooks.attackRolls), ...toRollOutcomes(hooks.damageRolls)];

    if (!rolled && activity.type !== 'save') {
      outcome.warning = 'no_roll_performed';
      return;
    }

    if (activity.type === 'heal' && hooks.damageRolls.length > 0) {
      const total = hooks.damageRolls.reduce((sum, roll) => sum + roll.total, 0);
      const applied = await this.applyHealing(activity, actor, tokenId, total);
      if (applied) {
        outcome.appliedHealing = applied;
      }
    }
  }

  private async applyHealing(
    activity: FoundryActivity,
    actor: FoundryItemActionActor,
    tokenId: string | undefined,
    total: number
  ): Promise<AppliedHitPoints | undefined> {
    const recipients: Array<{ key: string; actor: FoundryItemActionActor }> = [];
    if (affectsSelf(activity)) {
      recipients.push({ key: tokenId ?? actor.getActiveTokens?.()[0]?.id ?? actor.id, actor });
    } else {
      for (const token of getGame().user.targets) {
        if (token.actor && token.id) {
          recipients.push({ key: token.id, actor: token.actor });
        }
      }
    }

    const applied: Record<string, HitPointsDelta> = {};
    for (const { key, actor: target } of recipients) {
      const before = target.system?.attributes?.hp;
      if (!before || !target.applyDamage) continue;
      const hpBefore = before.value;
      const tempBefore = before.temp ?? 0;
      await target.applyDamage([{ value: total, type: 'healing' }]);
      const after = target.system?.attributes?.hp;
      applied[key] = {
        applied: true,
        hpBefore,
        hpAfter: after?.value ?? hpBefore,
        tempBefore,
        tempAfter: after?.temp ?? tempBefore
      };
    }
    return Object.keys(applied).length > 0 ? applied : undefined;
  }

  private resolve(
    actorId: string,
    itemId: string,
    attackerTokenId: string | undefined
  ): { actor: FoundryItemActionActor; item: FoundryItem; tokenId: string | undefined } {
    const game = getGame();
    const worldActor = game.actors.get(actorId);
    if (!worldActor) {
      throw new ActorNotFoundError(actorId);
    }

    let actor = worldActor;
    let tokenId: string | undefined;
    if (attackerTokenId !== undefined) {
      const token = this.resolveAttackerToken(attackerTokenId, actorId);
      actor = token.actor ?? worldActor;
      tokenId = attackerTokenId;
      // Midi-QOL and the chat speaker pick a controlled token first.
      token.control?.({ releaseOthers: true });
    }

    const item = actor.items.get(itemId);
    if (!item) {
      throw new ItemNotFoundError(itemId);
    }
    return { actor, item, tokenId };
  }

  private resolveAttackerToken(tokenId: string, actorId: string): FoundryTargetToken {
    const token = getCanvas().tokens.get(tokenId);
    if (!token) {
      throw new TargetTokenNotFoundError(tokenId);
    }
    if (!token.actor) {
      throw new ValidationError(`Token has no actor: ${tokenId}`);
    }
    if (token.actor.id !== actorId) {
      throw new ValidationError(`Token ${tokenId} does not belong to actor ${actorId}`);
    }
    return token;
  }
}
