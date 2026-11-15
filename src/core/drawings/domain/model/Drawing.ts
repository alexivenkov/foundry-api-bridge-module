/** A freehand line is a polygon with a bezier factor above 0: that is how the core's freehand tool stores it. */
export const DRAWING_SHAPE_TYPES = ['rectangle', 'ellipse', 'polygon'] as const;
export type DrawingShapeType = (typeof DRAWING_SHAPE_TYPES)[number];

export const DRAWING_FILL_TYPES = ['none', 'solid', 'pattern'] as const;
export type DrawingFillType = (typeof DRAWING_FILL_TYPES)[number];

export interface DrawingShape {
  /** null for a shape type the canvas does not draw (a circle written by other tools). */
  readonly type: DrawingShapeType | null;
  readonly width: number;
  readonly height: number;
  /** Flat polygon vertices relative to the drawing's position; empty for other shapes. */
  readonly points: readonly number[];
}

export interface DrawingFill {
  readonly type: DrawingFillType;
  readonly color: string;
  readonly alpha: number;
  readonly texture: string | null;
}

export interface DrawingStroke {
  readonly width: number;
  readonly color: string;
  readonly alpha: number;
}

export interface DrawingText {
  readonly content: string | null;
  /** null = the core's default font. */
  readonly fontFamily: string | null;
  readonly fontSize: number;
  readonly color: string;
  readonly alpha: number;
}

export interface Drawing {
  readonly id: string;
  /** Foundry 14+ only. */
  readonly name?: string | null;
  readonly authorId: string | null;
  readonly x: number;
  readonly y: number;
  readonly shape: DrawingShape;
  readonly elevation: number;
  readonly sort: number;
  readonly rotation: number;
  readonly bezierFactor: number;
  readonly fill: DrawingFill;
  readonly stroke: DrawingStroke;
  readonly text: DrawingText;
  readonly hidden: boolean;
  readonly locked: boolean;
  readonly interface: boolean;
  /** Foundry 14+ only. */
  readonly levels?: readonly string[];
}

export interface DrawingShapeChanges {
  readonly type?: DrawingShapeType | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly points?: readonly number[] | undefined;
}

/**
 * What a caller may set. An omitted attribute is left to the core default
 * (create) or kept (update); nested groups are partial; `null` removes the
 * pattern image, the text or the name, and returns to the default font.
 */
export interface DrawingChanges {
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly shape?: DrawingShapeChanges | undefined;
  readonly elevation?: number | undefined;
  readonly sort?: number | undefined;
  readonly rotation?: number | undefined;
  readonly bezierFactor?: number | undefined;
  readonly fill?:
    | {
        readonly type?: DrawingFillType | undefined;
        readonly color?: string | undefined;
        readonly alpha?: number | undefined;
        readonly texture?: string | null | undefined;
      }
    | undefined;
  readonly stroke?:
    | {
        readonly width?: number | undefined;
        readonly color?: string | undefined;
        readonly alpha?: number | undefined;
      }
    | undefined;
  readonly text?:
    | {
        readonly content?: string | null | undefined;
        readonly fontFamily?: string | null | undefined;
        readonly fontSize?: number | undefined;
        readonly color?: string | undefined;
        readonly alpha?: number | undefined;
      }
    | undefined;
  readonly hidden?: boolean | undefined;
  readonly locked?: boolean | undefined;
  readonly interface?: boolean | undefined;
  readonly name?: string | null | undefined;
  readonly levels?: readonly string[] | undefined;
}

export interface DrawingDraft extends DrawingChanges {
  readonly x: number;
  readonly y: number;
  readonly shape: DrawingShapeChanges & { readonly type: DrawingShapeType };
  /** Absent: the core makes the current user the author. */
  readonly authorId?: string | undefined;
}
