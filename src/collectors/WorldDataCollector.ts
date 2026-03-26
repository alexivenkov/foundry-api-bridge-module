import type {
  WorldData,
  JournalData,
  JournalPageData,
  ActorData,
  SceneData,
  ItemData,
  CompendiumMetadata
} from '@/types/foundry';

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
        system: actor.getRollData() as Record<string, unknown>,
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

      const gridRaw = sceneAny['grid'] as Record<string, unknown> | undefined;
      const grid = {
        size: (gridRaw?.['size'] as number) ?? 100,
        type: (gridRaw?.['type'] as number) ?? 1,
        units: (gridRaw?.['units'] as string) ?? 'ft',
        distance: (gridRaw?.['distance'] as number) ?? 5
      };

      const notesRaw = sceneAny['notes'] as { contents?: Array<Record<string, unknown>> } | undefined;
      const notes = (notesRaw?.contents ?? []).map(note => ({
        x: (note['x'] as number) ?? 0,
        y: (note['y'] as number) ?? 0,
        text: (note['text'] as string) ?? '',
        label: (note['label'] as string) ?? '',
        entryId: (note['entryId'] as string | undefined) ?? null
      }));

      const wallsRaw = sceneAny['walls'] as { contents?: Array<Record<string, unknown>> } | undefined;
      const walls = (wallsRaw?.contents ?? []).map(wall => ({
        c: (wall['c'] as number[]) ?? [],
        move: (wall['move'] as number) ?? 0,
        sense: (wall['sense'] as number) ?? 0,
        door: (wall['door'] as number) ?? 0
      }));

      const lightsRaw = sceneAny['lights'] as { contents?: Array<Record<string, unknown>> } | undefined;
      const lights = (lightsRaw?.contents ?? []).map(light => {
        const config = light['config'] as Record<string, unknown> | undefined;
        return {
          x: (light['x'] as number) ?? 0,
          y: (light['y'] as number) ?? 0,
          bright: (config?.['bright'] as number) ?? 0,
          dim: (config?.['dim'] as number) ?? 0,
          color: (config?.['color'] as string | undefined) ?? null,
          angle: (config?.['angle'] as number) ?? 360,
          walls: (light['walls'] as boolean | undefined) ?? true,
          hidden: (light['hidden'] as boolean | undefined) ?? false
        };
      });

      const tilesRaw = sceneAny['tiles'] as { contents?: Array<Record<string, unknown>> } | undefined;
      const tiles = (tilesRaw?.contents ?? []).map(tile => {
        const texture = tile['texture'] as Record<string, unknown> | undefined;
        return {
          x: (tile['x'] as number) ?? 0,
          y: (tile['y'] as number) ?? 0,
          width: (tile['width'] as number) ?? 0,
          height: (tile['height'] as number) ?? 0,
          img: (texture?.['src'] as string | undefined) ?? '',
          hidden: (tile['hidden'] as boolean | undefined) ?? false,
          elevation: (tile['elevation'] as number) ?? 0,
          rotation: (tile['rotation'] as number) ?? 0
        };
      });

      const drawingsRaw = sceneAny['drawings'] as { contents?: Array<Record<string, unknown>> } | undefined;
      const drawings = (drawingsRaw?.contents ?? []).map(drawing => {
        const shape = drawing['shape'] as Record<string, unknown> | undefined;
        return {
          x: (drawing['x'] as number) ?? 0,
          y: (drawing['y'] as number) ?? 0,
          shape: {
            type: (shape?.['type'] as string) ?? '',
            width: (shape?.['width'] as number) ?? 0,
            height: (shape?.['height'] as number) ?? 0,
            points: (shape?.['points'] as number[]) ?? []
          },
          text: (drawing['text'] as string | undefined) ?? '',
          hidden: (drawing['hidden'] as boolean | undefined) ?? false,
          fillColor: (drawing['fillColor'] as string | undefined) ?? null,
          strokeColor: (drawing['strokeColor'] as string | undefined) ?? null
        };
      });

      const regionsRaw = sceneAny['regions'] as { contents?: Array<Record<string, unknown>> } | undefined;
      const regions = (regionsRaw?.contents ?? []).map(region => {
        const shapes = region['shapes'] as Array<Record<string, unknown>> | undefined;
        return {
          id: (region['id'] as string) ?? '',
          name: (region['name'] as string) ?? '',
          color: (region['color'] as string | undefined) ?? null,
          shapes: (shapes ?? []).map(s => ({ type: (s['type'] as string) ?? '' }))
        };
      });

      scenes.push({
        id: scene.id,
        uuid: scene.uuid,
        name: scene.name,
        active: scene.active,
        folder: (scene.folder?.name) ?? null,
        img: (sceneAny['img'] as string | undefined) ?? '',
        width: (sceneAny['width'] as number | undefined) ?? 0,
        height: (sceneAny['height'] as number | undefined) ?? 0,
        grid,
        darkness: (sceneAny['darkness'] as number | undefined) ?? 0,
        notes,
        walls,
        lights,
        tiles,
        drawings,
        regions
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
        system: pack.metadata.system,
        packageName: pack.metadata.packageName,
        documentCount: pack.index.size
      });
    });

    return metadata;
  }
}
