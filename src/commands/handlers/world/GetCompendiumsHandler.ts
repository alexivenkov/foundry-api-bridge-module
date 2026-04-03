import type { CompendiumMetadata } from '@/types/foundry';
import type { GetCompendiumsParams } from '@/commands/types';
import { getGame } from './worldTypes';

export function getCompendiumsHandler(_params: GetCompendiumsParams): Promise<CompendiumMetadata[]> {
  const game = getGame();
  const metadata: CompendiumMetadata[] = [];

  game.packs?.forEach(pack => {
    metadata.push({
      id: pack.collection,
      label: pack.metadata.label,
      type: pack.metadata.type,
      system: pack.metadata.system ?? '',
      packageName: pack.metadata.packageName,
      documentCount: pack.index.size
    });
  });

  return Promise.resolve(metadata);
}
