import type {
  ActivationStatus,
  ActivationUseOutcome,
  ActivityUsedInfo,
  AppliedHitPoints,
  DialogWatch,
  DialogWatchPort,
  ItemActivationOutcome,
  ItemActivationPort,
  MidiCaptureResult,
  MidiWorkflowCapture,
  MidiWorkflowOutcome,
  MidiWorkflowPort,
  TargetingPort,
  UserDialogKind
} from '@/systems/dnd5e/item-actions/domain';
import type { ActivateItemCommand } from './ItemActionCommands';

interface MutableItemActivationOutcome {
  itemId: string;
  itemName: string;
  itemType: string;
  activated: boolean;
  status: ActivationStatus;
  dialog?: UserDialogKind;
  targetsSet: number;
  rolls: ActivationUseOutcome['rolls'];
  activityUsed?: ActivityUsedInfo;
  chatMessageId?: string;
  workflow?: MidiWorkflowOutcome;
  appliedDamage?: AppliedHitPoints;
  appliedHealing?: AppliedHitPoints;
  warning?: string;
}

type UseOrDialog =
  | { readonly kind: 'used'; readonly used: ActivationUseOutcome }
  | { readonly kind: 'dialog'; readonly dialog: UserDialogKind };

type CaptureOrDialog =
  | { readonly kind: 'capture'; readonly result: MidiCaptureResult }
  | { readonly kind: 'dialog'; readonly dialog: UserDialogKind };

/**
 * Orchestrates the load-bearing ordering of an item activation:
 *   set targets -> arm Midi capture and dialog watch (before use) -> activate
 *   -> await the Midi workflow, answering at once if a dialog opens instead.
 * A dialog never makes the command wait for a human: the answer says which
 * dialog is open and the use finishes on its own once the GM clicks.
 */
export class Dnd5eItemActivationService {
  constructor(
    private readonly activation: ItemActivationPort,
    private readonly targeting: TargetingPort,
    private readonly midi: MidiWorkflowPort,
    private readonly dialogs: DialogWatchPort
  ) {}

  async activate(command: ActivateItemCommand): Promise<ItemActivationOutcome> {
    const targetsSet =
      command.targetTokenIds.length > 0 ? this.targeting.setTargets(command.targetTokenIds) : 0;

    const capture = this.midi.isActive() ? this.midi.captureNext() : undefined;
    const watch = this.dialogs.watch();

    const usePromise = this.activation.activate(command.actorId, command.itemId, {
      activityId: command.activityId,
      activityType: command.activityType,
      templatePosition: command.templatePosition,
      spellLevel: command.spellLevel,
      attackerTokenId: command.attackerTokenId,
      attackMode: command.attackMode,
      ammunition: command.ammunition,
      consume: command.consume,
      fastForward: command.fastForward,
      advantage: command.advantage,
      disadvantage: command.disadvantage,
      attackBonus: command.attackBonus,
      damageBonus: command.damageBonus,
      targetAcBonus: command.targetAcBonus
    });

    let first: UseOrDialog;
    try {
      first = await Promise.race<UseOrDialog>([
        usePromise.then((used) => ({ kind: 'used', used })),
        watch.awaitDialog().then((dialog) => ({ kind: 'dialog', dialog }))
      ]);
    } catch (error) {
      capture?.cancel();
      watch.cancel();
      throw error;
    }

    if (first.kind === 'dialog') {
      // The use is parked on a human; it resolves on its own once they click.
      usePromise.then(this.finishLater.bind(this), () => undefined);
      capture?.cancel();
      watch.cancel();
      const description = this.activation.describe(command.actorId, command.itemId);
      const parked: MutableItemActivationOutcome = {
        itemId: description.itemId,
        itemName: description.itemName,
        itemType: description.itemType,
        activated: false,
        status: 'awaiting_user_dialog',
        dialog: first.dialog,
        targetsSet,
        rolls: []
      };
      return parked;
    }

    const used = first.used;
    const outcome: MutableItemActivationOutcome = {
      itemId: used.itemId,
      itemName: used.itemName,
      itemType: used.itemType,
      activated: true,
      status: 'completed',
      targetsSet,
      rolls: used.rolls
    };
    if (used.activityUsed) {
      outcome.activityUsed = used.activityUsed;
    }
    if (used.chatMessageId !== undefined) {
      outcome.chatMessageId = used.chatMessageId;
    }
    if (used.appliedHealing) {
      outcome.appliedHealing = used.appliedHealing;
    }
    if (used.warning !== undefined) {
      outcome.warning = used.warning;
    }

    if (capture) {
      await this.awaitWorkflow(capture, watch, used, outcome);
    }
    watch.cancel();

    if (used.deferredCleanup) {
      if (outcome.status === 'awaiting_user_dialog') {
        this.cleanupAfterWorkflow(used.deferredCleanup);
      } else {
        await used.deferredCleanup();
      }
    }

    return outcome;
  }

  private async awaitWorkflow(
    capture: MidiWorkflowCapture,
    watch: DialogWatch,
    used: ActivationUseOutcome,
    outcome: MutableItemActivationOutcome
  ): Promise<void> {
    if (used.chatMessageId !== undefined) {
      capture.trackCard(used.chatMessageId);
    }
    const second = await Promise.race<CaptureOrDialog>([
      capture.await().then((result) => ({ kind: 'capture', result })),
      watch.awaitDialog().then((dialog) => ({ kind: 'dialog', dialog }))
    ]);

    if (second.kind === 'dialog') {
      capture.cancel();
      outcome.status = 'awaiting_user_dialog';
      outcome.dialog = second.dialog;
      return;
    }

    const result = second.result;
    if (result.kind === 'completed') {
      outcome.workflow = result.workflow;
      if (result.workflow.appliedDamage) {
        outcome.appliedDamage = result.workflow.appliedDamage;
      }
      if (result.workflow.appliedHealing) {
        outcome.appliedHealing = result.workflow.appliedHealing;
      }
    } else {
      outcome.status = result.kind === 'timeout' ? 'workflow_timeout' : 'workflow_aborted';
      outcome.warning = result.kind === 'timeout' ? 'midi_workflow_timeout' : 'midi_workflow_aborted';
    }
  }

  /** A use that finished after we answered: only its deferred cleanup is still ours to run. */
  private finishLater(used: ActivationUseOutcome): void {
    if (used.deferredCleanup) {
      this.cleanupAfterWorkflow(used.deferredCleanup);
    }
  }

  /** Runs the cleanup once the next Midi workflow ends (or its wait expires), without blocking the answer. */
  private cleanupAfterWorkflow(cleanup: () => Promise<void>): void {
    const run = (): void => {
      void cleanup().catch(() => undefined);
    };
    if (!this.midi.isActive()) {
      run();
      return;
    }
    const capture = this.midi.captureNext();
    void capture.await().then(run, run);
  }
}
