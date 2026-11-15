import type { SceneIdentity, SceneLocator } from '../../../shared';
import type {
  Light,
  LightChanges,
  LightDraft,
  LightEnvironment,
  LightFeatures,
  LightKind,
  LightStore
} from '../../domain';

export function light(overrides: Partial<Light> = {}): Light {
  return {
    id: 'l1',
    x: 100,
    y: 200,
    elevation: 0,
    rotation: 0,
    walls: true,
    vision: false,
    hidden: false,
    dim: 20,
    bright: 10,
    angle: 360,
    color: null,
    alpha: 0.5,
    coloration: 'luminance',
    luminosity: 0.5,
    attenuation: 0.5,
    saturation: 0,
    contrast: 0,
    shadows: 0,
    animation: { type: null, speed: 5, intensity: 5, reverse: false },
    darkness: { min: 0, max: 1 },
    negative: false,
    priority: 0,
    name: null,
    locked: false,
    levels: [],
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

export class FakeLightStore implements LightStore {
  readonly created: Array<{ sceneId: string; draft: LightDraft }> = [];
  readonly updated: Array<{ sceneId: string; lightId: string; changes: LightChanges }> = [];
  readonly deleted: Array<{ sceneId: string; lightId: string }> = [];
  createsNothing = false;
  losesLightOnUpdate = false;
  levelIds: readonly string[] = [];

  private readonly byScene = new Map<string, Light[]>();

  constructor(lights: Readonly<Record<string, readonly Light[]>> = {}) {
    for (const [sceneId, sceneLights] of Object.entries(lights)) {
      this.byScene.set(sceneId, [...sceneLights]);
    }
  }

  listLights(sceneId: string): readonly Light[] {
    return this.byScene.get(sceneId) ?? [];
  }

  findLight(sceneId: string, lightId: string): Light | null {
    return this.listLights(sceneId).find((candidate) => candidate.id === lightId) ?? null;
  }

  createLight(sceneId: string, draft: LightDraft): Promise<Light | null> {
    this.created.push({ sceneId, draft });
    return Promise.resolve(this.createsNothing ? null : light({ id: 'created', x: draft.x, y: draft.y }));
  }

  updateLight(sceneId: string, lightId: string, changes: LightChanges): Promise<Light | null> {
    this.updated.push({ sceneId, lightId, changes });
    const current = this.findLight(sceneId, lightId);
    if (current === null || this.losesLightOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...current, ...(changes.dim !== undefined ? { dim: changes.dim } : {}) });
  }

  deleteLight(sceneId: string, lightId: string): Promise<void> {
    this.deleted.push({ sceneId, lightId });
    return Promise.resolve();
  }

  listSceneLevelIds(): readonly string[] {
    return this.levelIds;
  }
}

export const ALL_LIGHT_FEATURES: LightFeatures = {
  elevation: true,
  darknessSources: true,
  attenuationColorations: true,
  levels: true
};

export class FakeLightEnvironment implements LightEnvironment {
  constructor(
    public lightFeatures: LightFeatures = ALL_LIGHT_FEATURES,
    public registries: Partial<Record<LightKind, readonly string[]>> = {
      light: ['torch', 'pulse'],
      darkness: ['magicalGloom', 'hole']
    }
  ) {}

  features(): LightFeatures {
    return this.lightFeatures;
  }

  animationTypes(kind: LightKind): readonly string[] | null {
    return this.registries[kind] ?? null;
  }
}
