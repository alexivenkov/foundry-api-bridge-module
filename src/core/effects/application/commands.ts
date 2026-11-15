import type { ActorTarget } from '@/core/shared';
import type {
  EffectChanges,
  EffectDetailsChanges,
  EffectDetailsDraft,
  EffectDraft,
  StatusToggleOptions
} from '@/core/effects/domain';

export interface ListEffectsQuery {
  readonly target: ActorTarget;
  readonly includeDisabled: boolean;
}

export interface ToggleStatusCommand {
  readonly target: ActorTarget;
  readonly statusId: string;
  readonly options: StatusToggleOptions;
}

export interface AddEffectCommand {
  readonly target: ActorTarget;
  readonly draft: EffectDraft;
}

export interface UpdateEffectCommand {
  readonly target: ActorTarget;
  readonly effectId: string;
  readonly changes: EffectChanges;
}

export interface RemoveEffectCommand {
  readonly target: ActorTarget;
  readonly effectId: string;
}

export interface GetActorEffectQuery {
  readonly target: ActorTarget;
  readonly effectId: string;
}

/** An item by id: a world item when it names no owner, otherwise an item the owner owns. */
export interface ItemEffectTarget {
  readonly itemId: string;
  readonly owner: ActorTarget | null;
}

export interface ListItemEffectsQuery {
  readonly item: ItemEffectTarget;
}

export interface CreateItemEffectCommand {
  readonly item: ItemEffectTarget;
  readonly draft: EffectDetailsDraft;
}

export interface UpdateItemEffectCommand {
  readonly item: ItemEffectTarget;
  readonly effectId: string;
  readonly changes: EffectDetailsChanges;
}

export interface DeleteItemEffectCommand {
  readonly item: ItemEffectTarget;
  readonly effectId: string;
}
