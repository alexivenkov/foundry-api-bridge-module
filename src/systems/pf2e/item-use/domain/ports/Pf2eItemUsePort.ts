import type {
  ConsumableUseOutcome,
  SpellCastOutcome,
  ItemPostOutcome
} from '@/systems/pf2e/item-use/domain/ItemUseOutcome';

export interface ItemUseOptions {
  readonly showInChat: boolean;
}

/**
 * Outbound port for using PF2e items. PF2e has no generic `item.use()`, so the
 * entry points are per type: consumables via `consume()`, spells via the
 * spellcasting entry's `cast()`, and any item posted to chat via `toMessage()`.
 */
export interface Pf2eItemUsePort {
  useConsumable(actorId: string, itemId: string, quantity: number): Promise<ConsumableUseOutcome>;
  castSpell(
    actorId: string,
    spellId: string,
    rank: number | undefined,
    options: ItemUseOptions
  ): Promise<SpellCastOutcome>;
  postItem(actorId: string, itemId: string, options: ItemUseOptions): Promise<ItemPostOutcome>;
}
