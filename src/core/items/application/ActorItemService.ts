import { refuseNewScriptCarriers } from '@/kernel';
import {
  requireActor,
  type ActorLocator,
  type ActorTarget,
  type LocatedActor,
  type SceneLocator
} from '@/core/shared';
import {
  ItemNotFoundError,
  OwnedItemCreationFailedError,
  OwnedItemUpdateFailedError,
  matchesInventoryFilter,
  type ActorInventory,
  type InventoryItem,
  type ItemOwner,
  type OwnedItem,
  type OwnedItemSources,
  type ScriptCarrierPolicy
} from '@/core/items/domain';
import type {
  AddActorItemCommand,
  ListActorItemsQuery,
  RemoveActorItemCommand,
  UpdateActorItemCommand
} from './commands';

export interface ActorItemServiceDependencies {
  readonly scenes: SceneLocator;
  readonly actors: ActorLocator;
  readonly inventory: ActorInventory;
  /** Absent: item data that automation modules run is refused. */
  readonly scripts?: ScriptCarrierPolicy | undefined;
  /** Absent: a carrier sent again unchanged counts as new. */
  readonly sources?: OwnedItemSources | undefined;
}

const NO_SCRIPTS: ScriptCarrierPolicy = { allowsScripts: () => false };

export interface ActorItemsResult {
  readonly owner: ItemOwner;
  readonly items: readonly InventoryItem[];
}

export interface OwnedItemResult {
  readonly owner: ItemOwner;
  readonly item: OwnedItem;
}

/**
 * The items one actor owns: a world actor, or one token's own actor — an
 * unlinked token keeps its items to itself.
 */
export class ActorItemService {
  constructor(private readonly deps: ActorItemServiceDependencies) {}

  listItems(query: ListActorItemsQuery): ActorItemsResult {
    const actor = this.requireActor(query.target);
    const items = this.deps.inventory
      .listItems(actor.ref)
      .filter((item) => matchesInventoryFilter(item, query.filter));
    return { owner: { id: actor.id, name: actor.name }, items };
  }

  async addItem(command: AddActorItemCommand): Promise<OwnedItemResult> {
    const actor = this.requireActor(command.target);
    refuseNewScriptCarriers('Item', command.draft, () => this.allowsScripts());
    const item = await this.deps.inventory.addItem(actor.ref, command.draft);
    if (item === null) {
      throw new OwnedItemCreationFailedError();
    }
    return { owner: this.ownerAfterWrite(actor), item };
  }

  async updateItem(command: UpdateActorItemCommand): Promise<OwnedItemResult> {
    const actor = this.requireActor(command.target);
    this.requireItem(actor, command.itemId);
    refuseNewScriptCarriers('Item', command.changes, () => this.allowsScripts(), () => ({
      system: this.deps.sources?.storedSystem(actor.ref, command.itemId) ?? {}
    }));
    const item = await this.deps.inventory.updateItem(actor.ref, command.itemId, command.changes);
    if (item === null) {
      throw new OwnedItemUpdateFailedError();
    }
    return { owner: this.ownerAfterWrite(actor), item };
  }

  async removeItem(command: RemoveActorItemCommand): Promise<void> {
    const actor = this.requireActor(command.target);
    this.requireItem(actor, command.itemId);
    await this.deps.inventory.removeItem(actor.ref, command.itemId);
  }

  private requireActor(target: ActorTarget): LocatedActor {
    return requireActor(this.deps.scenes, this.deps.actors, target);
  }

  /** Commands run concurrently: the owner is reported as it is once the write is done. */
  private ownerAfterWrite(actor: LocatedActor): ItemOwner {
    return this.deps.inventory.findOwner(actor.ref) ?? { id: actor.id, name: actor.name };
  }

  private allowsScripts(): boolean {
    return (this.deps.scripts ?? NO_SCRIPTS).allowsScripts();
  }

  private requireItem(actor: LocatedActor, itemId: string): void {
    if (!this.deps.inventory.hasItem(actor.ref, itemId)) {
      throw new ItemNotFoundError(itemId);
    }
  }
}
