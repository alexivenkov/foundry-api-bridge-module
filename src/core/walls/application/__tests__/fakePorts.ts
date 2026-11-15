import type { SceneIdentity, SceneLocator } from '../../../shared';
import type { Wall, WallChanges, WallDraft, WallStore } from '../../domain';

export function wall(overrides: Partial<Wall> = {}): Wall {
  return {
    id: 'w1',
    segment: [0, 0, 100, 0],
    door: 'none',
    doorState: 'closed',
    movement: 'normal',
    sight: 'normal',
    sound: 'normal',
    light: 'normal',
    direction: 'both',
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

export class FakeWallStore implements WallStore {
  readonly created: Array<{ sceneId: string; draft: WallDraft }> = [];
  readonly updated: Array<{ sceneId: string; wallId: string; changes: WallChanges }> = [];
  readonly deleted: Array<{ sceneId: string; wallId: string }> = [];
  createsNothing = false;
  losesWallOnUpdate = false;

  private readonly byScene = new Map<string, Wall[]>();

  constructor(walls: Readonly<Record<string, readonly Wall[]>> = {}) {
    for (const [sceneId, sceneWalls] of Object.entries(walls)) {
      this.byScene.set(sceneId, [...sceneWalls]);
    }
  }

  listWalls(sceneId: string): readonly Wall[] {
    return this.byScene.get(sceneId) ?? [];
  }

  findWall(sceneId: string, wallId: string): Wall | null {
    return this.listWalls(sceneId).find((candidate) => candidate.id === wallId) ?? null;
  }

  createWall(sceneId: string, draft: WallDraft): Promise<Wall | null> {
    this.created.push({ sceneId, draft });
    return Promise.resolve(this.createsNothing ? null : wall({ id: 'created', segment: draft.segment }));
  }

  updateWall(sceneId: string, wallId: string, changes: WallChanges): Promise<Wall | null> {
    this.updated.push({ sceneId, wallId, changes });
    const current = this.findWall(sceneId, wallId);
    if (current === null || this.losesWallOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      ...current,
      ...(changes.doorState !== undefined ? { doorState: changes.doorState } : {}),
      ...(changes.door !== undefined ? { door: changes.door } : {})
    });
  }

  deleteWall(sceneId: string, wallId: string): Promise<void> {
    this.deleted.push({ sceneId, wallId });
    return Promise.resolve();
  }
}
