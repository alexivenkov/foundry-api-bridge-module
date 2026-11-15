/** A move of the GM's view. An omitted coordinate or scale keeps its current value. */
export interface CanvasPan {
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly scale?: number | undefined;
  /** Milliseconds the animation takes. */
  readonly duration?: number | undefined;
}

/** A ping on the viewed scene, shown to every client that views it. */
export interface CanvasPing {
  readonly x: number;
  readonly y: number;
  /** Any style the canvas knows, including those other modules register; an unknown one is drawn as a pulse. */
  readonly style?: string | undefined;
  readonly color?: string | undefined;
  readonly duration?: number | undefined;
}
