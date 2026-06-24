import type { RollOutcome } from '@/systems/shared/domain';
import type { ActivityUsedInfo } from './UseItemOutcome';

export interface MidiWorkflowOutcome {
  readonly attackTotal: number | undefined;
  readonly damageTotal: number | undefined;
  readonly isCritical: boolean;
  readonly isFumble: boolean;
  readonly hitTargetIds: readonly string[];
  readonly saveTargetIds: readonly string[];
  readonly failedSaveTargetIds: readonly string[];
}

export interface ItemActivationOutcome {
  readonly itemId: string;
  readonly itemName: string;
  readonly itemType: string;
  readonly activated: boolean;
  readonly targetsSet: number;
  readonly rolls: readonly RollOutcome[];
  readonly activityUsed?: ActivityUsedInfo;
  readonly chatMessageId?: string;
  readonly workflow?: MidiWorkflowOutcome;
}
