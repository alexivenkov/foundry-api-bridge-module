import { emptyAsAbsent, readActorTarget, toActorTarget, type ActorTarget } from '@/core/shared';
import { uniqueStatuses, type EffectChangeSpec, type EffectDetailsChanges } from '@/core/effects/domain';
import type {
  AddEffectCommand,
  CreateItemEffectCommand,
  DeleteItemEffectCommand,
  GetActorEffectQuery,
  ItemEffectTarget,
  ListEffectsQuery,
  ListItemEffectsQuery,
  RemoveEffectCommand,
  ToggleStatusCommand,
  UpdateEffectCommand,
  UpdateItemEffectCommand
} from '@/core/effects/application';
import type {
  CreateItemEffectRequest,
  DeleteItemEffectRequest,
  GetActorEffectRequest,
  GetItemEffectsRequest,
  UpdateItemEffectRequest
} from './effectDetailsSchemas';
import type {
  AddActorEffectRequest,
  GetActorEffectsRequest,
  RemoveActorEffectRequest,
  ToggleActorStatusRequest,
  UpdateActorEffectRequest
} from './effectSchemas';

export function toListEffectsQuery(request: GetActorEffectsRequest): ListEffectsQuery {
  return {
    target: readActorTarget(request),
    includeDisabled: request.includeDisabled ?? true
  };
}

export function toToggleStatusCommand(request: ToggleActorStatusRequest): ToggleStatusCommand {
  return {
    target: readActorTarget(request),
    statusId: request.statusId,
    options: { active: request.active, overlay: request.overlay }
  };
}

export function toAddEffectCommand(request: AddActorEffectRequest): AddEffectCommand {
  return {
    target: readActorTarget(request),
    draft: {
      name: request.name,
      img: request.img,
      disabled: request.disabled,
      origin: request.origin,
      statuses: request.statuses,
      changes: request.changes,
      duration: request.duration,
      type: request.type,
      system: request.system,
      description: request.description,
      sort: request.sort,
      showIcon: request.showIcon
    }
  };
}

export function toUpdateEffectCommand(request: UpdateActorEffectRequest): UpdateEffectCommand {
  return {
    target: readActorTarget(request),
    effectId: request.effectId,
    changes: {
      name: request.name,
      img: request.img,
      disabled: request.disabled,
      changes: request.changes,
      duration: request.duration,
      system: request.system,
      description: request.description,
      sort: request.sort,
      showIcon: request.showIcon,
      tint: request.tint,
      origin: request.origin,
      statuses: request.statuses === undefined ? undefined : uniqueStatuses(request.statuses)
    }
  };
}

export function toRemoveEffectCommand(request: RemoveActorEffectRequest): RemoveEffectCommand {
  return { target: readActorTarget(request), effectId: request.effectId };
}

interface ActorAddressRequest {
  readonly actorId?: string | null | undefined;
  readonly tokenId?: string | null | undefined;
  readonly sceneId?: string | null | undefined;
}

function actorAddress(request: ActorAddressRequest): { actorId?: string; tokenId?: string; sceneId?: string } {
  const actorId = emptyAsAbsent(request.actorId);
  const tokenId = emptyAsAbsent(request.tokenId);
  const sceneId = emptyAsAbsent(request.sceneId);
  return {
    ...(actorId !== undefined ? { actorId } : {}),
    ...(tokenId !== undefined ? { tokenId } : {}),
    ...(sceneId !== undefined ? { sceneId } : {})
  };
}

/** No actor id and no token id: the item is a world item. */
function toItemEffectTarget(request: ActorAddressRequest & { readonly itemId: string }): ItemEffectTarget {
  const address = actorAddress(request);
  const owner: ActorTarget | null =
    address.actorId === undefined && address.tokenId === undefined ? null : toActorTarget(address);
  return { itemId: request.itemId, owner };
}

type EffectChangeRequest = NonNullable<CreateItemEffectRequest['changes']>[number];

function toChangeSpec(change: EffectChangeRequest): EffectChangeSpec {
  return { key: change.key, type: change.type, value: change.value, priority: change.priority, phase: change.phase };
}

function toDetailsChanges(request: CreateItemEffectRequest | UpdateItemEffectRequest): EffectDetailsChanges {
  return {
    name: request.name,
    img: request.img,
    disabled: request.disabled,
    transfer: request.transfer,
    description: request.description,
    tint: request.tint,
    origin: request.origin,
    statuses: request.statuses === undefined ? undefined : uniqueStatuses(request.statuses),
    sort: request.sort,
    changes: request.changes?.map(toChangeSpec),
    duration:
      request.duration === undefined || request.duration === null
        ? request.duration
        : { value: request.duration.value, units: request.duration.units, expiry: request.duration.expiry },
    showIcon: request.showIcon,
    system: request.system
  };
}

export function toGetActorEffectQuery(request: GetActorEffectRequest): GetActorEffectQuery {
  return { target: toActorTarget(actorAddress(request)), effectId: request.effectId };
}

export function toListItemEffectsQuery(request: GetItemEffectsRequest): ListItemEffectsQuery {
  return { item: toItemEffectTarget(request) };
}

export function toCreateItemEffectCommand(request: CreateItemEffectRequest): CreateItemEffectCommand {
  return {
    item: toItemEffectTarget(request),
    draft: { ...toDetailsChanges(request), name: request.name, type: request.type }
  };
}

export function toUpdateItemEffectCommand(request: UpdateItemEffectRequest): UpdateItemEffectCommand {
  return { item: toItemEffectTarget(request), effectId: request.effectId, changes: toDetailsChanges(request) };
}

export function toDeleteItemEffectCommand(request: DeleteItemEffectRequest): DeleteItemEffectCommand {
  return { item: toItemEffectTarget(request), effectId: request.effectId };
}
