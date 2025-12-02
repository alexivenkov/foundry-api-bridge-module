import type {
  WorldData,
  JournalData,
  JournalPageData,
  ActorData,
  SceneData,
  ItemData,
  CompendiumMetadata
} from '../types/foundry';

export class WorldDataCollector {
  collect(): WorldData {
    return {
      world: this.collectWorldInfo(),
      counts: this.collectCounts(),
      journals: this.collectJournals(),
      actors: this.collectActors(),
      scenes: this.collectScenes(),
      items: this.collectItems(),
      compendiumMeta: this.collectCompendiumMetadata()
    };
  }

  private collectWorldInfo(): WorldData['world'] {
    return {
      id: game.world?.id ?? '',
      title: game.world?.title ?? '',
      system: game.system?.id ?? '',
      systemVersion: game.system?.version ?? '',
      foundryVersion: game.version ?? ''
    };
  }

  private collectCounts(): WorldData['counts'] {
    return {
      journals: game.journal?.size ?? 0,
      actors: game.actors?.size ?? 0,
      items: game.items?.size ?? 0,
      scenes: game.scenes?.size ?? 0
    };
  }

  private collectJournals(): JournalData[] {
    const journals: JournalData[] = [];

    if (!game.journal) return journals;

    game.journal.forEach(journal => {
      const pages: JournalPageData[] = [];

      journal.pages.forEach(page => {
        const pageType = page.type;
        pages.push({
          id: String(page.id),
          name: page.name,
          type: typeof pageType === 'string' ? pageType : String(pageType),
          text: page.text.content ?? null,
          markdown: page.text.markdown ?? null
        });
      });

      journals.push({
        id: journal.id,
        uuid: journal.uuid,
        name: journal.name,
        folder: (journal.folder?.name) ?? null,
        pages
      });
    });

    return journals;
  }

  private collectActors(): ActorData[] {
    const actors: ActorData[] = [];

    if (!game.actors) return actors;

    game.actors.forEach(actor => {
      const items: ItemData[] = [];

      actor.items.forEach(item => {
        const itemType = item.type;
        items.push({
          id: String(item.id),
          name: item.name,
          type: typeof itemType === 'string' ? itemType : String(itemType),
          img: item.img ?? '',
          system: item.toObject(false).system as Record<string, unknown>
        });
      });

      actors.push({
        id: actor.id,
        uuid: actor.uuid,
        name: actor.name,
        type: actor.type,
        folder: (actor.folder?.name) ?? null,
        img: actor.img ?? '',
        system: actor.toObject(false).system as Record<string, unknown>,
        items
      });
    });

    return actors;
  }

  private collectScenes(): SceneData[] {
    const scenes: SceneData[] = [];

    if (!game.scenes) return scenes;

    game.scenes.forEach(scene => {
      const sceneAny = scene as unknown as Record<string, unknown>;
      scenes.push({
        id: scene.id,
        uuid: scene.uuid,
        name: scene.name,
        active: scene.active,
        folder: (scene.folder?.name) ?? null,
        img: (sceneAny['img'] as string | undefined) ?? '',
        width: (sceneAny['width'] as number | undefined) ?? 0,
        height: (sceneAny['height'] as number | undefined) ?? 0
      });
    });

    return scenes;
  }

  private collectItems(): ItemData[] {
    const items: ItemData[] = [];

    if (!game.items) return items;

    game.items.forEach(item => {
      items.push({
        id: item.id,
        uuid: item.uuid,
        name: item.name,
        type: item.type,
        img: item.img ?? '',
        folder: (item.folder?.name) ?? null,
        system: item.toObject(false).system as Record<string, unknown>
      });
    });

    return items;
  }

  private collectCompendiumMetadata(): CompendiumMetadata[] {
    const metadata: CompendiumMetadata[] = [];

    if (!game.packs) return metadata;

    game.packs.forEach(pack => {
      metadata.push({
        id: pack.collection,
        label: pack.metadata.label,
        type: pack.metadata.type,
        system: pack.metadata.system ?? '',
        packageName: pack.metadata.packageName,
        documentCount: pack.index.size
      });
    });

    return metadata;
  }
}
