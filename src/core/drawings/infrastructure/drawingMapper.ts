import type { Drawing, DrawingChanges, DrawingDraft } from '@/core/drawings/domain';
import { fillTypeFromCode, fillTypeToCode, shapeTypeFromCode, shapeTypeToCode } from './drawingCodes';
import type { FoundryDrawingSource } from './foundryDrawingTypes';

const GENERATION_WITH_NAMES_AND_LEVELS = 14;
const DEFAULT_COLOR = '#ffffff';

function blankAsNull(value: string | null | undefined): string | null {
  return value ? value : null;
}

export function toDrawing(source: FoundryDrawingSource, generation: number): Drawing {
  const drawing: Drawing = {
    id: source._id,
    authorId: blankAsNull(source.author),
    x: source.x ?? 0,
    y: source.y ?? 0,
    shape: {
      type: shapeTypeFromCode(source.shape?.type),
      width: source.shape?.width ?? 0,
      height: source.shape?.height ?? 0,
      points: [...(source.shape?.points ?? [])]
    },
    elevation: source.elevation ?? 0,
    sort: source.sort ?? 0,
    rotation: source.rotation ?? 0,
    bezierFactor: source.bezierFactor ?? 0,
    fill: {
      type: fillTypeFromCode(source.fillType),
      color: source.fillColor ?? DEFAULT_COLOR,
      alpha: source.fillAlpha ?? 0.5,
      texture: blankAsNull(source.texture)
    },
    stroke: {
      width: source.strokeWidth ?? 8,
      color: source.strokeColor ?? DEFAULT_COLOR,
      alpha: source.strokeAlpha ?? 1
    },
    text: {
      content: blankAsNull(source.text),
      fontFamily: blankAsNull(source.fontFamily),
      fontSize: source.fontSize ?? 48,
      color: source.textColor ?? DEFAULT_COLOR,
      alpha: source.textAlpha ?? 1
    },
    hidden: source.hidden ?? false,
    locked: source.locked ?? false,
    interface: source.interface ?? false
  };
  if (generation < GENERATION_WITH_NAMES_AND_LEVELS) {
    return drawing;
  }
  return { ...drawing, name: blankAsNull(source.name), levels: [...(source.levels ?? [])] };
}

function assignDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

/**
 * Only the attributes that are set become document fields, so an update stays
 * partial. A shape arrives complete (the service plans it) and is written whole.
 * Clearing the text writes `''`, which the core's visibility rule reads as no
 * text; `fontFamily: null` makes Foundry 13 fall back to its default font and
 * Foundry 14 store `''` (the default).
 */
export function toFoundryDrawingData(changes: DrawingChanges | DrawingDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if ('authorId' in changes) {
    assignDefined(data, 'author', changes.authorId);
  }
  assignDefined(data, 'name', changes.name);
  assignDefined(data, 'x', changes.x);
  assignDefined(data, 'y', changes.y);
  assignDefined(data, 'elevation', changes.elevation);
  assignDefined(data, 'sort', changes.sort);
  assignDefined(data, 'rotation', changes.rotation);
  assignDefined(data, 'bezierFactor', changes.bezierFactor);
  assignDefined(data, 'hidden', changes.hidden);
  assignDefined(data, 'locked', changes.locked);
  assignDefined(data, 'interface', changes.interface);
  assignDefined(data, 'levels', changes.levels !== undefined ? [...changes.levels] : undefined);

  const shape = changes.shape;
  if (shape?.type !== undefined) {
    data['shape'] = {
      type: shapeTypeToCode(shape.type),
      width: shape.width,
      height: shape.height,
      points: [...(shape.points ?? [])]
    };
  }

  const fill = changes.fill;
  assignDefined(data, 'fillType', fill?.type !== undefined ? fillTypeToCode(fill.type) : undefined);
  assignDefined(data, 'fillColor', fill?.color);
  assignDefined(data, 'fillAlpha', fill?.alpha);
  assignDefined(data, 'texture', fill?.texture);

  const stroke = changes.stroke;
  assignDefined(data, 'strokeWidth', stroke?.width);
  assignDefined(data, 'strokeColor', stroke?.color);
  assignDefined(data, 'strokeAlpha', stroke?.alpha);

  const text = changes.text;
  assignDefined(data, 'text', text?.content === null ? '' : text?.content);
  assignDefined(data, 'fontFamily', text?.fontFamily);
  assignDefined(data, 'fontSize', text?.fontSize);
  assignDefined(data, 'textColor', text?.color);
  assignDefined(data, 'textAlpha', text?.alpha);

  return data;
}
