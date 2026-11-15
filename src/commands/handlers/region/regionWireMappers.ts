import type {
  RegionBase,
  RegionBehaviorConfig as WireBehaviorConfig,
  RegionBehaviorDetail,
  RegionBehaviorResult as WireBehaviorResult,
  RegionBehaviorSummary,
  RegionEmanationBaseShape,
  RegionPoint as WirePoint,
  RegionResult as WireRegionResult,
  RegionShape as WireShape,
  RegionSummary
} from '@/commands/types';
import type {
  Region,
  RegionBehavior,
  RegionBehaviorConfig,
  RegionBehaviorResult,
  RegionPoint,
  RegionResult,
  RegionShape
} from '@/core/regions';

/** `{ key: value }` when the value is set, `{}` otherwise: keeps fields a core does not have out of the result. */
function optional<K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
}

function toWirePoint(point: RegionPoint): WirePoint {
  return { x: point.x, y: point.y };
}

function toWireOrigin(origin: RegionPoint | null | undefined): WirePoint | null | undefined {
  return origin === undefined || origin === null ? origin : toWirePoint(origin);
}

export function toWireShape(shape: RegionShape): WireShape {
  const hole = shape.hole ?? false;
  switch (shape.type) {
    case 'rectangle':
      return {
        type: shape.type,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation ?? 0,
        hole,
        ...optional('anchorX', shape.anchorX),
        ...optional('anchorY', shape.anchorY),
        ...optional('gridBased', shape.gridBased)
      };
    case 'circle':
      return { type: shape.type, x: shape.x, y: shape.y, radius: shape.radius, hole, ...optional('gridBased', shape.gridBased) };
    case 'ellipse':
      return {
        type: shape.type,
        x: shape.x,
        y: shape.y,
        radiusX: shape.radiusX,
        radiusY: shape.radiusY,
        rotation: shape.rotation ?? 0,
        hole,
        ...optional('gridBased', shape.gridBased)
      };
    case 'polygon':
      return {
        type: shape.type,
        points: shape.points.map(toWirePoint),
        hole,
        ...optional('origin', toWireOrigin(shape.origin))
      };
    case 'cone':
      return {
        type: shape.type,
        x: shape.x,
        y: shape.y,
        radius: shape.radius,
        angle: shape.angle,
        rotation: shape.rotation ?? 0,
        curvature: shape.curvature ?? 'round',
        hole,
        gridBased: shape.gridBased ?? false
      };
    case 'ring':
      return {
        type: shape.type,
        x: shape.x,
        y: shape.y,
        radius: shape.radius,
        innerWidth: shape.innerWidth,
        outerWidth: shape.outerWidth,
        hole,
        gridBased: shape.gridBased ?? false
      };
    case 'line':
      return {
        type: shape.type,
        x: shape.x,
        y: shape.y,
        length: shape.length,
        width: shape.width,
        rotation: shape.rotation ?? 0,
        hole,
        gridBased: shape.gridBased ?? false
      };
    case 'token':
      return { type: shape.type, x: shape.x, y: shape.y, width: shape.width, height: shape.height, shape: shape.shape, hole };
    case 'grid':
      return {
        type: shape.type,
        cells: shape.cells.map((cell) => ({ row: cell.row, column: cell.column })),
        origin: toWireOrigin(shape.origin) ?? null,
        hole
      };
    case 'emanation':
      return {
        type: shape.type,
        base: toWireShape(shape.base) as RegionEmanationBaseShape,
        radius: shape.radius,
        hole,
        gridBased: shape.gridBased ?? false
      };
  }
}

function clonePlain(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(clonePlain);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, clonePlain(entry)]));
  }
  return value;
}

export function toWireBehaviorConfig(config: RegionBehaviorConfig): WireBehaviorConfig {
  const source = config.kind === 'opaque' ? config.data : config.settings;
  return clonePlain(source) as WireBehaviorConfig;
}

function toWireBehaviorSummary(behavior: RegionBehavior): RegionBehaviorSummary {
  return { id: behavior.id, name: behavior.name, type: behavior.type, disabled: behavior.disabled };
}

function toWireBehaviorDetail(behavior: RegionBehavior): RegionBehaviorDetail {
  return { ...toWireBehaviorSummary(behavior), config: toWireBehaviorConfig(behavior.config) };
}

function toWireRegionBase(region: Region): RegionBase {
  return {
    id: region.id,
    name: region.name,
    color: region.color,
    shapes: region.shapes.map(toWireShape),
    elevation: {
      bottom: region.elevation.bottom,
      top: region.elevation.top,
      ...optional('topInclusive', region.elevation.topInclusive)
    },
    visibility: region.visibility,
    locked: region.locked,
    ...optional('levelIds', region.levelIds !== undefined ? [...region.levelIds] : undefined),
    ...optional('restriction', region.restriction !== undefined ? { ...region.restriction } : undefined),
    ...optional('attachedTokenId', region.attachedTokenId),
    ...optional('highlightMode', region.highlightMode),
    ...optional('displayMeasurements', region.displayMeasurements),
    ...optional('hidden', region.hidden)
  };
}

export function toWireRegionSummary(region: Region): RegionSummary {
  return { ...toWireRegionBase(region), behaviors: region.behaviors.map(toWireBehaviorSummary) };
}

export function toWireRegionResult(result: RegionResult): WireRegionResult {
  return {
    ...toWireRegionBase(result.region),
    behaviors: result.region.behaviors.map(toWireBehaviorDetail),
    sceneId: result.sceneId
  };
}

export function toWireBehaviorResult(result: RegionBehaviorResult): WireBehaviorResult {
  return { ...toWireBehaviorDetail(result.behavior), sceneId: result.sceneId, regionId: result.regionId };
}
