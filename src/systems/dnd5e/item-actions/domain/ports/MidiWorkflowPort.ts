import type { MidiWorkflowOutcome } from '@/systems/dnd5e/item-actions/domain/ItemActivationOutcome';

/**
 * A capture armed BEFORE the item is used. `await()` resolves once the
 * Midi-QOL workflow completes (or times out) and cleans up; `cancel()` cleans
 * up without waiting (used when activation fails before completion).
 */
export interface MidiWorkflowCapture {
  await(): Promise<MidiWorkflowOutcome | undefined>;
  cancel(): void;
}

export interface MidiWorkflowPort {
  isActive(): boolean;
  captureNext(): MidiWorkflowCapture;
}
