import { CoreFeatureUnavailableError, requireScene, type SceneLocator } from '@/core/shared';
import {
  DRAWING_DEFAULTS,
  DrawingAuthorNotFoundError,
  DrawingCreationFailedError,
  DrawingNotFoundError,
  DrawingShapeError,
  InvisibleDrawingError,
  findDrawingVisibilityProblem,
  findUnsupportedDrawingFeature,
  planDrawingShape,
  type Drawing,
  type DrawingAuthors,
  type DrawingChanges,
  type DrawingShape,
  type DrawingStore,
  type DrawingVisibilityState
} from '@/core/drawings/domain';
import type {
  CreateDrawingCommand,
  DeleteDrawingCommand,
  DrawingDeletionResult,
  DrawingListResult,
  ListDrawingsQuery,
  SceneDrawingResult,
  UpdateDrawingCommand
} from './commands';

export interface DrawingServiceDependencies {
  readonly scenes: SceneLocator;
  readonly drawings: DrawingStore;
  readonly authors: DrawingAuthors;
}

type VisibilityBase = Omit<DrawingVisibilityState, 'shape'>;

const NEW_DRAWING: VisibilityBase = { ...DRAWING_DEFAULTS, text: null };

function visibilityBase(drawing: Drawing): VisibilityBase {
  return {
    strokeWidth: drawing.stroke.width,
    strokeAlpha: drawing.stroke.alpha,
    fillType: drawing.fill.type,
    fillAlpha: drawing.fill.alpha,
    text: drawing.text.content,
    textAlpha: drawing.text.alpha
  };
}

function visibilityAfter(base: VisibilityBase, shape: DrawingShape, changes: DrawingChanges): DrawingVisibilityState {
  return {
    shape,
    strokeWidth: changes.stroke?.width ?? base.strokeWidth,
    strokeAlpha: changes.stroke?.alpha ?? base.strokeAlpha,
    fillType: changes.fill?.type ?? base.fillType,
    fillAlpha: changes.fill?.alpha ?? base.fillAlpha,
    text: changes.text?.content !== undefined ? changes.text.content : base.text,
    textAlpha: changes.text?.alpha ?? base.textAlpha
  };
}

/** Only these attributes decide whether a drawing shows anything; other updates leave it as it was. */
function touchesVisibility(changes: DrawingChanges): boolean {
  return (
    changes.shape !== undefined ||
    changes.stroke?.width !== undefined ||
    changes.stroke?.alpha !== undefined ||
    changes.fill?.type !== undefined ||
    changes.fill?.alpha !== undefined ||
    changes.text?.content !== undefined ||
    changes.text?.alpha !== undefined
  );
}

function requireVisible(state: DrawingVisibilityState): void {
  const problem = findDrawingVisibilityProblem(state);
  if (problem !== null) {
    throw new InvisibleDrawingError(problem);
  }
}

export class DrawingService {
  constructor(private readonly deps: DrawingServiceDependencies) {}

  listDrawings(query: ListDrawingsQuery): DrawingListResult {
    this.requireSupport();
    const scene = requireScene(this.deps.scenes, query.sceneId);
    return { sceneId: scene.id, drawings: this.deps.drawings.listDrawings(scene.id) };
  }

  async createDrawing(command: CreateDrawingCommand): Promise<SceneDrawingResult> {
    const { draft } = command;
    this.requireSupport(draft);
    const scene = requireScene(this.deps.scenes, command.sceneId);
    if (draft.authorId !== undefined && !this.deps.authors.exists(draft.authorId)) {
      throw new DrawingAuthorNotFoundError(draft.authorId);
    }

    const planned = planDrawingShape(null, draft);
    const shape = planned.shape;
    if (shape === undefined) {
      throw new DrawingShapeError('A drawing needs a shape');
    }
    requireVisible(visibilityAfter(NEW_DRAWING, shape, draft));

    const drawing = await this.deps.drawings.createDrawing(scene.id, {
      ...draft,
      x: planned.x ?? draft.x,
      y: planned.y ?? draft.y,
      shape
    });
    if (drawing === null) {
      throw new DrawingCreationFailedError();
    }
    return { sceneId: scene.id, drawing };
  }

  async updateDrawing(command: UpdateDrawingCommand): Promise<SceneDrawingResult> {
    const { changes } = command;
    this.requireSupport(changes);
    const scene = requireScene(this.deps.scenes, command.sceneId);
    const current = this.requireDrawing(scene.id, command.drawingId);

    const planned = planDrawingShape(current, changes);
    if (touchesVisibility(changes)) {
      requireVisible(visibilityAfter(visibilityBase(current), planned.shape ?? current.shape, changes));
    }

    const drawing = await this.deps.drawings.updateDrawing(scene.id, command.drawingId, {
      ...changes,
      x: planned.x,
      y: planned.y,
      shape: planned.shape
    });
    if (drawing === null) {
      throw new DrawingNotFoundError(command.drawingId);
    }
    return { sceneId: scene.id, drawing };
  }

  async deleteDrawing(command: DeleteDrawingCommand): Promise<DrawingDeletionResult> {
    this.requireSupport();
    const scene = requireScene(this.deps.scenes, command.sceneId);
    this.requireDrawing(scene.id, command.drawingId);
    await this.deps.drawings.deleteDrawing(scene.id, command.drawingId);
    return { sceneId: scene.id, drawingId: command.drawingId };
  }

  private requireSupport(changes?: DrawingChanges): void {
    const refusal = findUnsupportedDrawingFeature(this.deps.drawings.capabilities(), changes);
    if (refusal !== null) {
      throw new CoreFeatureUnavailableError(refusal);
    }
  }

  private requireDrawing(sceneId: string, drawingId: string): Drawing {
    const drawing = this.deps.drawings.findDrawing(sceneId, drawingId);
    if (drawing === null) {
      throw new DrawingNotFoundError(drawingId);
    }
    return drawing;
  }
}
