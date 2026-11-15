import type {
  ActiveEffectChange,
  ActiveEffectDetails,
  ActiveEffectDuration,
  ActorEffectResult,
  ActorEffectsResult as WireActorEffectsResult,
  AddEffectResult,
  DeleteItemEffectResult,
  EffectSummary,
  ItemEffectOwner,
  ItemEffectResult,
  ItemEffectsResult as WireItemEffectsResult,
  RemoveEffectResult,
  ToggleStatusResult,
  UpdateEffectResult
} from '@/commands/types';
import { storedImage } from '@/commands/handlers/legacyWire';
import {
  isTemporary,
  type ActorEffectDetailsResult,
  type ActorEffectsResult,
  type Effect,
  type EffectChangeEntry,
  type EffectDetails,
  type EffectDurationState,
  type EffectGameProvider,
  type EffectGlobalsProvider,
  type EffectRemovalResult,
  type ScriptCarrierPolicy,
  type EffectWriteResult,
  type ItemEffectLocation,
  type ItemEffectRemovalResult,
  type ItemEffectWriteResult,
  type ItemEffectsResult,
  type StatusToggleResult
} from '@/core/effects';
import type { LocatedActor } from '@/core/shared';

export interface EffectHandlerDependencies {
  gameProvider?: EffectGameProvider;
  globals?: EffectGlobalsProvider;
  generation?: () => number;
  scripts?: ScriptCarrierPolicy;
}

/** `changes` is present only when the effect has some, `duration` only when the effect is temporary. */
export function toWireEffect(effect: Effect): EffectSummary {
  const summary: EffectSummary = {
    id: effect.id,
    name: effect.name,
    img: storedImage(effect.img),
    disabled: effect.disabled,
    isTemporary: isTemporary(effect),
    statuses: [...effect.statuses],
    origin: effect.origin
  };

  if (effect.changes.length > 0) {
    summary.changes = effect.changes.map((change) => ({ key: change.key, value: change.value, mode: change.mode }));
  }
  if (effect.duration !== null) {
    summary.duration = { ...effect.duration };
  }

  return summary;
}

export function toWireActorEffects(result: ActorEffectsResult): WireActorEffectsResult {
  return {
    actorId: result.actor.id,
    actorName: result.actor.name,
    effects: result.effects.map(toWireEffect),
    activeStatuses: [...result.activeStatuses]
  };
}

export function toWireStatusToggle(result: StatusToggleResult): ToggleStatusResult {
  const wire: ToggleStatusResult = {
    actorId: result.actorId,
    statusId: result.statusId,
    active: result.toggle.active
  };
  if (result.toggle.effectId !== null) {
    wire.effectId = result.toggle.effectId;
  }
  return wire;
}

export function toWireEffectWrite(result: EffectWriteResult): AddEffectResult {
  return { actorId: result.actorId, effectId: result.effect.id, name: result.effect.name };
}

/** `update-actor-effect` echoes the effect id it was given. */
export function toWireEffectUpdate(result: EffectWriteResult, effectId: string): UpdateEffectResult {
  return { actorId: result.actorId, effectId, name: result.effect.name };
}

export function toWireEffectRemoval(result: EffectRemovalResult): RemoveEffectResult {
  return { actorId: result.actorId, effectId: result.effectId, removed: true };
}

function toWireChange(change: EffectChangeEntry): ActiveEffectChange {
  return {
    key: change.key,
    type: change.type,
    value: change.value,
    priority: change.priority,
    ...(change.phase !== undefined ? { phase: change.phase } : {})
  };
}

/** Fields the running Foundry generation does not have are left out, not sent as null. */
function toWireDuration(duration: EffectDurationState): ActiveEffectDuration {
  return {
    value: duration.value,
    units: duration.units,
    ...(duration.expiry !== undefined ? { expiry: duration.expiry } : {}),
    ...(duration.expired !== undefined ? { expired: duration.expired } : {}),
    ...(duration.extraTurns !== undefined ? { extraTurns: duration.extraTurns } : {})
  };
}

export function toWireEffectDetails(effect: EffectDetails): ActiveEffectDetails {
  return {
    id: effect.id,
    name: effect.name,
    img: effect.img,
    type: effect.type,
    disabled: effect.disabled,
    transfer: effect.transfer,
    description: effect.description,
    tint: effect.tint,
    origin: effect.origin,
    statuses: [...effect.statuses],
    sort: effect.sort,
    changes: effect.changes.map(toWireChange),
    duration: effect.duration === null ? null : toWireDuration(effect.duration),
    ...(effect.showIcon !== undefined ? { showIcon: effect.showIcon } : {}),
    system: { ...effect.system }
  };
}

function tokenOf(actor: LocatedActor | null): { tokenId: string | null; sceneId: string | null } {
  return actor?.ref.kind === 'token'
    ? { tokenId: actor.ref.tokenId, sceneId: actor.ref.sceneId }
    : { tokenId: null, sceneId: null };
}

export function toWireActorEffectDetails(result: ActorEffectDetailsResult): ActorEffectResult {
  return { ...toWireEffectDetails(result.effect), actorId: result.actor.id, ...tokenOf(result.actor) };
}

function toWireItemEffectOwner(location: ItemEffectLocation): ItemEffectOwner {
  return { itemId: location.item.id, actorId: location.owner?.id ?? null, ...tokenOf(location.owner) };
}

export function toWireItemEffects(result: ItemEffectsResult): WireItemEffectsResult {
  return {
    ...toWireItemEffectOwner(result),
    itemName: result.item.name,
    effects: result.effects.map(toWireEffectDetails)
  };
}

export function toWireItemEffect(result: ItemEffectWriteResult): ItemEffectResult {
  return { ...toWireEffectDetails(result.effect), ...toWireItemEffectOwner(result) };
}

export function toWireItemEffectRemoval(result: ItemEffectRemovalResult): DeleteItemEffectResult {
  return { deleted: true, effectId: result.effectId, ...toWireItemEffectOwner(result) };
}
