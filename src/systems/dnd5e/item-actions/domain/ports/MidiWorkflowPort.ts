import type { MidiWorkflowOutcome } from '@/systems/dnd5e/item-actions/domain/ItemActivationOutcome';

export type MidiCaptureResult =
  | { readonly kind: 'completed'; readonly workflow: MidiWorkflowOutcome }
  | { readonly kind: 'timeout' }
  | { readonly kind: 'aborted' };

/**
 * A capture armed BEFORE the item is used. `await()` resolves once the
 * Midi-QOL workflow completes, is aborted or times out, and cleans up;
 * `cancel()` cleans up without waiting (used when activation fails before
 * completion). `trackCard()` names the usage card so its deletion — what
 * Midi does on abort — is reported instead of waited out.
 */
export interface MidiWorkflowCapture {
  await(): Promise<MidiCaptureResult>;
  trackCard(chatMessageId: string): void;
  cancel(): void;
}

export interface MidiWorkflowPort {
  isActive(): boolean;
  captureNext(): MidiWorkflowCapture;
}
