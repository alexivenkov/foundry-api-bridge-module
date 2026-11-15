import { foundryGeneration } from '@/compat/foundryVersion';
import type { SceneFeatures, SceneSettings, SceneSettingsReader } from '@/core/scenes/domain';
import { requireSceneDocument, type SceneGameProvider } from './sceneDocuments';
import { sceneFeaturesFor } from './sceneFeatures';
import { toSceneSettings } from './sceneSettingsMapper';

export class FoundrySceneSettingsReader implements SceneSettingsReader {
  constructor(private readonly gameProvider: SceneGameProvider) {}

  readSettings(sceneId: string): SceneSettings {
    return toSceneSettings(requireSceneDocument(this.gameProvider, sceneId));
  }

  features(): SceneFeatures {
    return sceneFeaturesFor(foundryGeneration());
  }
}
