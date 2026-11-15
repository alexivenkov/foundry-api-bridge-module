import {
  REGION_HIGHLIGHT_MODES,
  REGION_RESTRICTION_TYPES,
  type Region,
  type RegionBehavior,
  type RegionChanges,
  type RegionExtensions,
  type RegionHighlightMode,
  type RegionRestrictionType
} from '@/core/regions/domain';
import type { FoundryRegionSource } from './foundryRegionTypes';
import { visibilityFromCode, visibilityToCode } from './regionCodes';
import { fromFoundryShapes, toFoundryShape } from './shapeMapper';

function restrictionType(value: string): RegionRestrictionType {
  return (REGION_RESTRICTION_TYPES as readonly string[]).includes(value) ? (value as RegionRestrictionType) : 'move';
}

function highlightMode(value: string): RegionHighlightMode {
  return (REGION_HIGHLIGHT_MODES as readonly string[]).includes(value) ? (value as RegionHighlightMode) : 'shapes';
}

/** The Foundry 14 attributes, each only when the stored data has it. */
function extensions(source: FoundryRegionSource): RegionExtensions {
  return {
    ...(source.levels !== undefined ? { levelIds: [...source.levels] } : {}),
    ...(source.restriction !== undefined
      ? {
          restriction: {
            enabled: source.restriction.enabled,
            type: restrictionType(source.restriction.type),
            priority: source.restriction.priority
          }
        }
      : {}),
    ...(source.attachment !== undefined ? { attachedTokenId: source.attachment.token ?? null } : {}),
    ...(source.highlightMode !== undefined ? { highlightMode: highlightMode(source.highlightMode) } : {}),
    ...(source.displayMeasurements !== undefined ? { displayMeasurements: source.displayMeasurements } : {}),
    ...(source.hidden !== undefined ? { hidden: source.hidden } : {})
  };
}

export function toRegion(source: FoundryRegionSource, behaviors: readonly RegionBehavior[]): Region {
  return {
    id: source._id,
    name: source.name,
    color: source.color,
    shapes: fromFoundryShapes(source.shapes),
    elevation: {
      bottom: source.elevation.bottom ?? null,
      top: source.elevation.top ?? null,
      ...(source.elevation.topInclusive !== undefined ? { topInclusive: source.elevation.topInclusive } : {})
    },
    visibility: visibilityFromCode(source.visibility),
    locked: source.locked,
    ...extensions(source),
    behaviors
  };
}

function definedEntries(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

/** Only the attributes that are set become document fields, so an update stays partial (shapes are replaced whole). */
export function toFoundryRegionData(changes: RegionChanges): Record<string, unknown> {
  const data = definedEntries({
    name: changes.name,
    color: changes.color,
    shapes: changes.shapes?.map(toFoundryShape),
    visibility: changes.visibility !== undefined ? visibilityToCode(changes.visibility) : undefined,
    locked: changes.locked,
    levels: changes.levelIds !== undefined ? [...changes.levelIds] : undefined,
    highlightMode: changes.highlightMode,
    displayMeasurements: changes.displayMeasurements,
    hidden: changes.hidden
  });

  if (changes.elevation !== undefined) {
    const elevation = definedEntries({ ...changes.elevation });
    if (Object.keys(elevation).length > 0) {
      data['elevation'] = elevation;
    }
  }
  if (changes.restriction !== undefined) {
    const restriction = definedEntries({ ...changes.restriction });
    if (Object.keys(restriction).length > 0) {
      data['restriction'] = restriction;
    }
  }
  if (changes.attachedTokenId !== undefined) {
    data['attachment'] = { token: changes.attachedTokenId };
  }

  return data;
}
