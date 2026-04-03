import type { CompendiumData, CompendiumDocument } from '@/types/foundry';
import type { GetCompendiumParams } from '@/commands/types';
import type { FoundryPacksCollectionFull } from './worldTypes';

interface CompendiumGame {
  packs: FoundryPacksCollectionFull | undefined;
}

function getGame(): CompendiumGame {
  return (globalThis as unknown as { game: CompendiumGame }).game;
}

function mapDocument(doc: Record<string, unknown>): CompendiumDocument {
  const result: CompendiumDocument = {
    id: doc['id'] as string,
    uuid: doc['uuid'] as string,
    name: doc['name'] as string,
    type: doc['type'] as string,
    img: (doc['img'] as string | undefined) ?? ''
  };

  if (doc['system'] !== undefined) {
    result.system = doc['system'] as Record<string, unknown>;
  }

  const items = doc['items'] as Map<string, Record<string, unknown>> | undefined;
  if (items !== undefined && items.size > 0) {
    result.items = [];
    items.forEach(item => {
      result.items?.push({
        id: item['id'] as string,
        name: item['name'] as string,
        type: item['type'] as string,
        img: (item['img'] as string | undefined) ?? '',
        system: item['system'] as Record<string, unknown>
      });
    });
  }

  const pages = doc['pages'] as Map<string, Record<string, unknown>> | undefined;
  if (pages !== undefined && pages.size > 0) {
    result.pages = [];
    pages.forEach(page => {
      const text = page['text'] as { content?: string; markdown?: string } | undefined;
      result.pages?.push({
        id: page['id'] as string,
        name: page['name'] as string,
        type: page['type'] as string,
        text: text?.content ?? null,
        markdown: text?.markdown ?? null
      });
    });
  }

  return result;
}

export async function getCompendiumHandler(params: GetCompendiumParams): Promise<CompendiumData> {
  const game = getGame();

  if (!game.packs) {
    return Promise.reject(new Error(`Compendium not found: ${params.packId}`));
  }

  const pack = game.packs.get(params.packId);

  if (!pack) {
    return Promise.reject(new Error(`Compendium not found: ${params.packId}`));
  }

  const rawDocuments = await pack.getDocuments();
  const documents: CompendiumDocument[] = rawDocuments.map(doc => {
    return mapDocument(doc as unknown as Record<string, unknown>);
  });

  return {
    id: pack.collection,
    label: pack.metadata.label,
    type: pack.metadata.type,
    system: pack.metadata.system ?? '',
    documentCount: documents.length,
    documents
  };
}
