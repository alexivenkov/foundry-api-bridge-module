import {
  type MeasuredTemplate,
  type MeasuredTemplateChanges,
  type MeasuredTemplateDraft,
  type MeasuredTemplateType
} from '@/core/templates/domain';
import type { FoundryTemplateSource } from './foundryTemplateTypes';

// CONST.MEASURED_TEMPLATE_TYPES, verified against Foundry 13.351.
const TYPE_CODE: Readonly<Record<MeasuredTemplateType, string>> = {
  circle: 'circle',
  cone: 'cone',
  rectangle: 'rect',
  ray: 'ray'
};
const TYPE_BY_CODE: Readonly<Record<string, MeasuredTemplateType>> = {
  circle: 'circle',
  cone: 'cone',
  rect: 'rectangle',
  ray: 'ray'
};

function blankAsNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

export function toMeasuredTemplate(source: FoundryTemplateSource): MeasuredTemplate {
  return {
    id: source._id,
    authorId: blankAsNull(source.author),
    type: TYPE_BY_CODE[source.t ?? 'circle'] ?? 'circle',
    x: source.x ?? 0,
    y: source.y ?? 0,
    elevation: source.elevation ?? 0,
    sort: source.sort ?? 0,
    distance: source.distance ?? 0,
    direction: source.direction ?? 0,
    angle: source.angle ?? 0,
    width: source.width ?? 0,
    borderColor: source.borderColor ?? '#000000',
    fillColor: source.fillColor ?? '#ffffff',
    texture: blankAsNull(source.texture),
    hidden: source.hidden ?? false
  };
}

/** Only the attributes that are set become document fields, so an update stays partial. */
export function toFoundryTemplateData(changes: MeasuredTemplateChanges | MeasuredTemplateDraft): Record<string, unknown> {
  const values: Record<string, unknown> = {
    author: 'authorId' in changes ? changes.authorId : undefined,
    t: changes.type !== undefined ? TYPE_CODE[changes.type] : undefined,
    x: changes.x,
    y: changes.y,
    elevation: changes.elevation,
    sort: changes.sort,
    distance: changes.distance,
    direction: changes.direction,
    angle: changes.angle,
    width: changes.width,
    borderColor: changes.borderColor,
    fillColor: changes.fillColor,
    texture: changes.texture,
    hidden: changes.hidden
  };
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      data[key] = value;
    }
  }
  return data;
}
