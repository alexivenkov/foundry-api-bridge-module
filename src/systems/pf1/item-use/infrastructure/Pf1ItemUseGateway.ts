import { ItemNotFoundError, RollResolutionError, ValidationError } from '@/systems/shared/domain/errors';
import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import {
  resolvePf1Actor,
  runForActor,
  toD20RollOutcome,
  toRollData,
  toRollOutcome,
  type FoundryPf1Actor,
  type FoundryPf1AttackDamage,
  type FoundryPf1ChatAttack,
  type FoundryPf1Game,
  type FoundryPf1Item,
  type FoundryPf1ItemUseParams,
  type FoundryPf1ItemUseResult,
  type FoundryPf1SharedActionData,
  type FoundryRollLike
} from '@/systems/pf1/shared/infrastructure';
import type {
  Pf1AttackOutcome,
  Pf1AttackRollOutcome,
  Pf1DamageRollOutcome,
  Pf1ItemUsePort,
  Pf1UseItemOutcome,
  UseItemOptions
} from '@/systems/pf1/item-use/domain';

// Also what an item without actions answers when it lacks charges: the system only shows a notification.
const USE_CANCELLED = 'Item use was refused or cancelled (not enough charges or uses, a module hook or an item script call)';

/** `pf1.actionUse.ERR_REQUIREMENT` codes (pf1 11.11 `action-use.mjs`). */
const REQUIREMENT_ERRORS: Record<number, string> = {
  1: 'no permission to use this actor',
  2: 'the item or action is disabled',
  3: 'not enough quantity',
  4: 'not enough charges or spell slots',
  5: 'no ammunition selected',
  6: 'not enough ammunition',
  7: 'the action type is not allowed'
};

/** `D20RollPF.defaultOptions.critical`. */
const DEFAULT_CRITICAL = 20;

/**
 * Anti-corruption layer over `ItemPF#use` (pf1 11.11). The system's dialogs are
 * skipped: the default (or given) action runs as a full attack with every
 * iterative, measure-template placement is turned off (it needs a canvas
 * click), and the GM's current targets are what the system sees. The rolls are
 * read back from the `ActionUse` the system answers, posted or not.
 */
export class Pf1ItemUseGateway implements Pf1ItemUsePort {
  constructor(private readonly game: FoundryPf1Game) {}

  async useItem(target: Pf1ActorTarget, itemRef: string, options: UseItemOptions): Promise<Pf1UseItemOutcome> {
    const { actor, tokenId } = resolvePf1Actor(this.game, target);
    const item = findItem(actor, itemRef);
    const actionId = options.actionId;
    if (actionId !== undefined) {
      requireAction(item, actionId);
    }

    const params: FoundryPf1ItemUseParams = {
      skipDialog: true,
      chatMessage: options.showInChat,
      options: { ...options.toggles, measureTemplate: false }
    };
    if (actionId !== undefined) {
      params.actionId = actionId;
    }
    if (options.cost !== undefined) {
      params.cost = options.cost;
    }
    if (options.rollMode !== undefined) {
      params.rollMode = options.rollMode;
    }

    // Queued per actor: charges, slots and ammo are read then written, like HP.
    const shared = sharedOf(await runForActor(actor, () => item.use(params)));
    const outcome: { -readonly [K in keyof Pf1UseItemOutcome]: Pf1UseItemOutcome[K] } = {
      actorId: actor.id,
      item: { id: item.id, name: item.name, type: item.type },
      // A spell without attack or damage still gets one ChatAttack for its notes; it carries no roll.
      attacks: (shared.chatAttacks ?? [])
        .filter((chatAttack) => chatAttack.attack !== null || chatAttack.damage.rolls.length > 0)
        .map(toAttackOutcome)
    };
    if (tokenId !== undefined) {
      outcome.tokenId = tokenId;
    }
    const action = shared.action;
    if (action?.id !== undefined) {
      outcome.action = { id: action.id, name: action.name ?? '' };
    }
    // `saveDC` is 0 for actions without a save, and for potions whose save the system never computes.
    if (typeof shared.save === 'string' && shared.save !== '' && typeof shared.saveDC === 'number' && shared.saveDC > 0) {
      outcome.save = { dc: shared.saveDC, type: shared.save };
    }
    const messageId = shared.message?.id;
    if (typeof messageId === 'string') {
      outcome.messageId = messageId;
    }
    return outcome;
  }
}

