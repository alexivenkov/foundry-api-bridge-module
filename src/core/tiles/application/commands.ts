import type { Tile, TileChanges, TileDraft } from '@/core/tiles/domain';

export interface ListTilesQuery {
  readonly sceneId: string | undefined;
}

export interface CreateTileCommand {
  readonly sceneId: string | undefined;
  readonly draft: TileDraft;
}

export interface UpdateTileCommand {
  readonly sceneId: string | undefined;
  readonly tileId: string;
  readonly changes: TileChanges;
}

export interface DeleteTileCommand {
  readonly sceneId: string | undefined;
  readonly tileId: string;
}

export interface TileListResult {
  readonly sceneId: string;
  readonly tiles: readonly Tile[];
}

export interface SceneTileResult {
  readonly sceneId: string;
  readonly tile: Tile;
}

export interface TileDeletionResult {
  readonly sceneId: string;
  readonly tileId: string;
}
