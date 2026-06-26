export interface ConsumableUseOutcome {
  readonly itemId: string;
  readonly itemName: string;
  readonly consumed: true;
  readonly remainingUses: number | null;
  readonly remainingQuantity: number | null;
}

export interface SpellCastOutcome {
  readonly spellId: string;
  readonly spellName: string;
  readonly rank: number;
  readonly cast: true;
}

export interface ItemPostOutcome {
  readonly itemId: string;
  readonly itemName: string;
  readonly itemType: string;
  readonly posted: true;
  readonly chatMessageId: string | null;
}
