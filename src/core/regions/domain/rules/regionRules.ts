import { ValidationError } from '@/kernel';
import { CoreFeatureUnavailableError } from '@/core/shared/domain';
import type { RegionChanges, RegionElevation, RegionElevationChanges } from '@/core/regions/domain/model/Region';
import type { RegionShape } from '@/core/regions/domain/model/RegionShape';
import type { RegionFeatures } from '@/core/regions/domain/ports/ports';

const EXTENDED_ATTRIBUTES = [
  'levelIds',
  'restriction',
  'attachedTokenId',
  'highlightMode',
  'displayMeasurements',
  'hidden'
] as const satisfies readonly (keyof RegionChanges)[];

/** Shape options the Foundry 14 model added to the shape types older cores already had. */
function extendedShapeOptions(shape: RegionShape): string[] {
  const options: string[] = [];
  if (shape.type === 'rectangle') {
    if (shape.anchorX !== undefined) options.push('anchorX');
    if (shape.anchorY !== undefined) options.push('anchorY');
  }
  if ((shape.type === 'rectangle' || shape.type === 'circle' || shape.type === 'ellipse') && shape.gridBased !== undefined) {
    options.push('gridBased');
  }
  if (shape.type === 'polygon' && shape.origin !== undefined) {
    options.push('origin');
  }
  return options;
}

function shapeTypesOf(shapes: readonly RegionShape[]): string[] {
  return shapes.flatMap((shape) => (shape.type === 'emanation' ? [shape.type, shape.base.type] : [shape.type]));
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/** Refuses what the running Foundry generation's region model cannot store, instead of letting the core drop it. */
export function assertRegionChangesSupported(features: RegionFeatures, changes: RegionChanges): void {
  if (changes.shapes !== undefined) {
    const missing = unique(shapeTypesOf(changes.shapes)).filter(
      (type) => !(features.shapeTypes as readonly string[]).includes(type)
    );
    if (missing.length > 0) {
      const subject = missing.length === 1 ? 'shape type' : 'shape types';
      const verb = missing.length === 1 ? 'requires' : 'require';
      throw new CoreFeatureUnavailableError(`Region ${subject} ${missing.join(', ')} ${verb} Foundry 14 or newer`);
    }
  }

  if (changes.visibility !== undefined && !features.visibilities.includes(changes.visibility)) {
    throw new CoreFeatureUnavailableError(`Region visibility '${changes.visibility}' requires Foundry 14 or newer`);
  }

  if (features.extendedModel) {
    return;
  }

  const fields: string[] = EXTENDED_ATTRIBUTES.filter((field) => changes[field] !== undefined);
  if (changes.elevation?.topInclusive !== undefined) {
    fields.push('elevation.topInclusive');
  }
  fields.push(...unique((changes.shapes ?? []).flatMap(extendedShapeOptions)).map((option) => `shape ${option}`));
  if (fields.length > 0) {
    const verb = fields.length === 1 ? 'requires' : 'require';
    throw new CoreFeatureUnavailableError(`Region ${fields.join(', ')} ${verb} Foundry 14 or newer`);
  }
}

export function mergeElevation(current: RegionElevation, changes: RegionElevationChanges): RegionElevation {
  return {
    bottom: changes.bottom !== undefined ? changes.bottom : current.bottom,
    top: changes.top !== undefined ? changes.top : current.top
  };
}

/**
 * The core checks the order on create, but Foundry 13 lets a partial update store
 * a bottom above the top; the merged range is therefore checked here.
 */
export function assertElevationOrder(elevation: RegionElevationChanges): void {
  const bottom = elevation.bottom ?? -Infinity;
  const top = elevation.top ?? Infinity;
  if (bottom > top) {
    throw new ValidationError('elevation.top may not be less than elevation.bottom');
  }
}
