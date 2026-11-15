import { CoreFeatureUnavailableError, requireScene, type SceneLocator } from '@/core/shared';
import {
  TileCreationFailedError,
  TileNotFoundError,
  findUnsupportedTileFeature,
  type Tile,
  type TileChanges,
  type TileStore
} from '@/core/tiles/domain';
import type {
  CreateTileCommand,
  DeleteTileCommand,
  ListTilesQuery,
  SceneTileResult,
  TileDeletionResult,
  TileListResult,
  UpdateTileCommand
} from './commands';

export interface TileServiceDependencies {
  readonly scenes: SceneLocator;
  readonly tiles: TileStore;
}

export class TileService {
  constructor(private readonly deps: TileServiceDependencies) {}

  listTiles(query: ListTilesQuery): TileListResult {
    this.requireSupport();
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { sceneId: scene.id, tiles: this.deps.tiles.listTiles(scene.id) };
  }

  async createTile(command: CreateTileCommand): Promise<SceneTileResult> {
    this.requireSupport(command.draft);
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const tile = await this.deps.tiles.createTile(scene.id, command.draft);
    if (tile === null) {
      throw new TileCreationFailedError();
    }
    return { sceneId: scene.id, tile };
  }

  async updateTile(command: UpdateTileCommand): Promise<SceneTileResult> {
    this.requireSupport(command.changes);
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.requireTile(scene.id, command.tileId);
    const tile = await this.deps.tiles.updateTile(scene.id, command.tileId, command.changes);
    if (tile === null) {
      throw new TileNotFoundError(command.tileId);
    }
    return { sceneId: scene.id, tile };
  }

  async deleteTile(command: DeleteTileCommand): Promise<TileDeletionResult> {
    this.requireSupport();
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.requireTile(scene.id, command.tileId);
    await this.deps.tiles.deleteTile(scene.id, command.tileId);
    return { sceneId: scene.id, tileId: command.tileId };
  }

  private requireSupport(changes?: TileChanges): void {
    const refusal = findUnsupportedTileFeature(this.deps.tiles.capabilities(), changes);
    if (refusal !== null) {
      throw new CoreFeatureUnavailableError(refusal);
    }
  }

  private requireTile(sceneId: string, tileId: string): Tile {
    const tile = this.deps.tiles.findTile(sceneId, tileId);
    if (tile === null) {
      throw new TileNotFoundError(tileId);
    }
    return tile;
  }
}
