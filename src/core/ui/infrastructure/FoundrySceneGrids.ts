import { foundryGeneration } from '@/compat/foundryVersion';
import {
  CoreFeatureUnavailableError,
  SceneNotFoundError,
  findFoundryScene,
  type GameProvider
} from '@/core/shared';
import {
  GRID_MEASUREMENT_UNAVAILABLE,
  type GridMeasurement,
  type GridPathMeasurement,
  type GridSnapping,
  type GridWaypoint,
  type SceneGrid,
  type SceneGrids,
  type ScenePoint
} from '@/core/ui/domain';
import type { FoundryGridGame, FoundryGridMeasurement, FoundrySceneGrid } from './foundryUiTypes';
import { GRIDLESS_CODE, diagonalRuleFromCode, gridTypeFromCode, snappingModeMask } from './gridCodes';

export type GridGameProvider = GameProvider<FoundryGridGame>;

// `BaseGrid#measurePath` and `#getSnappedPoint` came with the grid classes of
// Foundry 12; elevated (3D) waypoints with Foundry 13. Read in 13.351 and
// 14.368 and run there under Node; 12 was not at hand.
const MEASUREMENT_MIN_GENERATION = 12;
const ELEVATION_MIN_GENERATION = 13;

function isSceneGrid(grid: unknown): grid is FoundrySceneGrid {
  return (
    typeof grid === 'object' &&
    grid !== null &&
    typeof (grid as { measurePath?: unknown }).measurePath === 'function' &&
    typeof (grid as { getSnappedPoint?: unknown }).getSnappedPoint === 'function'
  );
}

function toMeasurement(measurement: FoundryGridMeasurement): GridMeasurement {
  return {
    distance: measurement.distance,
    cost: measurement.cost,
    spaces: measurement.spaces,
    diagonals: measurement.diagonals,
    euclidean: measurement.euclidean
  };
}

/** Only what is set becomes a key: the core reads a key that is present, even undefined, as given. */
function toFoundryWaypoint(waypoint: GridWaypoint): Record<string, unknown> {
  const data: Record<string, unknown> = { x: waypoint.x, y: waypoint.y };
  if (waypoint.elevation !== undefined) {
    data['elevation'] = waypoint.elevation;
  }
  if (waypoint.teleport !== undefined) {
    data['teleport'] = waypoint.teleport;
  }
  return data;
}

/** Anti-corruption layer over the grid instance of a scene document (`Scene#grid`). */
export class FoundrySceneGrids implements SceneGrids {
  constructor(
    private readonly gameProvider: GridGameProvider,
    private readonly generation: () => number = foundryGeneration
  ) {}

  supportsMeasurement(): boolean {
    return this.generation() >= MEASUREMENT_MIN_GENERATION;
  }

  supportsElevation(): boolean {
    return this.generation() >= ELEVATION_MIN_GENERATION;
  }

  describe(sceneId: string): SceneGrid | null {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      return null;
    }
    const grid = this.requireGrid(sceneId);
    return {
      type: gridTypeFromCode(grid.type),
      units: grid.units,
      diagonalRule: grid.type === GRIDLESS_CODE ? null : diagonalRuleFromCode(grid.diagonals)
    };
  }

  measurePath(sceneId: string, waypoints: readonly GridWaypoint[]): GridPathMeasurement {
    const result = this.requireGrid(sceneId).measurePath(waypoints.map(toFoundryWaypoint));
    return { ...toMeasurement(result), segments: result.segments.map(toMeasurement) };
  }

  snapPoint(sceneId: string, point: ScenePoint, snapping: GridSnapping): ScenePoint {
    const snapped = this.requireGrid(sceneId).getSnappedPoint(
      { x: point.x, y: point.y },
      { mode: snappingModeMask(snapping.modes), resolution: snapping.resolution }
    );
    return { x: snapped.x, y: snapped.y };
  }

  private requireGrid(sceneId: string): FoundrySceneGrid {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    if (!isSceneGrid(scene.grid)) {
      throw new CoreFeatureUnavailableError(GRID_MEASUREMENT_UNAVAILABLE);
    }
    return scene.grid;
  }
}
