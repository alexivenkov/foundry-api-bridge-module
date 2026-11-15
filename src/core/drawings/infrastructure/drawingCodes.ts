import type { DrawingFillType, DrawingShapeType } from '@/core/drawings/domain';

// `ShapeData.TYPES` and CONST.DRAWING_FILL_TYPES, identical in Foundry 13.351
// and 14.368. The circle (`c`) is valid data but neither canvas draws it (14
// throws), so it reads as an unknown shape and cannot be written.

const SHAPE_CODE: Readonly<Record<DrawingShapeType, string>> = { rectangle: 'r', ellipse: 'e', polygon: 'p' };
const SHAPE_BY_CODE: Readonly<Record<string, DrawingShapeType>> = { r: 'rectangle', e: 'ellipse', p: 'polygon' };

const FILL_CODE: Readonly<Record<DrawingFillType, number>> = { none: 0, solid: 1, pattern: 2 };
const FILL_BY_CODE: Readonly<Record<number, DrawingFillType>> = { 0: 'none', 1: 'solid', 2: 'pattern' };

export function shapeTypeToCode(type: DrawingShapeType): string {
  return SHAPE_CODE[type];
}

export function shapeTypeFromCode(code: string | undefined): DrawingShapeType | null {
  return code !== undefined ? (SHAPE_BY_CODE[code] ?? null) : null;
}

export function fillTypeToCode(type: DrawingFillType): number {
  return FILL_CODE[type];
}

export function fillTypeFromCode(code: number | undefined): DrawingFillType {
  return FILL_BY_CODE[code ?? FILL_CODE.none] ?? 'none';
}
