import type { MeasuredTemplateResult, MeasuredTemplateSummary } from '@/commands/types';
import type { MeasuredTemplate, SceneTemplateResult } from '@/core/templates';

export function toWireTemplate(template: MeasuredTemplate): MeasuredTemplateSummary {
  return {
    id: template.id,
    authorId: template.authorId,
    type: template.type,
    x: template.x,
    y: template.y,
    elevation: template.elevation,
    sort: template.sort,
    distance: template.distance,
    direction: template.direction,
    angle: template.angle,
    width: template.width,
    borderColor: template.borderColor,
    fillColor: template.fillColor,
    texture: template.texture,
    hidden: template.hidden
  };
}

export function toTemplateResult(result: SceneTemplateResult): MeasuredTemplateResult {
  return { ...toWireTemplate(result.template), sceneId: result.sceneId };
}
