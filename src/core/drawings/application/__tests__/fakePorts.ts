import type { SceneIdentity, SceneLocator } from '../../../shared';
import type {
  Drawing,
  DrawingAuthors,
  DrawingCapabilities,
  DrawingChanges,
  DrawingDraft,
  DrawingStore
} from '../../domain';

export function drawing(overrides: Partial<Drawing> = {}): Drawing {
  return {
    id: 'd1',
    authorId: 'gmgmgmgmgmgmgmgm',
    x: 0,
    y: 0,
    shape: { type: 'rectangle', width: 200, height: 100, points: [] },
    elevation: 0,
    sort: 0,
    rotation: 0,
    bezierFactor: 0,
    fill: { type: 'none', color: '#aa33cc', alpha: 0.5, texture: null },
    stroke: { width: 8, color: '#aa33cc', alpha: 1 },
    text: { content: null, fontFamily: 'Signika', fontSize: 48, color: '#ffffff', alpha: 1 },
    hidden: false,
    locked: false,
    interface: false,
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

export class FakeAuthors implements DrawingAuthors {
  constructor(private readonly userIds: readonly string[]) {}

  exists(userId: string): boolean {
    return this.userIds.includes(userId);
  }
}

export class FakeDrawingStore implements DrawingStore {
  readonly created: Array<{ sceneId: string; draft: DrawingDraft }> = [];
  readonly updated: Array<{ sceneId: string; drawingId: string; changes: DrawingChanges }> = [];
  readonly deleted: Array<{ sceneId: string; drawingId: string }> = [];
  createsNothing = false;
  losesDrawingOnUpdate = false;
  caps: DrawingCapabilities = { supported: true, names: false, levels: false };

  private readonly byScene = new Map<string, Drawing[]>();

  constructor(drawings: Readonly<Record<string, readonly Drawing[]>> = {}) {
    for (const [sceneId, sceneDrawings] of Object.entries(drawings)) {
      this.byScene.set(sceneId, [...sceneDrawings]);
    }
  }

  capabilities(): DrawingCapabilities {
    return this.caps;
  }

  listDrawings(sceneId: string): readonly Drawing[] {
    return this.byScene.get(sceneId) ?? [];
  }

  findDrawing(sceneId: string, drawingId: string): Drawing | null {
    return this.listDrawings(sceneId).find((candidate) => candidate.id === drawingId) ?? null;
  }

  createDrawing(sceneId: string, draft: DrawingDraft): Promise<Drawing | null> {
    this.created.push({ sceneId, draft });
    return Promise.resolve(this.createsNothing ? null : drawing({ id: 'created', x: draft.x, y: draft.y }));
  }

  updateDrawing(sceneId: string, drawingId: string, changes: DrawingChanges): Promise<Drawing | null> {
    this.updated.push({ sceneId, drawingId, changes });
    const current = this.findDrawing(sceneId, drawingId);
    if (current === null || this.losesDrawingOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...current, x: changes.x ?? current.x, y: changes.y ?? current.y });
  }

  deleteDrawing(sceneId: string, drawingId: string): Promise<void> {
    this.deleted.push({ sceneId, drawingId });
    return Promise.resolve();
  }
}
