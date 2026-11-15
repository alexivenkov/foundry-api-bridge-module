import { foundryGeneration } from '@/compat/foundryVersion';
import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import type { Tile, TileCapabilities, TileChanges, TileDraft, TileStore } from '@/core/tiles/domain';
import type { FoundryTileGame, FoundryTileScene } from './foundryTileTypes';
import { toFoundryTileData, toTile } from './tileMapper';

export type TileGameProvider = GameProvider<FoundryTileGame>;

// Foundry 12 replaced the tile's `z`, `overhead` and `roof` with `sort`,
// elevation and `restrictions`; Foundry 14 replaced `occlusion.mode` with a set
// of modes, added `name` / `levels` and dropped the texture offset and rotation.
const FIRST_SUPPORTED_GENERATION = 12;
const FIRST_LEVELS_GENERATION = 14;

/** Anti-corruption layer over a scene's embedded Tile documents. */
export class FoundryTileStore implements TileStore {
  constructor(private readonly gameProvider: TileGameProvider) {}

  capabilities(): TileCapabilities {
    const generation = foundryGeneration();
    const levelsEra = generation >= FIRST_LEVELS_GENERATION;
    return {
      supported: generation >= FIRST_SUPPORTED_GENERATION,
      names: levelsEra,
      levels: levelsEra,
      textureOffset: !levelsEra,
      occlusionModeSet: levelsEra
    };
  }

  listTiles(sceneId: string): readonly Tile[] {
    const generation = foundryGeneration();
    return this.requireScene(sceneId).tiles.contents.map((document) => toTile(document._source, generation));
  }

  findTile(sceneId: string, tileId: string): Tile | null {
    const document = this.requireScene(sceneId).tiles.get(tileId);
    return document !== undefined ? toTile(document._source, foundryGeneration()) : null;
  }

  async createTile(sceneId: string, draft: TileDraft): Promise<Tile | null> {
    const generation = foundryGeneration();
    const created = await this.requireScene(sceneId).createEmbeddedDocuments('Tile', [
      toFoundryTileData(draft, generation)
    ]);
    const document = created[0];
    return document !== undefined ? toTile(document._source, generation) : null;
  }

  async updateTile(sceneId: string, tileId: string, changes: TileChanges): Promise<Tile | null> {
    const document = this.requireScene(sceneId).tiles.get(tileId);
    if (document === undefined) {
      return null;
    }
    const generation = foundryGeneration();
    await document.update(toFoundryTileData(changes, generation));
    return toTile(document._source, generation);
  }

  async deleteTile(sceneId: string, tileId: string): Promise<void> {
    await this.requireScene(sceneId).deleteEmbeddedDocuments('Tile', [tileId]);
  }

  private requireScene(sceneId: string): FoundryTileScene {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return scene;
  }
}
