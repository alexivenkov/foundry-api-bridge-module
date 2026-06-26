/**
 * Minimal anti-corruption view of the PF2e item-use API (pf2e 7.12.2):
 * `consumable.consume()`, `entry.cast(spell)`, `item.toMessage()`.
 */

export interface FoundryChatMessage {
  id: string;
}

export interface FoundryConsumableUses {
  value: number;
  max: number;
}

export interface FoundryItemSystem {
  uses?: FoundryConsumableUses;
}

export interface CastOptions {
  rank?: number;
  message?: boolean;
}

export interface FoundrySpellcastingEntry {
  cast(spell: FoundryUsableItem, options: CastOptions): Promise<void>;
}

export interface ToMessageOptions {
  create?: boolean;
}

export interface FoundryUsableItem {
  id: string;
  name: string;
  type: string;
  quantity?: number;
  rank?: number;
  system?: FoundryItemSystem;
  spellcasting?: FoundrySpellcastingEntry | null;
  consume?(thisMany?: number): Promise<void>;
  toMessage?(event: null, options: ToMessageOptions): Promise<FoundryChatMessage | undefined>;
}

export interface FoundryItemUseItemsCollection {
  get(id: string): FoundryUsableItem | undefined;
}

export interface FoundryItemUseActor {
  id: string;
  name: string;
  items: FoundryItemUseItemsCollection;
}

export interface FoundryItemUseActorsCollection {
  get(id: string): FoundryItemUseActor | undefined;
}

export interface FoundryPf2eItemUseGame {
  actors: FoundryItemUseActorsCollection;
}

export function getPf2eItemUseGame(): FoundryPf2eItemUseGame {
  return (globalThis as unknown as { game: FoundryPf2eItemUseGame }).game;
}
