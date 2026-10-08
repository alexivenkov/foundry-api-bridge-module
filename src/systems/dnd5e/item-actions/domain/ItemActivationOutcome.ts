import type { RollOutcome } from '@/systems/shared/domain';
import type { ActivityUsedInfo } from './UseItemOutcome';
import type { UserDialogKind } from './ports/DialogWatchPort';

/** HP of one target before and after the workflow applied damage or healing. */
export interface HitPointsDelta {
  readonly applied: boolean;
  readonly hpBefore: number;
  readonly hpAfter: number;
  readonly tempBefore?: number;
  readonly tempAfter?: number;
}

/** Keyed by token id (actor id when the target has no token). */
export type AppliedHitPoints = Readonly<Record<string, HitPointsDelta>>;

export interface MidiWorkflowOutcome {
  readonly attackTotal: number | undefined;
  readonly damageTotal: number | undefined;
  readonly isCritical: boolean;
  readonly isFumble: boolean;
  readonly hitTargetIds: readonly string[];
  readonly saveTargetIds: readonly string[];
  readonly failedSaveTargetIds: readonly string[];
  readonly appliedDamage?: AppliedHitPoints;
  readonly appliedHealing?: AppliedHitPoints;
}

/**
 * `completed`: rolls are done (vanilla: the card is posted and auto-rolls ran).
 * `awaiting_user_dialog`: a dialog opened on the GM's client; the use goes on
 * once a human answers it. `workflow_timeout` / `workflow_aborted`: Midi-QOL
 * never reported completion, or deleted the card.
 */
export type ActivationStatus = 'completed' | 'awaiting_user_dialog' | 'workflow_timeout' | 'workflow_aborted';

export interface ItemActivationOutcome {
  readonly itemId: string;
  readonly itemName: string;
  readonly itemType: string;
  readonly activated: boolean;
  readonly status: ActivationStatus;
  readonly dialog?: UserDialogKind;
  readonly targetsSet: number;
  readonly rolls: readonly RollOutcome[];
  readonly activityUsed?: ActivityUsedInfo;
  readonly chatMessageId?: string;
  readonly workflow?: MidiWorkflowOutcome;
  readonly appliedDamage?: AppliedHitPoints;
  readonly appliedHealing?: AppliedHitPoints;
  readonly warning?: string;
}
