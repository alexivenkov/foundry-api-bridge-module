import type { ScenePoint } from './Grid';

export interface CanvasRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The GM's own view of the canvas. */
export interface CanvasViewState {
  readonly sceneId: string;
  readonly sceneName: string;
  /** View center in scene pixels. */
  readonly center: ScenePoint;
  readonly scale: number;
  readonly visibleArea: CanvasRect;
  /** Present only on cores with scene levels (14+): the viewed level, null when none. */
  readonly levelId?: string | null | undefined;
}

export const SCROLLING_TEXT_ANCHORS = ['center', 'top', 'bottom', 'left', 'right'] as const;
export type ScrollingTextAnchor = (typeof SCROLLING_TEXT_ANCHORS)[number];

export interface ScrollingText {
  readonly origin: ScenePoint;
  readonly text: string;
  /** `#rrggbb`. */
  readonly color?: string | undefined;
  readonly fontSize?: number | undefined;
  readonly anchor?: ScrollingTextAnchor | undefined;
  readonly direction?: ScrollingTextAnchor | undefined;
  /** Milliseconds. */
  readonly duration?: number | undefined;
  readonly jitter?: number | undefined;
}
