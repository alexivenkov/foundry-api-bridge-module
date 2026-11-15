import { emptyAsAbsent } from '@/core/shared';
import type {
  CreateTemplateCommand,
  DeleteTemplateCommand,
  ListTemplatesQuery,
  UpdateTemplateCommand
} from '@/core/templates/application';
import type { MeasuredTemplateChanges } from '@/core/templates/domain';
import type {
  CreateTemplateRequest,
  DeleteTemplateRequest,
  GetTemplatesRequest,
  UpdateTemplateRequest
} from './templateSchemas';

function toTemplateChanges(request: Omit<UpdateTemplateRequest, 'sceneId' | 'templateId'>): MeasuredTemplateChanges {
  return {
    type: request.type,
    x: request.x,
    y: request.y,
    elevation: request.elevation,
    sort: request.sort,
    distance: request.distance,
    direction: request.direction,
    angle: request.angle,
    width: request.width,
    borderColor: request.borderColor,
    fillColor: request.fillColor,
    texture: request.texture,
    hidden: request.hidden
  };
}

export function toListTemplatesQuery(request: GetTemplatesRequest): ListTemplatesQuery {
  return { sceneId: emptyAsAbsent(request.sceneId) };
}

export function toCreateTemplateCommand(request: CreateTemplateRequest): CreateTemplateCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    draft: {
      ...toTemplateChanges(request),
      type: request.type,
      x: request.x,
      y: request.y,
      distance: request.distance,
      authorId: request.authorId
    }
  };
}

export function toUpdateTemplateCommand(request: UpdateTemplateRequest): UpdateTemplateCommand {
  return {
    sceneId: emptyAsAbsent(request.sceneId),
    templateId: request.templateId,
    changes: toTemplateChanges(request)
  };
}

export function toDeleteTemplateCommand(request: DeleteTemplateRequest): DeleteTemplateCommand {
  return { sceneId: emptyAsAbsent(request.sceneId), templateId: request.templateId };
}
