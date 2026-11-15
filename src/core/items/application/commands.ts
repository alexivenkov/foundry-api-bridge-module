import type { ActorTarget } from '@/core/shared';
import type {
  InventoryFilter,
  OwnedItemChanges,
  OwnedItemDraft,
  WorldItemChanges,
  WorldItemDraft
} from '@/core/items/domain';

export interface GetItemQuery {
  readonly itemId: string;
}

export interface CreateItemCommand {
  readonly draft: WorldItemDraft;
}

export interface UpdateItemCommand {
  readonly itemId: string;
  readonly changes: WorldItemChanges;
}

export interface DeleteItemCommand {
  readonly itemId: string;
}

export interface ListActorItemsQuery {
  readonly target: ActorTarget;
  readonly filter: InventoryFilter;
}

export interface AddActorItemCommand {
  readonly target: ActorTarget;
  readonly draft: OwnedItemDraft;
}

export interface UpdateActorItemCommand {
  readonly target: ActorTarget;
  readonly itemId: string;
  readonly changes: OwnedItemChanges;
}

export interface RemoveActorItemCommand {
  readonly target: ActorTarget;
  readonly itemId: string;
}
