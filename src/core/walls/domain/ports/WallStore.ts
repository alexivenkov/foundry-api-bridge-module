import type { Wall, WallChanges, WallDraft } from '@/core/walls/domain/model';

// Reads are synchronous: a scene's walls live in memory. `createWall` resolves
// to null when the core created nothing; `updateWall` when the wall is gone.
export interface WallStore {
  listWalls(sceneId: string): readonly Wall[];
  findWall(sceneId: string, wallId: string): Wall | null;
  createWall(sceneId: string, draft: WallDraft): Promise<Wall | null>;
  updateWall(sceneId: string, wallId: string, changes: WallChanges): Promise<Wall | null>;
  deleteWall(sceneId: string, wallId: string): Promise<void>;
}
