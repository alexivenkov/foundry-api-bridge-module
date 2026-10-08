import type { ActivateItemOptions } from '@/systems/dnd5e/item-actions/domain';
import type {
  ConsumptionUpdates,
  D20ProcessConfig,
  FoundryHooks,
  FoundryItem,
  FoundryRoll,
  MidiWorkflow,
  RollDialogHookConfig
} from './foundryItemActionTypes';

/** How long a vanilla subsequent roll (attack or damage/healing) is waited for. */
export const SUBSEQUENT_ROLL_WAIT_MS = 5000;
/** Hooks self-dispose after this, should the workflow never finish. */
const HOOK_LIFETIME_MS = 120000;

interface RollSubject {
  id?: string;
  _id?: string;
}

/**
 * One-shot dnd5e / Midi-QOL hooks scoped to a single activation. They carry
 * the caller's attack mode, ammunition, advantage and one-off bonuses into
 * the rolls dnd5e triggers after `activity.use()`, collect those rolls, and
 * keep the last consumable alive until the rolls are over.
 */
export class ActivationRollHooks {
  readonly attackRolls: FoundryRoll[] = [];
  readonly damageRolls: FoundryRoll[] = [];
  /** dnd5e wanted to delete the item while consuming it; the deletion is now ours. */
  deferredDelete = false;

  private readonly ids: Array<[string, number]> = [];
  private attackWaiters: Array<(rolled: boolean) => void> = [];
  private damageWaiters: Array<(rolled: boolean) => void> = [];
  private lifetime: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;

  constructor(
    private readonly hooks: FoundryHooks,
    private readonly item: FoundryItem,
    private readonly activityId: string | undefined,
    private readonly options: ActivateItemOptions
  ) {}

  arm(): void {
    this.on('dnd5e.preRollAttackV2', (config: D20ProcessConfig, dialog: RollDialogHookConfig) => {
      if (!this.isOurs(config.subject)) return;
      this.configureAttack(config, dialog);
    });
    this.on('dnd5e.preRollDamageV2', (config: D20ProcessConfig, dialog: RollDialogHookConfig) => {
      if (!this.isOurs(config.subject)) return;
      this.configureDamage(config, dialog);
    });
    this.on('dnd5e.rollAttackV2', (rolls: FoundryRoll[], context: { subject?: RollSubject }) => {
      if (!this.isOurs(context.subject)) return;
      this.attackRolls.push(...rolls);
      this.notify(this.attackWaiters, true);
    });
    this.on('dnd5e.rollDamageV2', (rolls: FoundryRoll[], context?: { subject?: RollSubject }) => {
      if (!this.isOurs(context?.subject)) return;
      this.damageRolls.push(...rolls);
      this.notify(this.damageWaiters, true);
    });
    this.on(
      'dnd5e.activityConsumption',
      (activity: RollSubject, _usage: unknown, _message: unknown, updates: ConsumptionUpdates) => {
        if (!this.isOurs(activity)) return;
        this.keepItemThroughRolls(updates);
      }
    );
    if (this.options.targetAcBonus !== undefined && this.options.targetAcBonus !== 0) {
      this.on('midi-qol.preCheckHits', (workflow: MidiWorkflow) => {
        if (!this.isOurs(workflow.activity) && workflow.item?.id !== this.item.id) return;
        this.raiseTargetAc(workflow, this.options.targetAcBonus ?? 0);
      });
    }
    this.lifetime = setTimeout(() => {
      this.dispose();
    }, HOOK_LIFETIME_MS);
  }

  /** Resolves true once an attack roll of this activation arrived, false on timeout. */
  waitForAttack(ms: number): Promise<boolean> {
    return this.waitFor(this.attackRolls, this.attackWaiters, ms);
  }

