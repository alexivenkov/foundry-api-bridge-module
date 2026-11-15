import { foundryGeneration } from '@/compat/foundryVersion';
import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import type {
  Drawing,
  DrawingAuthors,
  DrawingCapabilities,
  DrawingChanges,
  DrawingDraft,
  DrawingStore
} from '@/core/drawings/domain';
import { toDrawing, toFoundryDrawingData } from './drawingMapper';
import type { FoundryDrawingGame, FoundryDrawingScene } from './foundryDrawingTypes';

export type DrawingGameProvider = GameProvider<FoundryDrawingGame>;

// Foundry 12 turned the drawing's `z` into `elevation` and added `sort` and
// `interface`; Foundry 14 added `name` and `levels`.
const FIRST_SUPPORTED_GENERATION = 12;
const FIRST_LEVELS_GENERATION = 14;

/** Anti-corruption layer over a scene's embedded Drawing documents. */
export class FoundryDrawingStore implements DrawingStore, DrawingAuthors {
  constructor(private readonly gameProvider: DrawingGameProvider) {}

  capabilities(): DrawingCapabilities {
    const generation = foundryGeneration();
    return {
      supported: generation >= FIRST_SUPPORTED_GENERATION,
      names: generation >= FIRST_LEVELS_GENERATION,
      levels: generation >= FIRST_LEVELS_GENERATION
    };
  }

  exists(userId: string): boolean {
    return this.gameProvider.getGame().users.get(userId) !== undefined;
  }

  listDrawings(sceneId: string): readonly Drawing[] {
    const generation = foundryGeneration();
    return this.requireScene(sceneId).drawings.contents.map((document) => toDrawing(document._source, generation));
  }

  findDrawing(sceneId: string, drawingId: string): Drawing | null {
    const document = this.requireScene(sceneId).drawings.get(drawingId);
    return document !== undefined ? toDrawing(document._source, foundryGeneration()) : null;
  }

  async createDrawing(sceneId: string, draft: DrawingDraft): Promise<Drawing | null> {
    const created = await this.requireScene(sceneId).createEmbeddedDocuments('Drawing', [
      toFoundryDrawingData(draft)
    ]);
    const document = created[0];
    return document !== undefined ? toDrawing(document._source, foundryGeneration()) : null;
  }

  async updateDrawing(sceneId: string, drawingId: string, changes: DrawingChanges): Promise<Drawing | null> {
    const document = this.requireScene(sceneId).drawings.get(drawingId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryDrawingData(changes));
    return toDrawing(document._source, foundryGeneration());
  }

  async deleteDrawing(sceneId: string, drawingId: string): Promise<void> {
    await this.requireScene(sceneId).deleteEmbeddedDocuments('Drawing', [drawingId]);
  }

  private requireScene(sceneId: string): FoundryDrawingScene {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return scene;
  }
}
