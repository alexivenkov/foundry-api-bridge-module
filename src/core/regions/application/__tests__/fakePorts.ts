import type { SceneIdentity, SceneLocator } from '../../../shared';
import type {
  ElevatedPoint,
  Region,
  RegionBehavior,
  RegionBehaviorCatalog,
  RegionBehaviorChanges,
  RegionBehaviorDraft,
  RegionBehaviorStore,
  RegionChanges,
  RegionDraft,
  RegionFeatures,
  RegionMacroResolver,
  RegionPointTest,
  RegionStore,
  RegionTokenRef,
  ScriptBehaviorPolicy
} from '../../domain';

export const V13_FEATURES: RegionFeatures = {
  available: true,
  shapeTypes: ['rectangle', 'circle', 'ellipse', 'polygon'],
  visibilities: ['layer', 'gamemaster', 'always'],
  extendedModel: false
};

export const V14_FEATURES: RegionFeatures = {
  available: true,
  shapeTypes: ['rectangle', 'circle', 'ellipse', 'polygon', 'cone', 'ring', 'line', 'emanation', 'token', 'grid'],
  visibilities: ['layer', 'gamemaster', 'always', 'observer', 'layer-unlocked'],
  extendedModel: true
};

export function behavior(overrides: Partial<RegionBehavior> = {}): RegionBehavior {
  return {
    id: 'b1',
    name: 'Trap',
    type: 'pauseGame',
    disabled: false,
    config: { kind: 'pauseGame', settings: { once: false } },
    ...overrides
  };
}

