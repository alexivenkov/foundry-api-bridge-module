import type { SceneIdentity, SceneLocator } from '../../../shared';
import type {
  AmbientSound,
  AmbientSoundChanges,
  AmbientSoundDraft,
  AmbientSoundStore,
  AudioPreloader,
  PositionalSound,
  PositionalSoundEmitter,
  SoundBroadcastGmState,
  SoundEnvironment,
  SoundFeatures,
  SoundPreloadGmState
} from '../../domain';

export function ambientSound(overrides: Partial<AmbientSound> = {}): AmbientSound {
  return {
    id: 's1',
    x: 10,
    y: 20,
    elevation: 0,
    radius: 30,
    path: 'sounds/fire.ogg',
    repeat: false,
    volume: 0.5,
    walls: true,
    easing: true,
    hidden: false,
    darkness: { min: 0, max: 1 },
    baseEffect: { type: null, intensity: 5 },
    muffledEffect: { type: null, intensity: 5 },
    name: null,
    locked: false,
    levels: [],
    ...overrides
  };
}

export function positionalSound(overrides: Partial<PositionalSound> = {}): PositionalSound {
  return {
    src: 'sounds/trap.ogg',
    x: 100,
    y: 200,
    elevation: undefined,
    radius: 30,
    volume: 1,
    easing: true,
    walls: true,
    gmAlways: true,
    baseEffect: undefined,
    muffledEffect: undefined,
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

export class FakeAmbientSoundStore implements AmbientSoundStore {
  readonly created: Array<{ sceneId: string; draft: AmbientSoundDraft }> = [];
  readonly updated: Array<{ sceneId: string; ambientSoundId: string; changes: AmbientSoundChanges }> = [];
  readonly deleted: Array<{ sceneId: string; ambientSoundId: string }> = [];
  createsNothing = false;
  losesSoundOnUpdate = false;
  levelIds: readonly string[] = [];

  private readonly byScene = new Map<string, AmbientSound[]>();

  constructor(sounds: Readonly<Record<string, readonly AmbientSound[]>> = {}) {
    for (const [sceneId, sceneSounds] of Object.entries(sounds)) {
      this.byScene.set(sceneId, [...sceneSounds]);
    }
  }

  listAmbientSounds(sceneId: string): readonly AmbientSound[] {
    return this.byScene.get(sceneId) ?? [];
  }

  findAmbientSound(sceneId: string, ambientSoundId: string): AmbientSound | null {
    return this.listAmbientSounds(sceneId).find((candidate) => candidate.id === ambientSoundId) ?? null;
  }

  createAmbientSound(sceneId: string, draft: AmbientSoundDraft): Promise<AmbientSound | null> {
    this.created.push({ sceneId, draft });
    return Promise.resolve(
      this.createsNothing ? null : ambientSound({ id: 'created', x: draft.x, y: draft.y, path: draft.path })
    );
  }

  updateAmbientSound(
    sceneId: string,
    ambientSoundId: string,
    changes: AmbientSoundChanges
  ): Promise<AmbientSound | null> {
    this.updated.push({ sceneId, ambientSoundId, changes });
    const current = this.findAmbientSound(sceneId, ambientSoundId);
    if (current === null || this.losesSoundOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...current, ...(changes.radius !== undefined ? { radius: changes.radius } : {}) });
  }

  deleteAmbientSound(sceneId: string, ambientSoundId: string): Promise<void> {
    this.deleted.push({ sceneId, ambientSoundId });
    return Promise.resolve();
  }

  listSceneLevelIds(): readonly string[] {
    return this.levelIds;
  }
}

export const ALL_SOUND_FEATURES: SoundFeatures = {
  elevation: true,
  effects: true,
  positionalElevation: true,
  levels: true
};

export const V11_SOUND_FEATURES: SoundFeatures = {
  elevation: false,
  effects: false,
  positionalElevation: false,
  levels: false
};

export class FakeSoundEnvironment implements SoundEnvironment {
  constructor(
    public soundFeatures: SoundFeatures = ALL_SOUND_FEATURES,
    public effects: readonly string[] | null = ['lowpass', 'highpass', 'reverb']
  ) {}

  features(): SoundFeatures {
    return this.soundFeatures;
  }

  effectTypes(): readonly string[] | null {
    return this.effects;
  }
}

export class FakePositionalSoundEmitter implements PositionalSoundEmitter {
  readonly emitted: PositionalSound[] = [];
  available = true;
  sceneOnCanvas: string | null = 'active';
  outcome: SoundBroadcastGmState = 'done';

  isAvailable(): boolean {
    return this.available;
  }

  canvasSceneId(): string | null {
    return this.sceneOnCanvas;
  }

  emit(sound: PositionalSound): Promise<SoundBroadcastGmState> {
    this.emitted.push(sound);
    return Promise.resolve(this.outcome);
  }
}

export class FakeAudioPreloader implements AudioPreloader {
  readonly preloaded: string[] = [];
  available = true;
  outcome: SoundPreloadGmState = 'done';

  isAvailable(): boolean {
    return this.available;
  }

  preload(src: string): Promise<SoundPreloadGmState> {
    this.preloaded.push(src);
    return Promise.resolve(this.outcome);
  }
}
