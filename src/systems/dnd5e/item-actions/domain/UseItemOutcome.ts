import type { RollOutcome } from '@/systems/shared/domain';

export interface ActivityUsedInfo {
  readonly id: string;
  readonly name: string;
  readonly type: string;
}

/**
 * Neutral read-model for an item-use. Application-level (lives in this
 * context's domain, not the shared kernel).
 */
export interface UseItemOutcome {
  readonly itemId: string;
  readonly itemName: string;
  readonly itemType: string;
  readonly activityUsed?: ActivityUsedInfo;
  readonly rolls: readonly RollOutcome[];
  readonly chatMessageId?: string;
}
