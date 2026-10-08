import type { RollOutcome } from '@/systems/shared/domain';
import type { ActivityUsedInfo } from '@/systems/dnd5e/item-actions/domain/UseItemOutcome';
import type { AppliedHitPoints } from '@/systems/dnd5e/item-actions/domain/ItemActivationOutcome';

export interface TemplatePosition {
  readonly x: number;
  readonly y: number;
  readonly direction?: number;
}

/** Which resources this use may consume; omitted fields follow the system's defaults. */
export interface ConsumeOptions {
  readonly spellSlot?: boolean;
  readonly itemUses?: boolean;
  readonly ammunition?: boolean;
}

export interface ActivateItemOptions {
  readonly activityId: string | undefined;
  readonly activityType: string | undefined;
  readonly templatePosition: TemplatePosition | undefined;
  readonly spellLevel: number | undefined;
  /** Act as this token (its actor for an unlinked token); otherwise the actor's first token. */
  readonly attackerTokenId: string | undefined;
  /** dnd5e attack mode (`oneHanded`, `twoHanded`, `offhand`, `thrown`, `thrown-offhand`). */
  readonly attackMode: string | undefined;
  /** Ammunition item id, or `false` to attack without consuming any. */
  readonly ammunition: string | false | undefined;
  readonly consume: ConsumeOptions | undefined;
  /** Skip every configuration dialog and auto-roll (default). */
  readonly fastForward: boolean;
  readonly advantage: boolean;
  readonly disadvantage: boolean;
  /** One-off bonus added to this attack roll (`2`, `"1d4"`). */
  readonly attackBonus: number | string | undefined;
  /** One-off bonus added to the first damage part (`"1d6"` for Sneak Attack). */
  readonly damageBonus: string | undefined;
  /** Added to every target's AC for this hit check only (Midi-QOL). */
  readonly targetAcBonus: number | undefined;
}

export interface ItemDescription {
  readonly itemId: string;
  readonly itemName: string;
  readonly itemType: string;
}

/** The use-only part of an activation (resolution + template + use + rolls). */
export interface ActivationUseOutcome extends ItemDescription {
  readonly activityUsed?: ActivityUsedInfo;
  readonly rolls: readonly RollOutcome[];
  readonly chatMessageId?: string;
  /** `no_roll_performed`: the system posted the card but never rolled. */
  readonly warning?: string;
  /** Healing the gateway applied itself (no Midi-QOL): per token or actor id. */
  readonly appliedHealing?: AppliedHitPoints;
  /** Work to finish once the rolls are over, e.g. deleting the last consumable. */
  readonly deferredCleanup?: () => Promise<void>;
}

export interface ItemActivationPort {
  /** Name and type of the item, for answers given before the use completed. */
  describe(actorId: string, itemId: string): ItemDescription;
  activate(
    actorId: string,
    itemId: string,
    options: ActivateItemOptions
  ): Promise<ActivationUseOutcome>;
}
