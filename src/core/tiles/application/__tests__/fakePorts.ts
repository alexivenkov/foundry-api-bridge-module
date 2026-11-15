import type { SceneIdentity, SceneLocator } from '../../../shared';
import type { Tile, TileCapabilities, TileChanges, TileDraft, TileStore } from '../../domain';

export const FOUNDRY_13_TILES: TileCapabilities = {
  supported: true,
  names: false,
  levels: false,
  textureOffset: true,
  occlusionModeSet: false
};

export function tile(overrides: Partial<Tile> = {}): Tile {
  return {
    id: 't1',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    elevation: 0,
    sort: 0,
    rotation: 0,
    alpha: 1,
    hidden: false,
    locked: false,
    texture: {
      src: 'tiles/floor.webp',
      tint: '#ffffff',
      scaleX: 1,
      scaleY: 1,
      anchorX: 0.5,
      anchorY: 0.5,
      fit: 'fill',
      alphaThreshold: 0.75,
      offsetX: 0,
      offsetY: 0,
      rotation: 0
    },
    restrictions: { light: false, weather: false },
    occlusion: { modes: [], alpha: 0 },
    video: { loop: true, autoplay: true, volume: 0 },
    ...overrides
  };
}

export class FakeSceneLocator implements SceneLocator {
  constructor(
    private readonly sceneIds: readonly string[],
    private readonly activeId: string | null
  ) {}

  findScene(sceneId: string): SceneIdentity | null {
    return this.sceneIds.includes(sceneId) ? { id: sceneId, name: sceneId } : null;
  }

  findActiveScene(): SceneIdentity | null {
    return this.activeId !== null ? { id: this.activeId, name: this.activeId } : null;
  }
}

export class FakeTileStore implements TileStore {
  readonly created: Array<{ sceneId: string; draft: TileDraft }> = [];
  readonly updated: Array<{ sceneId: string; tileId: string; changes: TileChanges }> = [];
  readonly deleted: Array<{ sceneId: string; tileId: string }> = [];
  createsNothing = false;
  losesTileOnUpdate = false;
  caps: TileCapabilities = FOUNDRY_13_TILES;

  private readonly byScene = new Map<string, Tile[]>();

  constructor(tiles: Readonly<Record<string, readonly Tile[]>> = {}) {
    for (const [sceneId, sceneTiles] of Object.entries(tiles)) {
      this.byScene.set(sceneId, [...sceneTiles]);
    }
  }

  capabilities(): TileCapabilities {
    return this.caps;
  }

  listTiles(sceneId: string): readonly Tile[] {
    return this.byScene.get(sceneId) ?? [];
  }

  findTile(sceneId: string, tileId: string): Tile | null {
    return this.listTiles(sceneId).find((candidate) => candidate.id === tileId) ?? null;
  }

  createTile(sceneId: string, draft: TileDraft): Promise<Tile | null> {
    this.created.push({ sceneId, draft });
    return Promise.resolve(
      this.createsNothing ? null : tile({ id: 'created', x: draft.x, y: draft.y, width: draft.width, height: draft.height })
    );
  }

  updateTile(sceneId: string, tileId: string, changes: TileChanges): Promise<Tile | null> {
    this.updated.push({ sceneId, tileId, changes });
    const current = this.findTile(sceneId, tileId);
    if (current === null || this.losesTileOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...current, elevation: changes.elevation ?? current.elevation });
  }

  deleteTile(sceneId: string, tileId: string): Promise<void> {
    this.deleted.push({ sceneId, tileId });
    return Promise.resolve();
  }
}