  /** Resolves true once a damage/healing roll of this activation arrived, false on timeout. */
  waitForDamage(ms: number): Promise<boolean> {
    return this.waitFor(this.damageRolls, this.damageWaiters, ms);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const [hook, id] of this.ids) {
      this.hooks.off(hook, id);
    }
    this.ids.length = 0;
    if (this.lifetime !== undefined) {
      clearTimeout(this.lifetime);
      this.lifetime = undefined;
    }
    this.notify(this.attackWaiters, false);
    this.notify(this.damageWaiters, false);
  }

  private on(hook: string, callback: (...args: never[]) => unknown): void {
    this.ids.push([hook, this.hooks.on(hook, callback)]);
  }

  // Without a resolved activity (item.use fallback) the first roll is ours.
  private isOurs(subject: RollSubject | undefined): boolean {
    if (this.activityId === undefined) return true;
    return subject?.id === this.activityId || subject?._id === this.activityId;
  }

  private configureAttack(config: D20ProcessConfig, dialog: RollDialogHookConfig): void {
    const roll = config.rolls?.[0];
    const { attackMode, ammunition, consume, advantage, disadvantage, attackBonus, fastForward } = this.options;

    if (attackMode !== undefined) {
      config.attackMode = attackMode;
      if (roll) roll.options = { ...(roll.options ?? {}), attackMode };
    }
    const ammo = ammunition !== undefined ? ammunition : consume?.ammunition === false ? false : undefined;
    if (ammo !== undefined) {
      config.ammunition = ammo;
      if (roll) roll.options = { ...(roll.options ?? {}), ammunition: ammo };
    }
    if (advantage) config.advantage = true;
    if (disadvantage) config.disadvantage = true;
    if (attackBonus !== undefined && roll) {
      roll.parts = [...(roll.parts ?? []), String(attackBonus)];
    }
    if (fastForward) dialog.configure = false;
  }

  private configureDamage(config: D20ProcessConfig, dialog: RollDialogHookConfig): void {
    const roll = config.rolls?.[0];
    if (this.options.damageBonus !== undefined && roll) {
      roll.parts = [...(roll.parts ?? []), this.options.damageBonus];
    }
    if (this.options.fastForward) dialog.configure = false;
  }

  // dnd5e deletes an auto-destroy consumable inside use(), before its own
  // healing roll and before Midi's workflow has read it. Keep it at quantity 0
  // and delete it once the rolls are over.
  private keepItemThroughRolls(updates: ConsumptionUpdates): void {
    const index = updates.delete?.indexOf(this.item.id) ?? -1;
    if (index < 0 || !updates.delete) return;
    updates.delete.splice(index, 1);
    updates.item ??= [];
    const existing = updates.item.find((u) => u['_id'] === this.item.id);
    if (existing) {
      existing['system.quantity'] = 0;
    } else {
      updates.item.push({ _id: this.item.id, 'system.quantity': 0 });
    }
    this.deferredDelete = true;
  }

  private raiseTargetAc(workflow: MidiWorkflow, bonus: number): void {
    const modifiers = workflow.targetACModifiers;
    if (!modifiers) return;
    for (const target of workflow.targets ?? []) {
      const uuid = target.actor?.uuid;
      if (!uuid) continue;
      modifiers.set(uuid, (modifiers.get(uuid) ?? 0) + bonus);
    }
  }

  private waitFor(
    rolls: FoundryRoll[],
    waiters: Array<(rolled: boolean) => void>,
    ms: number
  ): Promise<boolean> {
    if (rolls.length > 0) return Promise.resolve(true);
    if (this.disposed) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        const index = waiters.indexOf(done);
        if (index >= 0) waiters.splice(index, 1);
        resolve(false);
      }, ms);
      const done = (rolled: boolean): void => {
        clearTimeout(timer);
        resolve(rolled);
      };
      waiters.push(done);
    });
  }

  private notify(waiters: Array<(rolled: boolean) => void>, rolled: boolean): void {
    const pending = waiters.splice(0, waiters.length);
    for (const waiter of pending) {
      waiter(rolled);
    }
  }
}
