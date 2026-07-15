import type { ActorInventory, ActorRef, EmbeddedItemRecord } from '@/compendiums/domain';
import type { CompendiumGameProvider } from './foundryGameProvider';

export class FoundryActorInventory implements ActorInventory {
  constructor(private readonly gameProvider: CompendiumGameProvider) {}

  findActor(actorId: string): ActorRef | null {
    const actor = this.gameProvider.getGame().actors.get(actorId);
    return actor !== undefined ? { id: actor.id, name: actor.name } : null;
  }

  async createEmbeddedItem(
    actorId: string,
    itemData: Record<string, unknown>
  ): Promise<EmbeddedItemRecord | null> {
    const actor = this.gameProvider.getGame().actors.get(actorId);
    if (actor === undefined) {
      return null;
    }

    const createdItems = await actor.createEmbeddedDocuments('Item', [itemData]);
    const createdItem = createdItems[0];
    if (!createdItem) {
      return null;
    }
    return {
      id: createdItem.id,
      name: createdItem.name,
      type: createdItem.type,
      img: createdItem.img
    };
  }
}
