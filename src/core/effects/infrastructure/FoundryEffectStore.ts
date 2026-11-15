import { foundryGeneration } from '@/compat/foundryVersion';
import { requireFoundryActor, type ActorRef } from '@/core/shared';
import type {
  ActorEffects,
  EffectChanges,
  EffectDraft,
  EffectIdentity,
  EffectStore,
  StatusToggle,
  StatusToggleOptions
} from '@/core/effects/domain';
import {
  toEffect,
  toEffectIdentity,
  toFoundryEffectCreateData,
  toFoundryEffectUpdateData,
  toFoundryStatusToggleOptions,
  toStatusToggle,
  withoutMaskingZeroUnits
} from './effectMapper';
import type { EffectStoreGameProvider } from './effectGameProviders';
import type { FoundryEffectActor } from './foundryEffectTypes';

/** Anti-corruption layer over an actor's embedded ActiveEffect documents and its statuses. */
export class FoundryEffectStore implements EffectStore {
  constructor(
    private readonly gameProvider: EffectStoreGameProvider,
    private readonly generation: () => number = foundryGeneration
  ) {}

  readEffects(actor: ActorRef): ActorEffects {
    const document = this.requireActor(actor);
    return {
      effects: document.effects.contents.map(toEffect),
      activeStatuses: Array.from(document.statuses)
    };
  }

  hasEffect(actor: ActorRef, effectId: string): boolean {
    return Boolean(this.requireActor(actor).effects.get(effectId));
  }

  async toggleStatus(actor: ActorRef, statusId: string, options: StatusToggleOptions): Promise<StatusToggle> {
    const result = await this.requireActor(actor).toggleStatusEffect(statusId, toFoundryStatusToggleOptions(options));
    return toStatusToggle(result);
  }

  async createEffect(actor: ActorRef, draft: EffectDraft): Promise<EffectIdentity | null> {
    const created = await this.requireActor(actor).createEmbeddedDocuments('ActiveEffect', [
      toFoundryEffectCreateData(this.forCore(draft))
    ]);
    const document = created?.[0];
    return document ? toEffectIdentity(document) : null;
  }

  async updateEffect(actor: ActorRef, effectId: string, changes: EffectChanges): Promise<EffectIdentity | null> {
    const document = this.requireActor(actor).effects.get(effectId);
    if (!document) {
      return null;
    }
    await document.update(toFoundryEffectUpdateData(this.forCore(changes)));
    return toEffectIdentity(document);
  }

  async deleteEffect(actor: ActorRef, effectId: string): Promise<void> {
    await this.requireActor(actor).effects.get(effectId)?.delete();
  }

  /** Only a core known to keep one duration unit gets the duration adjusted (`withoutMaskingZeroUnits`). */
  private forCore<T extends EffectChanges>(changes: T): T {
    if (changes.duration === undefined || this.generation() < 14) {
      return changes;
    }
    return { ...changes, duration: withoutMaskingZeroUnits(changes.duration) };
  }

  private requireActor(actor: ActorRef): FoundryEffectActor {
    return requireFoundryActor(this.gameProvider.getGame(), actor);
  }
}