/** An item by id, else by name (case-insensitive); a name shared by several items is refused. */
function findItem(actor: FoundryPf1Actor, itemRef: string): FoundryPf1Item {
  const byId = actor.items.get(itemRef);
  if (byId) {
    return byId;
  }
  const needle = itemRef.trim().toLowerCase();
  const matches = actor.items.contents.filter((item) => item.name.trim().toLowerCase() === needle);
  if (matches.length > 1) {
    throw new ValidationError(
      `Several items are named ${itemRef}: ${matches.map((item) => item.id).join(', ')}. Pass the item id`
    );
  }
  const match = matches[0];
  if (!match) {
    throw new ItemNotFoundError(itemRef);
  }
  return match;
}

function requireAction(item: FoundryPf1Item, actionId: string): void {
  const actions = item.system.actions ?? [];
  if (!actions.some((action) => action._id === actionId)) {
    const known = actions.map((action) => `${action._id ?? '?'} (${action.name ?? ''})`).join(', ');
    throw new ValidationError(`Action not found on ${item.name}: ${actionId}. Actions: ${known === '' ? 'none' : known}`);
  }
}

/** The shared action data behind whatever `ItemPF#use` answered; refusals and cancellations become errors. */
function sharedOf(result: FoundryPf1ItemUseResult): FoundryPf1SharedActionData {
  if (result === null || result === undefined) {
    throw new RollResolutionError(USE_CANCELLED);
  }
  if ('err' in result) {
    const reason = REQUIREMENT_ERRORS[result.code] ?? `requirement ${String(result.code)} not met`;
    throw new ValidationError(`Item cannot be used: ${reason}`);
  }
  const shared = 'shared' in result ? result.shared : result;
  if (shared.reject === true || shared.scriptData?.reject === true) {
    throw new RollResolutionError(USE_CANCELLED);
  }
  return shared;
}

function toDamageRolls(damage: FoundryPf1AttackDamage): Pf1DamageRollOutcome[] {
  return damage.rolls.map((roll) => {
    const data = toRollData(roll);
    return { ...toRollOutcome(data), types: [...(data.options?.damageType ?? [])] };
  });
}

function toAttackRoll(roll: FoundryRollLike): Pf1AttackRollOutcome {
  const data = toRollData(roll);
  const d20 = toD20RollOutcome(data);
  const critical = data.options?.critical ?? DEFAULT_CRITICAL;
  return {
    ...d20,
    isThreat: d20.natural !== null && d20.natural >= critical,
    isNat1: !d20.isStatic && d20.natural === 1
  };
}

function toAttackOutcome(chatAttack: FoundryPf1ChatAttack): Pf1AttackOutcome {
  const damage = toDamageRolls(chatAttack.damage);
  const critDamage = toDamageRolls(chatAttack.critDamage);
  const outcome: { -readonly [K in keyof Pf1AttackOutcome]: Pf1AttackOutcome[K] } = {
    label: chatAttack.label ?? null,
    damage,
    damageTotal: chatAttack.damage.total ?? damage.reduce((sum, roll) => sum + roll.total, 0),
    critDamage,
    nonlethal: chatAttack.nonlethal === true
  };
  if (chatAttack.attack) {
    outcome.attack = toAttackRoll(chatAttack.attack);
  }
  if (chatAttack.critConfirm) {
    outcome.critConfirm = toD20RollOutcome(toRollData(chatAttack.critConfirm));
  }
  if (critDamage.length > 0) {
    outcome.critDamageTotal = chatAttack.critDamage.total ?? 0;
  }
  return outcome;
}
