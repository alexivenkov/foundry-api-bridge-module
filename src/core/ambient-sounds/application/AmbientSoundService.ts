import { requireScene, type SceneLocator } from '@/core/shared';
import {
  AmbientSoundCreationFailedError,
  AmbientSoundNotFoundError,
  DEFAULT_SOUND_DARKNESS_RANGE,
  assertAmbientSoundFeatures,
  assertKnownEffect,
  assertSoundSceneLevels,
  resolveSoundDarknessRange,
  type AmbientSound,
  type AmbientSoundChanges,
  type AmbientSoundStore,
  type SoundDarknessRange,
  type SoundEnvironment
} from '@/core/ambient-sounds/domain';
import type {
  AmbientSoundDeletionResult,
  AmbientSoundListResult,
  AmbientSoundMutationResult,
  CreateAmbientSoundCommand,
  DeleteAmbientSoundCommand,
  ListAmbientSoundsQuery,
  UpdateAmbientSoundCommand
} from './commands';

export interface AmbientSoundServiceDependencies {
  readonly scenes: SceneLocator;
  readonly sounds: AmbientSoundStore;
  readonly environment: SoundEnvironment;
}

export class AmbientSoundService {
  constructor(private readonly deps: AmbientSoundServiceDependencies) {}

  listAmbientSounds(query: ListAmbientSoundsQuery): AmbientSoundListResult {
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { sceneId: scene.id, ambientSounds: this.deps.sounds.listAmbientSounds(scene.id) };
  }

  async createAmbientSound(command: CreateAmbientSoundCommand): Promise<AmbientSoundMutationResult> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.checkChanges(scene.id, command.draft, DEFAULT_SOUND_DARKNESS_RANGE);
    const ambientSound = await this.deps.sounds.createAmbientSound(scene.id, command.draft);
    if (ambientSound === null) {
      throw new AmbientSoundCreationFailedError();
    }
    return { sceneId: scene.id, ambientSound };
  }

  async updateAmbientSound(command: UpdateAmbientSoundCommand): Promise<AmbientSoundMutationResult> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const current = this.requireAmbientSound(scene.id, command.ambientSoundId);
    this.checkChanges(scene.id, command.changes, current.darkness);
    const ambientSound = await this.deps.sounds.updateAmbientSound(
      scene.id,
      command.ambientSoundId,
      command.changes
    );
    if (ambientSound === null) {
      throw new AmbientSoundNotFoundError(command.ambientSoundId);
    }
    return { sceneId: scene.id, ambientSound };
  }

  async deleteAmbientSound(command: DeleteAmbientSoundCommand): Promise<AmbientSoundDeletionResult> {
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.requireAmbientSound(scene.id, command.ambientSoundId);
    await this.deps.sounds.deleteAmbientSound(scene.id, command.ambientSoundId);
    return { sceneId: scene.id, ambientSoundId: command.ambientSoundId };
  }

  private requireAmbientSound(sceneId: string, ambientSoundId: string): AmbientSound {
    const ambientSound = this.deps.sounds.findAmbientSound(sceneId, ambientSoundId);
    if (ambientSound === null) {
      throw new AmbientSoundNotFoundError(ambientSoundId);
    }
    return ambientSound;
  }

  private checkChanges(sceneId: string, changes: AmbientSoundChanges, darkness: SoundDarknessRange): void {
    assertAmbientSoundFeatures(changes, this.deps.environment.features());
    resolveSoundDarknessRange(darkness, changes.darkness);
    if (changes.baseEffect !== undefined || changes.muffledEffect !== undefined) {
      const known = this.deps.environment.effectTypes();
      assertKnownEffect(changes.baseEffect?.type, known);
      assertKnownEffect(changes.muffledEffect?.type, known);
    }
    if (changes.levels !== undefined) {
      assertSoundSceneLevels(changes.levels, this.deps.sounds.listSceneLevelIds(sceneId));
    }
  }
}
