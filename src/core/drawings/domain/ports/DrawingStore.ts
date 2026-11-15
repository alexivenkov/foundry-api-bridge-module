import type { Drawing, DrawingChanges, DrawingDraft } from '@/core/drawings/domain/model/Drawing';
import type { DrawingCapabilities } from '@/core/drawings/domain/rules/drawingFeatures';

// Reads are synchronous: a scene's drawings live in memory. `createDrawing`
// resolves to null when the core created nothing; `updateDrawing` when the
// drawing is gone. Shapes arrive complete and normalized.
export interface DrawingStore {
  capabilities(): DrawingCapabilities;
  listDrawings(sceneId: string): readonly Drawing[];
  findDrawing(sceneId: string, drawingId: string): Drawing | null;
  createDrawing(sceneId: string, draft: DrawingDraft): Promise<Drawing | null>;
  updateDrawing(sceneId: string, drawingId: string, changes: DrawingChanges): Promise<Drawing | null>;
  deleteDrawing(sceneId: string, drawingId: string): Promise<void>;
}

/** The world's users, who may author a drawing. */
export interface DrawingAuthors {
  exists(userId: string): boolean;
}
