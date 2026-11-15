/**
 * `ui.notifications`. `success` is absent from cores older than 13. From 13
 * (`Notifications`, 13.351 and 14.368) every method answers the Notification
 * with a numeric `id`, and `update` / `has` / `remove` take that id.
 */
export interface FoundryNotifications {
  info(message: string, options?: object): unknown;
  warn(message: string, options?: object): unknown;
  error(message: string, options?: object): unknown;
  success?(message: string, options?: object): unknown;
  update?(notification: number, update: { message?: string; pct?: number }): void;
  has?(notification: number): boolean;
  remove?(notification: number): void;
}

export interface FoundryUi {
  notifications: FoundryNotifications;
}

/** The two `Canvas` methods the context calls. */
export interface FoundryViewCanvas {
  animatePan(view: object): Promise<unknown>;
  ping(origin: { x: number; y: number }, options?: object): Promise<unknown>;
}

/** `GridMeasurePathResult` of `BaseGrid#measurePath` (common/grid, Foundry 12+). */
export interface FoundryGridMeasurement {
  distance: number;
  cost: number;
  spaces: number;
  diagonals: number;
  euclidean: number;
}

export interface FoundryGridPathResult extends FoundryGridMeasurement {
  segments: FoundryGridMeasurement[];
}

/**
 * The grid instance a client Scene builds in `prepareBaseData` (`Scene#grid`:
 * GridlessGrid, SquareGrid or HexagonalGrid). `diagonals` comes from the
 * world setting `core.gridDiagonals`; gridless grids have none.
 */
export interface FoundrySceneGrid {
  type: number;
  units: string;
  diagonals?: number | undefined;
  measurePath(waypoints: object[], options?: object): FoundryGridPathResult;
  getSnappedPoint(point: { x: number; y: number }, behavior: { mode: number; resolution?: number }): {
    x: number;
    y: number;
  };
}

export interface FoundryGridScene {
  id: string;
  name?: string;
  grid?: FoundrySceneGrid | object | null | undefined;
}

export interface FoundryGridGame {
  scenes: {
    get(id: string): FoundryGridScene | undefined;
    active: FoundryGridScene | null | undefined;
  };
}

/** What `get-canvas-view` and `show-scrolling-text` read of `canvas` (Foundry 13.351 / 14.368). */
export interface FoundryStageCanvas {
  ready: boolean;
  scene: { id: string; name?: string | null | undefined } | null;
  /** Foundry 14+: the viewed Level document. */
  level?: { id: string } | null | undefined;
  stage: { pivot: { x: number; y: number }; scale: { x: number } };
  screenDimensions?: readonly number[] | undefined;
  /** `CanvasInterfaceGroup#createScrollingText`: resolves once the animation has ended. */
  interface?: {
    createScrollingText(origin: { x: number; y: number }, content: string, options?: object): Promise<unknown>;
  } | null;
}

export interface FoundryStageGlobals {
  canvas?: FoundryStageCanvas | null | undefined;
  game?: { settings?: { get(namespace: string, key: string): unknown } | undefined } | undefined;
}
