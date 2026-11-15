import { FoundrySceneLocator, globalGameProvider } from '@/core/shared';
import { TileService } from './application';
import { FoundryTileStore, type FoundryTileGame, type TileGameProvider } from './infrastructure';

export const defaultTileGameProvider: TileGameProvider = globalGameProvider<FoundryTileGame>();

// Composition root of the context. Handlers pass a custom provider only in tests.
export function createFoundryTileService(gameProvider: TileGameProvider = defaultTileGameProvider): TileService {
  return new TileService({
    scenes: new FoundrySceneLocator(gameProvider),
    tiles: new FoundryTileStore(gameProvider)
  });
}
