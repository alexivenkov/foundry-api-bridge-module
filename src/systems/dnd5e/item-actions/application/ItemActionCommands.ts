export interface UseItemCommand {
  readonly actorId: string;
  readonly itemId: string;
  readonly activityId: string | undefined;
  readonly activityType: string | undefined;
  readonly consume: boolean;
  readonly scaling: number | false;
  readonly showInChat: boolean;
}

export interface ActivateItemCommand {
  readonly actorId: string;
  readonly itemId: string;
  readonly activityId: string | undefined;
  readonly activityType: string | undefined;
  readonly targetTokenIds: readonly string[];
  readonly templatePosition: { x: number; y: number; direction?: number } | undefined;
  readonly spellLevel: number | undefined;
  readonly attackerTokenId: string | undefined;
  readonly attackMode: string | undefined;
  readonly ammunition: string | false | undefined;
  readonly consume: { spellSlot?: boolean; itemUses?: boolean; ammunition?: boolean } | undefined;
  readonly fastForward: boolean;
  readonly advantage: boolean;
  readonly disadvantage: boolean;
  readonly attackBonus: number | string | undefined;
  readonly damageBonus: string | undefined;
  readonly targetAcBonus: number | undefined;
}
