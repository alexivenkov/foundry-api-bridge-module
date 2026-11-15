import { refuseNewScriptCarriers } from '@/kernel';
import {
  ItemCreationCancelledError,
  ItemNotFoundError,
  type WorldItem,
  type ScriptCarrierPolicy,
  type WorldItemDetails,
  type WorldItemStore
} from '@/core/items/domain';
import type { CreateItemCommand, DeleteItemCommand, GetItemQuery, UpdateItemCommand } from './commands';

export interface WorldItemServiceDependencies {
  readonly items: WorldItemStore;
  /** Absent: item data that automation modules run is refused. */
  readonly scripts?: ScriptCarrierPolicy | undefined;
}

const NO_SCRIPTS: ScriptCarrierPolicy = { allowsScripts: () => false };

/** The items of the world's Items directory. */
export class WorldItemService {
  constructor(private readonly deps: WorldItemServiceDependencies) {}

  listItems(): readonly WorldItemDetails[] {
    return this.deps.items.listItems();
  }

  getItem(query: GetItemQuery): WorldItemDetails {
    const item = this.deps.items.findItem(query.itemId);
    if (item === null) {
      throw new ItemNotFoundError(query.itemId);
    }
    return item;
  }

  async createItem(command: CreateItemCommand): Promise<WorldItem> {
    refuseNewScriptCarriers('Item', command.draft, () => this.allowsScripts());
    const item = await this.deps.items.createItem(command.draft);
    if (item === null) {
      throw new ItemCreationCancelledError();
    }
    return item;
  }

  async updateItem(command: UpdateItemCommand): Promise<WorldItem> {
    refuseNewScriptCarriers('Item', command.changes, () => this.allowsScripts(), () => ({
      system: this.getItem({ itemId: command.itemId }).system
    }));
    const item = await this.deps.items.updateItem(command.itemId, command.changes);
    if (item === null) {
      throw new ItemNotFoundError(command.itemId);
    }
    return item;
  }

  async deleteItem(command: DeleteItemCommand): Promise<void> {
    if (!this.deps.items.hasItem(command.itemId)) {
      throw new ItemNotFoundError(command.itemId);
    }
    await this.deps.items.deleteItem(command.itemId);
  }

  private allowsScripts(): boolean {
    return (this.deps.scripts ?? NO_SCRIPTS).allowsScripts();
  }
}
