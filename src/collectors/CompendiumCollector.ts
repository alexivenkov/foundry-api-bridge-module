import type { CompendiumMetadata, CompendiumData, CompendiumDocument } from '../types/foundry';
import type { ApiClient } from '../api/ApiClient';

export class CompendiumCollector {
  collectMetadata(): CompendiumMetadata[] {
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

  async loadContents(packId: string): Promise<CompendiumData | null> {
    if (!game.packs) return null;

    const pack = game.packs.get(packId);

    if (!pack) {
      console.error(`Compendium not found: ${packId}`);
      return null;
    }

    console.log(`Loading compendium: ${packId} (${String(pack.index.size)} documents)...`);

    try {
      const documents = await pack.getDocuments();

      const packData: CompendiumData = {
        id: pack.collection,
        label: pack.metadata.label,
        type: pack.metadata.type,
        system: pack.metadata.system ?? '',
        documentCount: documents.length,
        documents: []
      };

      documents.forEach(doc => {
        const docAny = doc as unknown as Record<string, unknown>;

        const docData: CompendiumDocument = {
          id: doc.id,
          uuid: doc.uuid,
          name: doc.name,
          type: docAny['type'] as string,
          img: (docAny['img'] as string | undefined) ?? ''
        };

        if (docAny['system']) {
          docData.system = docAny['system'] as Record<string, unknown>;
        }

        if (docAny['items'] && (docAny['items'] as { size: number }).size > 0) {
          docData.items = [];
          const items = docAny['items'] as Map<string, Record<string, unknown>>;
          items.forEach(item => {
            docData.items?.push({
              id: item['id'] as string,
              name: item['name'] as string,
              type: item['type'] as string,
              img: (item['img'] as string | undefined) ?? '',
              system: item['system'] as Record<string, unknown>
            });
          });
        }

        if (docAny['pages'] && (docAny['pages'] as { size: number }).size > 0) {
          docData.pages = [];
          const pages = docAny['pages'] as Map<string, Record<string, unknown>>;
          pages.forEach(page => {
            const text = page['text'] as { content?: string; markdown?: string } | undefined;
            docData.pages?.push({
              id: page['id'] as string,
              name: page['name'] as string,
              type: page['type'] as string,
              text: text?.content ?? null,
              markdown: text?.markdown ?? null
            });
          });
        }

        packData.documents.push(docData);
      });

      console.log(`Loaded ${String(packData.documents.length)} documents from ${packId}`);
      return packData;

    } catch (error) {
      console.error(`Error loading compendium ${packId}:`, error);
      return null;
    }
  }

  async autoLoad(packIds: string[], apiClient: ApiClient, endpoint: string): Promise<void> {
    if (!game.packs) {
      console.warn('game.packs is not available');
      return;
    }

    if (packIds.length === 0) {
      console.log('No compendia configured for auto-load');
      return;
    }

    console.log(`Auto-loading ${String(packIds.length)} compendia...`);

    for (const packId of packIds) {
      const pack = game.packs.get(packId);
      if (!pack) {
        console.warn(`Pack not found, skipping: ${packId}`);
        continue;
      }

      try {
        const packData = await this.loadContents(packId);
        if (packData) {
          await apiClient.sendCompendium(endpoint, packId, packData);
          console.log(`✓ Compendium ${packId} loaded and sent successfully`);
        }
      } catch (error) {
        console.error(`Error auto-loading ${packId}:`, error);
      }
    }

    console.log('Auto-load complete');
  }
}
