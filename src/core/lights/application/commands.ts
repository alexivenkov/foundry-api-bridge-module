import type { Light, LightChanges, LightDraft } from '@/core/lights/domain';

export interface ListLightsQuery {
  readonly sceneId: string | undefined;
}

export interface CreateLightCommand {
  readonly sceneId: string | undefined;
  readonly draft: LightDraft;
}

export interface UpdateLightCommand {
  readonly sceneId: string | undefined;
  readonly lightId: string;
  readonly changes: LightChanges;
}

export interface DeleteLightCommand {
  readonly sceneId: string | undefined;
  readonly lightId: string;
}

export interface LightListResult {
  readonly sceneId: string;
  readonly lights: readonly Light[];
}

export interface LightMutationResult {
  readonly sceneId: string;
  readonly light: Light;
}

export interface LightDeletionResult {
  readonly sceneId: string;
  readonly lightId: string;
}
