import { foundryGeneration } from '@/compat/foundryVersion';
import { requireFoundryActor } from '@/core/shared';
import {
  EffectItemNotFoundError,
  type EffectDetails,
  type EffectDetailsChanges,
  type EffectDetailsDraft,
  type EffectDocumentStore,
  type EffectHost,
  type EffectItemIdentity,
  type ItemEffectHost
} from '@/core/effects/domain';
import type { EffectDocumentGameProvider } from './effectGameProviders';
import {
  toEffectDetails,
  toFoundryEffectDetailsCreateData,
  toFoundryEffectDetailsUpdateData,
  type EffectStorage
} from './effectDetailsMapper';
import { effectFeaturesFor } from './effectFeatures';
import type { FoundryEffectItem, FoundryEffectParent } from './foundryEffectTypes';

/**
 * Anti-corruption layer over the ActiveEffects embedded in an actor, a world
 * item, or an item an actor owns (the synthetic actor of an unlinked token
 * included). Results are read from the stored data.
 */
export class FoundryEffectDocumentStore implements EffectDocumentStore {
  constructor(
    private readonly gameProvider: EffectDocumentGameProvider,
    private readonly generation: () => number = foundryGeneration
  ) {}

  findItem(host: ItemEffectHost): EffectItemIdentity | null {
    const item = this.lookupItem(host);
    return item ? { id: item.id, name: item.name } : null;
  }

  listEffects(host: EffectHost): readonly EffectDetails[] {
    return this.requireParent(host).effects.contents.map(toEffectDetails);
  }

  findEffect(host: EffectHost, effectId: string): EffectDetails | null {
    const document = this.requireParent(host).effects.get(effectId);
    return document ? toEffectDetails(document) : null;
  }

  async createEffect(host: EffectHost, draft: EffectDetailsDraft): Promise<EffectDetails | null> {
    const created = await this.requireParent(host).createEmbeddedDocuments('ActiveEffect', [
      toFoundryEffectDetailsCreateData(draft, this.storage())
    ]);
    const document = created?.[0];
    return document ? toEffectDetails(document) : null;
  }

  /** The core hands back nothing for an update that changes nothing; the effect is read as it stands. */
  async updateEffect(host: EffectHost, effectId: string, changes: EffectDetailsChanges): Promise<EffectDetails | null> {
    const document = this.requireParent(host).effects.get(effectId);
    if (!document) {
      return null;
    }
    await document.update(toFoundryEffectDetailsUpdateData(changes, this.storage()));
    return toEffectDetails(document);
  }

  async deleteEffect(host: EffectHost, effectId: string): Promise<void> {
    await this.requireParent(host).effects.get(effectId)?.delete();
  }

  private storage(): EffectStorage {
    return { unitModel: effectFeaturesFor(this.generation()).durationUnits };
  }

  private requireParent(host: EffectHost): FoundryEffectParent {
    if (host.kind === 'actor') {
      return requireFoundryActor(this.gameProvider.getGame(), host.actor);
    }
    const item = this.lookupItem(host);
    if (!item) {
      throw new EffectItemNotFoundError(host.itemId);
    }
    return item;
  }

  private lookupItem(host: ItemEffectHost): FoundryEffectItem | undefined {
    const game = this.gameProvider.getGame();
    if (host.actor === null) {
      return game.items?.get(host.itemId);
    }
    return requireFoundryActor(game, host.actor).items.get(host.itemId);
  }
}
