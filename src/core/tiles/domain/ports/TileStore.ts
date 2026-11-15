import type { Tile, TileChanges, TileDraft } from '@/core/tiles/domain/model/Tile';
import type { TileCapabilities } from '@/core/tiles/domain/rules/tileFeatures';

// Reads are synchronous: a scene's tiles live in memory. `createTile` resolves
// to null when the core created nothing; `updateTile` when the tile is gone.
export interface TileStore {
  capabilities(): TileCapabilities;
  listTiles(sceneId: string): readonly Tile[];
  findTile(sceneId: string, tileId: string): Tile | null;
  createTile(sceneId: string, draft: TileDraft): Promise<Tile | null>;
  updateTile(sceneId: string, tileId: string, changes: TileChanges): Promise<Tile | null>;
  deleteTile(sceneId: string, tileId: string): Promise<void>;
}
