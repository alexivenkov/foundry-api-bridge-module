import { CoreFeatureUnavailableError, SceneNotFoundError, requireScene, type SceneLocator } from '@/core/shared';
import {
  GRID_MEASUREMENT_UNAVAILABLE,
  WAYPOINT_ELEVATION_UNAVAILABLE,
  type GridPathMeasurement,
  type SceneGrid,
  type SceneGrids,
  type ScenePoint
} from '@/core/ui/domain';
import type { MeasureGridPathCommand, SnapToGridCommand } from './commands';

export interface GridServiceDependencies {
  readonly scenes: SceneLocator;
  readonly grids: SceneGrids;
}

export interface GridPathResult {
  readonly sceneId: string;
  readonly grid: SceneGrid;
  readonly measurement: GridPathMeasurement;
}

export interface SnappedPoint {
  readonly sceneId: string;
  readonly point: ScenePoint;
}

/** Works on the scene document's grid, so the scene need not be the one drawn on the canvas. */
export class GridService {
  constructor(private readonly deps: GridServiceDependencies) {}

  measurePath(command: MeasureGridPathCommand): GridPathResult {
    this.requireMeasurement();
    if (command.waypoints.some((waypoint) => waypoint.elevation !== undefined) && !this.deps.grids.supportsElevation()) {
      throw new CoreFeatureUnavailableError(WAYPOINT_ELEVATION_UNAVAILABLE);
    }
    const { sceneId, grid } = this.requireGrid(command.sceneId);
    return { sceneId, grid, measurement: this.deps.grids.measurePath(sceneId, command.waypoints) };
  }

  snapToGrid(command: SnapToGridCommand): SnappedPoint {
    this.requireMeasurement();
    const { sceneId } = this.requireGrid(command.sceneId);
    return { sceneId, point: this.deps.grids.snapPoint(sceneId, command.point, command.snapping) };
  }

  private requireMeasurement(): void {
    if (!this.deps.grids.supportsMeasurement()) {
      throw new CoreFeatureUnavailableError(GRID_MEASUREMENT_UNAVAILABLE);
    }
  }

  private requireGrid(sceneId: string | undefined): { sceneId: string; grid: SceneGrid } {
    const scene = requireScene(this.deps.scenes, sceneId);
    const grid = this.deps.grids.describe(scene.id);
    if (grid === null) {
      throw new SceneNotFoundError(scene.id);
    }
    return { sceneId: scene.id, grid };
  }
}
