import type { GetWorldInfoParams, WorldInfoResult, CompendiumMetaSummary } from '@/commands/types';
import { getGame } from './worldTypes';

export function getWorldInfoHandler(_params: GetWorldInfoParams): Promise<WorldInfoResult> {
  const game = getGame();

  const compendiumMeta: CompendiumMetaSummary[] = [];
  game.packs?.forEach(pack => {
    compendiumMeta.push({
      id: pack.collection,
      label: pack.metadata.label,
      type: pack.metadata.type,
      system: pack.metadata.system ?? '',
      count: pack.index.size
    });
  });

  return Promise.resolve({
    world: {
      id: game.world?.id ?? '',
      title: game.world?.title ?? '',
      system: game.system?.id ?? '',
      systemVersion: game.system?.version ?? '',
      foundryVersion: game.version ?? ''
    },
    counts: {
      journals: game.journal?.size ?? 0,
      actors: game.actors?.size ?? 0,
      items: game.items?.size ?? 0,
      scenes: game.scenes?.size ?? 0
    },
    compendiumMeta
  });
}
