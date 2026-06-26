import {
  ActorNotFoundError,
  ItemNotFoundError,
  ValidationError
} from '@/systems/shared/domain/errors';
import type {
  ConsumableUseOutcome,
  SpellCastOutcome,
  ItemPostOutcome,
  ItemUseOptions,
  Pf2eItemUsePort
} from '@/systems/pf2e/item-use/domain';
import type {
  CastOptions,
  FoundryItemUseActor,
  FoundryPf2eItemUseGame,
  FoundryUsableItem
} from './foundryPf2eItemUseTypes';

/**
 * Anti-corruption layer between the PF2e item-use port and the per-type Foundry
 * APIs. Routing by item type lives here (all PF2e — not cross-system branching).
 */
export class Pf2eItemUseGateway implements Pf2eItemUsePort {
  constructor(private readonly game: FoundryPf2eItemUseGame) {}

  useConsumable(actorId: string, itemId: string, quantity: number): Promise<ConsumableUseOutcome> {
    return this.withActor(actorId, async (actor) => {
      const item = this.requireItem(actor, itemId);
      if (item.type !== 'consumable') {
        throw new ValidationError(`Item ${itemId} is not a consumable (type: ${item.type})`);
      }
      if (!item.consume) {
        throw new ValidationError(`Item ${itemId} cannot be consumed`);
      }
      const itemName = item.name;
      await item.consume(quantity);
      const after = actor.items.get(itemId);
      return {
        itemId,
        itemName,
        consumed: true,
        remainingUses: after?.system?.uses?.value ?? null,
        remainingQuantity: after?.quantity ?? null
      };
    });
  }

  castSpell(
    actorId: string,
    spellId: string,
    rank: number | undefined,
    options: ItemUseOptions
  ): Promise<SpellCastOutcome> {
    return this.withActor(actorId, async (actor) => {
      const spell = this.requireItem(actor, spellId);
      if (spell.type !== 'spell') {
        throw new ValidationError(`Item ${spellId} is not a spell (type: ${spell.type})`);
      }
      const entry = spell.spellcasting;
      if (!entry) {
        throw new ValidationError(`Spell ${spellId} has no spellcasting entry`);
      }
      const castOptions: CastOptions = { message: options.showInChat };
      if (rank !== undefined) {
        castOptions.rank = rank;
      }
      await entry.cast(spell, castOptions);
      return {
        spellId,
        spellName: spell.name,
        rank: rank ?? spell.rank ?? 0,
        cast: true
      };
    });
  }

  postItem(actorId: string, itemId: string, options: ItemUseOptions): Promise<ItemPostOutcome> {
    return this.withActor(actorId, async (actor) => {
      const item = this.requireItem(actor, itemId);
      if (!item.toMessage) {
        throw new ValidationError(`Item ${itemId} cannot be posted to chat`);
      }
      const message = await item.toMessage(null, { create: options.showInChat });
      return {
        itemId,
        itemName: item.name,
        itemType: item.type,
        posted: true,
        chatMessageId: message?.id ?? null
      };
    });
  }

  private requireItem(actor: FoundryItemUseActor, itemId: string): FoundryUsableItem {
    const item = actor.items.get(itemId);
    if (!item) {
      throw new ItemNotFoundError(itemId);
    }
    return item;
  }

  private withActor<T>(
    actorId: string,
    fn: (actor: FoundryItemUseActor) => T | Promise<T>
  ): Promise<T> {
    const actor = this.game.actors.get(actorId);
    if (!actor) {
      return Promise.reject(new ActorNotFoundError(actorId));
    }
    return Promise.resolve(fn(actor));
  }
}
