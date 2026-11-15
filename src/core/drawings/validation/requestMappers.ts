import type {
  CreateDrawingCommand,
  DeleteDrawingCommand,
  ListDrawingsQuery,
  UpdateDrawingCommand
} from '@/core/drawings/application';
import type { DrawingChanges, DrawingDraft } from '@/core/drawings/domain';
import { emptyAsAbsent } from '@/core/shared';
import type {
  CreateDrawingRequest,
  DeleteDrawingRequest,
  GetDrawingsRequest,
  UpdateDrawingRequest
} from './drawingSchemas';

type DrawingAttributesRequest = Omit<UpdateDrawingRequest, 'sceneId' | 'drawingId' | 'x' | 'y' | 'shape'>;

function toDrawingAttributes(request: DrawingAttributesRequest): DrawingChanges {
  return {
    elevation: request.elevation,
    sort: request.sort,
    rotation: request.rotation,
    bezierFactor: request.bezierFactor,
    fill: request.fill,
    stroke: request.stroke,
    text:
      request.text !== undefined
        ? { ...request.text, content: request.text.content === '' ? null : request.text.content }
        : undefined,
    hidden: request.hidden,
    locked: request.locked,
    interface: request.interface,
    name: request.name === '' ? null : request.name,
    levels: request.levels !== undefined ? [...new Set(request.levels)] : undefined
  };
}

function toDraftShape(shape: CreateDrawingRequest['shape']): DrawingDraft['shape'] {
  return shape.type === 'polygon'
    ? { type: 'polygon', points: shape.points }
    : { type: shape.type, width: shape.width, height: shape.height };
}

export function toListDrawingsQuery(request: GetDrawingsRequest): ListDrawingsQuery {
  return { sceneId: emptyAsAbsent(request.sceneId) };
}

export function toCreateDrawingCommand(request: CreateDrawingRequest): CreateDrawingCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    draft: {
      ...toDrawingAttributes(request),
      x: request.x,
      y: request.y,
      shape: toDraftShape(request.shape),
      authorId: request.authorId
    }
  };
}

export function toUpdateDrawingCommand(request: UpdateDrawingRequest): UpdateDrawingCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    drawingId: request.drawingId,
    changes: { ...toDrawingAttributes(request), x: request.x, y: request.y, shape: request.shape }
  };
}

export function toDeleteDrawingCommand(request: DeleteDrawingRequest): DeleteDrawingCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), drawingId: request.drawingId };
}
