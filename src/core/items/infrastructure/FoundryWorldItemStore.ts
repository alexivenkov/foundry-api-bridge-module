import type { GameProvider } from '@/core/shared';
import type {
  WorldItem,
  WorldItemChanges,
  WorldItemDetails,
  WorldItemDraft,
  WorldItemStore
} from '@/core/items/domain';
import type { FoundryItemGame, FoundryItemOwnersGame, FoundryWorldItemDocument } from './foundryItemTypes';
import {
  toFoundryWorldItemCreateData,
  toFoundryWorldItemUpdateData,
  toWorldItem,
  toWorldItemDetails
} from './itemMapper';

export type WorldItemGameProvider = GameProvider<FoundryItemGame>;
export type ActorInventoryGameProvider = GameProvider<FoundryItemOwnersGame>;

/** The provider the context's services share: the real `game` serves both. */
export type ItemGameProvider = GameProvider<FoundryItemGame & FoundryItemOwnersGame>;

/**
 * Anti-corruption layer over the world's Item documents. A missing collection
 * is tolerated, as these commands always did: reads then find nothing.
 */
export class FoundryWorldItemStore implements WorldItemStore {
  constructor(private readonly gameProvider: WorldItemGameProvider) {}

  listItems(): readonly WorldItemDetails[] {
    const items: WorldItemDetails[] = [];
    this.gameProvider.getGame().items?.forEach((document) => {
      items.push(toWorldItemDetails(document));
    });
    return items;
  }

  findItem(itemId: string): WorldItemDetails | null {
    const document = this.find(itemId);
    return document ? toWorldItemDetails(document) : null;
  }

  hasItem(itemId: string): boolean {
    return Boolean(this.find(itemId));
  }

  async createItem(draft: WorldItemDraft): Promise<WorldItem | null> {
    const items = this.gameProvider.getGame().items;
    if (items === undefined) {
      return null;
    }
    const document = await items.documentClass.create(toFoundryWorldItemCreateData(draft));
    return document ? toWorldItem(document) : null;
  }

  async updateItem(itemId: string, changes: WorldItemChanges): Promise<WorldItem | null> {
    const document = this.find(itemId);
    if (!document) {
      return null;
    }
    await document.update(toFoundryWorldItemUpdateData(changes));
    return toWorldItem(document);
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.find(itemId)?.delete();
  }

  private find(itemId: string): FoundryWorldItemDocument | undefined {
    return this.gameProvider.getGame().items?.get(itemId);
  }
}
