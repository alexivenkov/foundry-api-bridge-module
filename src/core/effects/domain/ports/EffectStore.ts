import type { ActorRef } from '@/core/shared/domain';
import type {
  ActorEffects,
  EffectChanges,
  EffectDraft,
  EffectIdentity,
  StatusToggle,
  StatusToggleOptions
} from '@/core/effects/domain/model/Effect';

// Reads are synchronous: an actor's effects live in memory. Every method takes
// the actor by reference and fails with the reference's own lookup error when
// the actor is gone. `createEffect` resolves to null when the core created
// nothing; `updateEffect` when the effect is gone.
export interface EffectStore {
  readEffects(actor: ActorRef): ActorEffects;
  hasEffect(actor: ActorRef, effectId: string): boolean;
  toggleStatus(actor: ActorRef, statusId: string, options: StatusToggleOptions): Promise<StatusToggle>;
  createEffect(actor: ActorRef, draft: EffectDraft): Promise<EffectIdentity | null>;
  updateEffect(actor: ActorRef, effectId: string, changes: EffectChanges): Promise<EffectIdentity | null>;
  deleteEffect(actor: ActorRef, effectId: string): Promise<void>;
}
