import type { RollOutcome } from '@/systems/shared/domain';
import type { ActivityUsedInfo } from '@/systems/dnd5e/item-actions/domain/UseItemOutcome';

export interface TemplatePosition {
  readonly x: number;
  readonly y: number;
  readonly direction?: number;
}

export interface ActivateItemOptions {
  readonly activityId: string | undefined;
  readonly activityType: string | undefined;
  readonly templatePosition: TemplatePosition | undefined;
  readonly spellLevel: number | undefined;
}

/** The use-only part of an activation (resolution + template + use + rolls). */
export interface ActivationUseOutcome {
  readonly itemId: string;
  readonly itemName: string;
  readonly itemType: string;
  readonly activityUsed?: ActivityUsedInfo;
  readonly rolls: readonly RollOutcome[];
  readonly chatMessageId?: string;
}

export interface ItemActivationPort {
  activate(
    actorId: string,
    itemId: string,
    options: ActivateItemOptions
  ): Promise<ActivationUseOutcome>;
}
