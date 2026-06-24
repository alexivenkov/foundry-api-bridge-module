import type {
  MidiWorkflowCapture,
  MidiWorkflowOutcome,
  MidiWorkflowPort
} from '@/systems/dnd5e/item-actions/domain';
import { getHooks, isMidiQolActive, type MidiWorkflow } from './foundryItemActionTypes';

const MIDI_WORKFLOW_TIMEOUT = 30000;

function toMidiWorkflowOutcome(workflow: MidiWorkflow): MidiWorkflowOutcome {
  return {
    attackTotal: workflow.attackTotal,
    damageTotal: workflow.damageTotal,
    isCritical: workflow.isCritical ?? false,
    isFumble: workflow.isFumble ?? false,
    hitTargetIds: [...(workflow.hitTargets ?? [])].map((t) => t.id),
    saveTargetIds: [...(workflow.saves ?? [])].map((t) => t.id),
    failedSaveTargetIds: [...(workflow.failedSaves ?? [])].map((t) => t.id)
  };
}

/**
 * Anti-corruption layer over the Midi-QOL hook. `captureNext()` arms the
 * `midi-qol.RollComplete` listener (racing a 30s timeout) immediately, so the
 * caller must arm it BEFORE triggering the item use; `await()` resolves the
 * captured workflow (or undefined on timeout) and removes the hook.
 */
export class Dnd5eMidiWorkflowGateway implements MidiWorkflowPort {
  isActive(): boolean {
    return isMidiQolActive();
  }

  captureNext(): MidiWorkflowCapture {
    const hooks = getHooks();
    let hookId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const promise = Promise.race([
      new Promise<MidiWorkflow>((resolve) => {
        hookId = hooks.once('midi-qol.RollComplete', resolve);
      }),
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => {
          resolve(undefined);
        }, MIDI_WORKFLOW_TIMEOUT);
      })
    ]);

    const cleanup = (): void => {
      if (hookId !== undefined) {
        hooks.off('midi-qol.RollComplete', hookId);
      }
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };

    return {
      async await(): Promise<MidiWorkflowOutcome | undefined> {
        const workflow = await promise;
        cleanup();
        return workflow ? toMidiWorkflowOutcome(workflow) : undefined;
      },
      cancel: cleanup
    };
  }
}
