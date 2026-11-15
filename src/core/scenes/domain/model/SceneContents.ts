import type { ActorVitals } from '@/core/shared/domain';

// The read model behind `get-scene`. Wall restrictions, door type and state,
// the grid type and token disposition are the core's own numeric codes, passed
// through as the scene stores them: that command has always reported them raw.

export interface SceneContentsGrid {
  /** Pixels per cell. */
  readonly size: number;
  readonly typeCode: number;
  readonly units: string;
  readonly distance: number;
}

export interface SceneNote {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  /** What the pin shows: its own text, else the name of the journal entry it links to. */
  readonly label: string;
  readonly entryId: string | null;
}

export interface SceneWall {
  readonly id: string;
  readonly coordinates: readonly number[];
  readonly movement: number;
  readonly sight: number;
  readonly door: number;
  readonly doorState: number;
}

export interface SceneLight {
  readonly x: number;
  readonly y: number;
  readonly bright: number;
  readonly dim: number;
  readonly color: string | null;
  readonly angle: number;
  /** Whether walls stop the light. */
  readonly walls: boolean;
  readonly hidden: boolean;
}

export interface SceneTile {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly textureSrc: string;
  readonly hidden: boolean;
  readonly elevation: number;
  readonly rotation: number;
}

export interface SceneDrawingShape {
  readonly type: string;
  readonly width: number;
  readonly height: number;
  readonly points: readonly number[];
}

export interface SceneDrawing {
  readonly x: number;
  readonly y: number;
  readonly shape: SceneDrawingShape;
  readonly text: string;
  readonly hidden: boolean;
  readonly fillColor: string | null;
  readonly strokeColor: string | null;
}

export interface SceneRegion {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
  readonly shapeTypes: readonly string[];
}

export interface SceneToken {
  readonly id: string;
  readonly name: string;
  readonly actorId: string | null;
  readonly x: number;
  readonly y: number;
  /** Size in grid cells. */
  readonly width: number;
  readonly height: number;
  readonly elevation: number;
  readonly hidden: boolean;
  readonly disposition: number;
  readonly statuses: readonly string[];
  readonly vitals: ActorVitals;
}

export interface SceneContents {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly image: string;
  readonly width: number;
  readonly height: number;
  readonly grid: SceneContentsGrid;
  /** From 0 (daylight) to 1 (full darkness). */
  readonly darkness: number;
  readonly notes: readonly SceneNote[];
  readonly walls: readonly SceneWall[];
  readonly lights: readonly SceneLight[];
  readonly tiles: readonly SceneTile[];
  readonly drawings: readonly SceneDrawing[];
  readonly regions: readonly SceneRegion[];
  readonly tokens: readonly SceneToken[];
}

export interface GridCell {
  readonly column: number;
  readonly row: number;
}

const FALLBACK_CELL_SIZE = 100;

/** The grid cell a pixel position falls in. A cell size that is not positive counts as 100 px. */
export function gridCellAt(x: number, y: number, cellSize: number): GridCell {
  const size = cellSize > 0 ? cellSize : FALLBACK_CELL_SIZE;
  return { column: Math.floor(x / size), row: Math.floor(y / size) };
}
