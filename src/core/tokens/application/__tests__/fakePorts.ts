import type { SceneIdentity, SceneLocator } from '../../../shared';
import type {
  CollisionChecker,
  MovementSurface,
  MovementSurfaceProbe,
  PassageWall,
  Passages,
  PlacementOptions,
  SceneGrid,
  SceneGridReader,
  Token,
  TokenChanges,
  TokenDraft,
  TokenPlacement,
  TokenStore,
  TokenTargeting
} from '../../domain';

export function token(overrides: Partial<Token> = {}): Token {
  return {
    id: 't1',
    name: 'Goblin',
    x: 100,
    y: 0,
    width: 1,
    height: 1,
    elevation: 0,
    rotation: 0,
    hidden: false,
    textureSrc: 'icons/goblin.png',
    disposition: 'hostile',
    actorId: 'a1',
    actorLink: false,
    actor: { id: 'a1', type: 'npc', statuses: [], vitals: { hp: { value: 7, max: 7 }, ac: 15 } },
    ...overrides
  };
}

export class FakeSceneLocator implements SceneLocator {
  constructor(
    private readonly sceneIds: readonly string[],
    private readonly activeId: string | null
  ) {}

  findScene(sceneId: string): SceneIdentity | null {
    return this.sceneIds.includes(sceneId) ? { id: sceneId, name: `Scene ${sceneId}` } : null;
  }

  findActiveScene(): SceneIdentity | null {
    return this.activeId !== null ? { id: this.activeId, name: `Scene ${this.activeId}` } : null;
  }
}

export interface PlacedStep {
  readonly placement: TokenPlacement;
  readonly options: PlacementOptions;
}

export class FakeTokenStore implements TokenStore, SceneGridReader {
  readonly created: Array<{ sceneId: string; draft: TokenDraft }> = [];
  readonly updated: Array<{ tokenId: string; changes: TokenChanges }> = [];
  readonly placed: PlacedStep[] = [];
  readonly deleted: string[] = [];
  createsNothing = false;
  losesTokenAfterStep: number | null = null;
  grid: SceneGrid = { size: 100, distance: 5, units: 'ft' };

  private readonly byScene = new Map<string, Token[]>();

  constructor(tokens: Readonly<Record<string, readonly Token[]>> = {}) {
    for (const [sceneId, sceneTokens] of Object.entries(tokens)) {
      this.byScene.set(sceneId, [...sceneTokens]);
    }
  }

  listTokens(sceneId: string): readonly Token[] {
    return this.byScene.get(sceneId) ?? [];
  }

  findToken(sceneId: string, tokenId: string): Token | null {
    return this.listTokens(sceneId).find((candidate) => candidate.id === tokenId) ?? null;
  }

  createToken(sceneId: string, draft: TokenDraft): Promise<Token | null> {
    this.created.push({ sceneId, draft });
    return Promise.resolve(this.createsNothing ? null : token({ id: 'created', x: draft.x, y: draft.y }));
  }

  updateToken(sceneId: string, tokenId: string, changes: TokenChanges): Promise<Token | null> {
    this.updated.push({ tokenId, changes });
    const current = this.findToken(sceneId, tokenId);
    return Promise.resolve(current !== null ? { ...current, hidden: changes.hidden ?? current.hidden } : null);
  }

  placeToken(
    sceneId: string,
    tokenId: string,
    placement: TokenPlacement,
    options: PlacementOptions
  ): Promise<Token | null> {
    this.placed.push({ placement, options });
    const tokens = this.byScene.get(sceneId) ?? [];
    const index = tokens.findIndex((candidate) => candidate.id === tokenId);
    const current = tokens[index];
    if (current === undefined || this.losesTokenAfterStep === this.placed.length) {
      return Promise.resolve(null);
    }
    const moved: Token = {
      ...current,
      x: placement.x,
      y: placement.y,
      elevation: placement.elevation ?? current.elevation,
      rotation: placement.rotation ?? current.rotation
    };
    tokens[index] = moved;
    return Promise.resolve(moved);
  }

  deleteToken(_sceneId: string, tokenId: string): Promise<void> {
    this.deleted.push(tokenId);
    return Promise.resolve();
  }

  readGrid(): SceneGrid {
    return this.grid;
  }
}

export class FakeSurface implements MovementSurface {
  constructor(private readonly value: MovementSurfaceProbe | null) {}

  probe(): MovementSurfaceProbe | null {
    return this.value;
  }
}

export function surface(collision: CollisionChecker, gridSize = 100): FakeSurface {
  return new FakeSurface({ gridSize, collision });
}

export class FakePassages implements Passages {
  readonly opened: string[] = [];
  readonly listed: string[] = [];
  stuckDoors: readonly string[] = [];

  constructor(private readonly walls: readonly PassageWall[] = []) {}

  listWalls(sceneId: string): readonly PassageWall[] {
    this.listed.push(sceneId);
    return this.walls;
  }

  openDoor(_sceneId: string, wallId: string): Promise<boolean> {
    if (this.stuckDoors.includes(wallId)) {
      return Promise.resolve(false);
    }
    this.opened.push(wallId);
    return Promise.resolve(true);
  }
}

export class FakeTargeting implements TokenTargeting {
  readonly calls: Array<{ tokenId: string; targeted: boolean; releaseOthers: boolean }> = [];
  available = true;
  onCanvas: readonly string[] = ['t1'];
  targets = 2;

  isAvailable(): boolean {
    return this.available;
  }

  setTarget(tokenId: string, targeted: boolean, releaseOthers: boolean): boolean {
    if (!this.onCanvas.includes(tokenId)) {
      return false;
    }
    this.calls.push({ tokenId, targeted, releaseOthers });
    return true;
  }

  clearTargets(): number {
    const count = this.targets;
    this.targets = 0;
    return count;
  }
}
