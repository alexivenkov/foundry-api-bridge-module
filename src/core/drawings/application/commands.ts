import type { Drawing, DrawingChanges, DrawingDraft } from '@/core/drawings/domain';

export interface ListDrawingsQuery {
  readonly sceneId: string | undefined;
}

export interface CreateDrawingCommand {
  readonly sceneId: string | undefined;
  readonly draft: DrawingDraft;
}

export interface UpdateDrawingCommand {
  readonly sceneId: string | undefined;
  readonly drawingId: string;
  readonly changes: DrawingChanges;
}

export interface DeleteDrawingCommand {
  readonly sceneId: string | undefined;
  readonly drawingId: string;
}

export interface DrawingListResult {
  readonly sceneId: string;
  readonly drawings: readonly Drawing[];
}

export interface SceneDrawingResult {
  readonly sceneId: string;
  readonly drawing: Drawing;
}

export interface DrawingDeletionResult {
  readonly sceneId: string;
  readonly drawingId: string;
}
