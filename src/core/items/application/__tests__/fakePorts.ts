import {
  ActorNotFoundError,
  TargetTokenNotFoundError,
  type ActorIdentity,
  type ActorLocator,
  type ActorRef,
  type SceneIdentity,
  type SceneLocator,
  type TargetToken
} from '../../../shared';
import type {
  ActorInventory,
  InventoryItem,
  ItemOwner,
  OwnedItem,
  OwnedItemChanges,
  OwnedItemDraft,
  WorldItem,
  WorldItemChanges,
  WorldItemDetails,
  WorldItemDraft,
  WorldItemStore
} from '../../domain';

export function worldItem(overrides: Partial<WorldItemDetails> = {}): WorldItemDetails {
  return {
    id: 'i1',
    uuid: 'Item.i1',
    name: 'Longsword',
    type: 'weapon',
    img: 'sword.webp',
    folderName: null,
    system: { damage: '1d8' },
    ...overrides
  };
}

export function inventoryItem(
  overrides: Partial<InventoryItem> = {},
  traits: Partial<InventoryItem['traits']> = {}
): InventoryItem {
  return {
    id: 'i1',
    name: 'Longsword',
    type: 'weapon',
    img: 'sword.webp',
    traits: {
      equipped: true,
      quantity: 1,
      activityTypes: ['attack'],
      description: '',
      damage: null,
      range: null,
      ...traits
    },
    ...overrides
  };
}

export class FakeWorldItemStore implements WorldItemStore {
  readonly created: WorldItemDraft[] = [];
  readonly updated: Array<{ itemId: string; changes: WorldItemChanges }> = [];
  readonly deleted: string[] = [];
  createsNothing = false;

  constructor(private readonly items: readonly WorldItemDetails[] = []) {}

  listItems(): readonly WorldItemDetails[] {
    return this.items;
  }

  findItem(itemId: string): WorldItemDetails | null {
    return this.items.find((candidate) => candidate.id === itemId) ?? null;
  }

  hasItem(itemId: string): boolean {
    return this.findItem(itemId) !== null;
  }

  createItem(draft: WorldItemDraft): Promise<WorldItem | null> {
    this.created.push(draft);
    return Promise.resolve(this.createsNothing ? null : worldItem({ id: 'created', name: draft.name, type: draft.type }));
  }

  updateItem(itemId: string, changes: WorldItemChanges): Promise<WorldItem | null> {
    this.updated.push({ itemId, changes });
    const current = this.findItem(itemId);
    return Promise.resolve(current === null ? null : { ...current, name: changes.name ?? current.name });
  }

  deleteItem(itemId: string): Promise<void> {
    this.deleted.push(itemId);
    return Promise.resolve();
  }
}

/** A world with one scene, `cave`, holding the tokens given; it is the active scene unless told otherwise. */
export class FakeWorld implements SceneLocator, ActorLocator {
  activeSceneId: string | null = 'cave';

  constructor(
    private readonly worldActors: readonly ActorIdentity[],
    private readonly caveTokens: Readonly<Record<string, ActorIdentity | null>> = {}
  ) {}

  findScene(sceneId: string): SceneIdentity | null {
    return sceneId === 'cave' ? { id: 'cave', name: 'Cave' } : null;
  }

  findActiveScene(): SceneIdentity | null {
    return this.activeSceneId !== null ? this.findScene(this.activeSceneId) : null;
  }

  findWorldActor(actorId: string): ActorIdentity | null {
    return this.worldActors.find((candidate) => candidate.id === actorId) ?? null;
  }

  findToken(sceneId: string, tokenId: string): TargetToken | null {
    if (sceneId !== 'cave' || !(tokenId in this.caveTokens)) {
      return null;
    }
    return { id: tokenId, actor: this.caveTokens[tokenId] ?? null };
  }
}

export function keyOf(ref: ActorRef): string {
  return ref.kind === 'world' ? `world:${ref.actorId}` : `token:${ref.sceneId}:${ref.tokenId}`;
}

/** Owners and their items are kept per actor reference: `world:<actorId>` or `token:<sceneId>:<tokenId>`. */
export class FakeActorInventory implements ActorInventory {
  readonly added: Array<{ ref: ActorRef; draft: OwnedItemDraft }> = [];
  readonly updated: Array<{ ref: ActorRef; itemId: string; changes: OwnedItemChanges }> = [];
  readonly removed: Array<{ ref: ActorRef; itemId: string }> = [];
  addsNothing = false;
  losesItemOnUpdate = false;

  constructor(
    private readonly owners: Readonly<Record<string, ItemOwner>>,
    private readonly items: Readonly<Record<string, readonly InventoryItem[]>> = {}
  ) {}

  findOwner(ref: ActorRef): ItemOwner | null {
    return this.owners[keyOf(ref)] ?? null;
  }

  listItems(ref: ActorRef): readonly InventoryItem[] {
    if (this.findOwner(ref) === null) {
      throw ref.kind === 'world' ? new ActorNotFoundError(ref.actorId) : new TargetTokenNotFoundError(ref.tokenId);
    }
    return this.items[keyOf(ref)] ?? [];
  }

  hasItem(ref: ActorRef, itemId: string): boolean {
    return this.listItems(ref).some((candidate) => candidate.id === itemId);
  }

  addItem(ref: ActorRef, draft: OwnedItemDraft): Promise<OwnedItem | null> {
    this.added.push({ ref, draft });
    return Promise.resolve(
      this.addsNothing ? null : { id: 'added', name: draft.name, type: draft.type, img: draft.img ?? null }
    );
  }

  updateItem(ref: ActorRef, itemId: string, changes: OwnedItemChanges): Promise<OwnedItem | null> {
    this.updated.push({ ref, itemId, changes });
    const current = this.listItems(ref).find((candidate) => candidate.id === itemId);
    if (current === undefined || this.losesItemOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ id: current.id, name: changes.name ?? current.name, type: current.type, img: current.img });
  }

  removeItem(ref: ActorRef, itemId: string): Promise<void> {
    this.removed.push({ ref, itemId });
    return Promise.resolve();
  }
}
