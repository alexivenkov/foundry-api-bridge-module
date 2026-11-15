import { emptyAsAbsent, type ActorTarget } from '@/core/shared';
import type {
  AddActorItemCommand,
  CreateItemCommand,
  DeleteItemCommand,
  GetItemQuery,
  ListActorItemsQuery,
  RemoveActorItemCommand,
  UpdateActorItemCommand,
  UpdateItemCommand
} from '@/core/items/application';
import type {
  AddItemToActorRequest,
  CreateItemRequest,
  DeleteActorItemRequest,
  DeleteItemRequest,
  GetActorItemsRequest,
  GetItemRequest,
  UpdateActorItemRequest,
  UpdateItemRequest
} from './itemSchemas';

export function toGetItemQuery(request: GetItemRequest): GetItemQuery {
  return { itemId: request.itemId };
}

export function toCreateItemCommand(request: CreateItemRequest): CreateItemCommand {
  return {
    draft: {
      name: request.name,
      type: request.type,
      folderId: request.folder,
      img: request.img,
      system: request.system,
      sort: request.sort
    }
  };
}

export function toUpdateItemCommand(request: UpdateItemRequest): UpdateItemCommand {
  return {
    itemId: request.itemId,
    changes: {
      name: request.name,
      img: request.img,
      folderId: request.folder,
      system: request.system,
      sort: request.sort
    }
  };
}

export function toDeleteItemCommand(request: DeleteItemRequest): DeleteItemCommand {
  return { itemId: request.itemId };
}

type OwnerRequest = { readonly actorId: string } | { readonly tokenId: string; readonly sceneId?: string | null | undefined };

function toOwnerTarget(request: OwnerRequest): ActorTarget {
  if ('tokenId' in request) {
    return { kind: 'token', tokenId: request.tokenId, sceneId: emptyAsAbsent(request.sceneId) };
  }
  return { kind: 'actor', actorId: request.actorId };
}

export function toListActorItemsQuery(request: GetActorItemsRequest): ListActorItemsQuery {
  return {
    target: toOwnerTarget(request),
    filter: {
      type: emptyAsAbsent(request.type),
      equipped: request.equipped,
      hasActivities: request.hasActivities
    }
  };
}

export function toAddActorItemCommand(request: AddItemToActorRequest): AddActorItemCommand {
  return {
    target: toOwnerTarget(request),
    draft: {
      name: request.name,
      type: request.type,
      img: request.img,
      system: request.system,
      sort: request.sort
    }
  };
}

export function toUpdateActorItemCommand(request: UpdateActorItemRequest): UpdateActorItemCommand {
  return {
    target: toOwnerTarget(request),
    itemId: request.itemId,
    changes: {
      name: request.name,
      img: request.img,
      system: request.system,
      sort: request.sort
    }
  };
}

export function toRemoveActorItemCommand(request: DeleteActorItemRequest): RemoveActorItemCommand {
  return { target: toOwnerTarget(request), itemId: request.itemId };
}
