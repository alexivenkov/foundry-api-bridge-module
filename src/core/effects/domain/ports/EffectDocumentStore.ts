import type { ActorRef } from '@/core/shared/domain';
import type {
  EffectDetails,
  EffectDetailsChanges,
  EffectDetailsDraft
} from '@/core/effects/domain/model/EffectDetails';

/** The item that holds effects: a world item (no actor), or an item an actor owns. */
export interface ItemEffectHost {
  readonly kind: 'item';
  readonly itemId: string;
  readonly actor: ActorRef | null;
}

/** The document whose embedded ActiveEffects a command reads or writes. */
export type EffectHost = { readonly kind: 'actor'; readonly actor: ActorRef } | ItemEffectHost;

export interface EffectItemIdentity {
  readonly id: string;
  readonly name: string;
}

// Reads are synchronous: effects live in memory. Every method fails with the
// actor reference's own lookup error when the actor is gone, and every method
// but `findItem` with "Item not found" when the item is gone. `createEffect`
// resolves to null when the core created nothing; `updateEffect` when the
// effect is gone.
export interface EffectDocumentStore {
  findItem(host: ItemEffectHost): EffectItemIdentity | null;
  listEffects(host: EffectHost): readonly EffectDetails[];
  findEffect(host: EffectHost, effectId: string): EffectDetails | null;
  createEffect(host: EffectHost, draft: EffectDetailsDraft): Promise<EffectDetails | null>;
  updateEffect(host: EffectHost, effectId: string, changes: EffectDetailsChanges): Promise<EffectDetails | null>;
  deleteEffect(host: EffectHost, effectId: string): Promise<void>;
}