export function region(overrides: Partial<Region> = {}): Region {
  return {
    id: 'r1',
    name: 'Pit',
    color: '#ff0000',
    shapes: [{ type: 'rectangle', x: 0, y: 0, width: 100, height: 100, rotation: 0, hole: false }],
    elevation: { bottom: 0, top: 10 },
    visibility: 'layer',
    locked: false,
    behaviors: [behavior()],
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

export class FakeRegionStore implements RegionStore {
  readonly created: Array<{ sceneId: string; draft: RegionDraft }> = [];
  readonly updated: Array<{ sceneId: string; regionId: string; changes: RegionChanges }> = [];
  readonly deleted: Array<{ sceneId: string; regionId: string }> = [];
  readonly pointTests: Array<{ sceneId: string; regionId: string; point: ElevatedPoint }> = [];
  featureSet: RegionFeatures = V14_FEATURES;
  createsNothing = false;
  losesRegionOnUpdate = false;
  tokenIds: string[] = ['t1'];
  levelIds: string[] = ['l1'];
  tokensInside: RegionTokenRef[] = [{ id: 't1', name: 'Goblin' }];
  pointAnswer: RegionPointTest = { kind: 'answered', inside: true };

  private readonly byScene = new Map<string, Region[]>();

  constructor(regions: Readonly<Record<string, readonly Region[]>> = {}) {
    for (const [sceneId, sceneRegions] of Object.entries(regions)) {
      this.byScene.set(sceneId, [...sceneRegions]);
    }
  }

  features(): RegionFeatures {
    return this.featureSet;
  }

  listRegions(sceneId: string): readonly Region[] {
    return this.byScene.get(sceneId) ?? [];
  }

  findRegion(sceneId: string, regionId: string): Region | null {
    return this.listRegions(sceneId).find((candidate) => candidate.id === regionId) ?? null;
  }

  createRegion(sceneId: string, draft: RegionDraft): Promise<Region | null> {
    this.created.push({ sceneId, draft });
    return Promise.resolve(this.createsNothing ? null : region({ id: 'created', name: draft.name, behaviors: [] }));
  }

  updateRegion(sceneId: string, regionId: string, changes: RegionChanges): Promise<Region | null> {
    this.updated.push({ sceneId, regionId, changes });
    const current = this.findRegion(sceneId, regionId);
    if (current === null || this.losesRegionOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...current, ...(changes.name !== undefined ? { name: changes.name } : {}) });
  }

  deleteRegion(sceneId: string, regionId: string): Promise<void> {
    this.deleted.push({ sceneId, regionId });
    return Promise.resolve();
  }

  hasToken(_sceneId: string, tokenId: string): boolean {
    return this.tokenIds.includes(tokenId);
  }

  findMissingLevels(_sceneId: string, levelIds: readonly string[]): readonly string[] {
    return levelIds.filter((levelId) => !this.levelIds.includes(levelId));
  }

  listTokensInside(): readonly RegionTokenRef[] {
    return this.tokensInside;
  }

  testPoint(sceneId: string, regionId: string, point: ElevatedPoint): RegionPointTest {
    this.pointTests.push({ sceneId, regionId, point });
    return this.pointAnswer;
  }
}

export class FakeRegionBehaviorStore implements RegionBehaviorStore {
  readonly created: Array<{ sceneId: string; regionId: string; draft: RegionBehaviorDraft }> = [];
  readonly updated: Array<{ sceneId: string; regionId: string; behaviorId: string; changes: RegionBehaviorChanges }> =
    [];
  readonly deleted: Array<{ sceneId: string; regionId: string; behaviorId: string }> = [];
  createsNothing = false;
  losesBehaviorOnUpdate = false;

  createBehavior(sceneId: string, regionId: string, draft: RegionBehaviorDraft): Promise<RegionBehavior | null> {
    this.created.push({ sceneId, regionId, draft });
    return Promise.resolve(this.createsNothing ? null : behavior({ id: 'created', type: draft.type }));
  }

  updateBehavior(
    sceneId: string,
    regionId: string,
    behaviorId: string,
    changes: RegionBehaviorChanges
  ): Promise<RegionBehavior | null> {
    this.updated.push({ sceneId, regionId, behaviorId, changes });
    return Promise.resolve(this.losesBehaviorOnUpdate ? null : behavior({ id: behaviorId }));
  }

  deleteBehavior(sceneId: string, regionId: string, behaviorId: string): Promise<void> {
    this.deleted.push({ sceneId, regionId, behaviorId });
    return Promise.resolve();
  }
}

export class FakeBehaviorCatalog implements RegionBehaviorCatalog {
  types: readonly string[] | null = [
    'adjustDarknessLevel',
    'displayScrollingText',
    'executeMacro',
    'executeScript',
    'modifyMovementCost',
    'pauseGame',
    'suppressWeather',
    'teleportToken',
    'toggleBehavior',
    'mymodule.trap'
  ];
  events: readonly string[] | null = ['tokenEnter', 'tokenExit', 'tokenMoveIn', 'tokenAnimateIn'];
  actions: readonly string[] | null = ['walk', 'fly', 'swim', 'burrow'];
  extended = false;

  registeredTypes(): readonly string[] | null {
    return this.types;
  }

  regionEvents(): readonly string[] | null {
    return this.events;
  }

  movementCostActions(): readonly string[] | null {
    return this.actions;
  }

  extendedTeleport(): boolean {
    return this.extended;
  }
}

export class FakeScriptPolicy implements ScriptBehaviorPolicy {
  checks = 0;

  constructor(public allowed: boolean) {}

  allowsScripts(): boolean {
    this.checks += 1;
    return this.allowed;
  }
}

/** Macros by UUID: their type, world or compendium alike. */
export class FakeMacroResolver implements RegionMacroResolver {
  readonly lookups: string[] = [];

  constructor(
    private readonly types: Readonly<Record<string, string>> = {
      'Macro.chatchatchatchat': 'chat',
      'Macro.scriptscriptscri': 'script',
      'Compendium.world.macros.Macro.scriptscriptscri': 'script'
    }
  ) {}

  findMacroType(macroUuid: string): Promise<string | null> {
    this.lookups.push(macroUuid);
    return Promise.resolve(this.types[macroUuid] ?? null);
  }
}
