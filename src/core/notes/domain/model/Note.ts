export const NOTE_TEXT_ANCHORS = ['center', 'bottom', 'top', 'left', 'right'] as const;
export type NoteTextAnchor = (typeof NOTE_TEXT_ANCHORS)[number];

/**
 * A map pin: a position, an optional journal link, an icon and a label.
 * `elevation`, `sort`, `fontFamily`, `locked` and `levels` are `undefined`
 * where the core does not store them (`locked` and `levels` before 14).
 */
export interface Note {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly entryId: string | null;
  readonly pageId: string | null;
  readonly text: string | null;
  readonly iconSrc: string;
  readonly iconTint: string | null;
  readonly iconSize: number;
  readonly fontSize: number;
  readonly textAnchor: NoteTextAnchor;
  readonly textColor: string | null;
  readonly global: boolean;
  readonly elevation?: number | undefined;
  readonly sort?: number | undefined;
  /** null = the core's default font. */
  readonly fontFamily?: string | null | undefined;
  readonly locked?: boolean | undefined;
  /** Empty = every level. */
  readonly levels?: readonly string[] | undefined;
}

/**
 * The attributes a caller may set. Omitted ones are left to the core default
 * (create) or untouched (update); `null` clears a link, the label or a color.
 */
export interface NoteChanges {
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly entryId?: string | null | undefined;
  readonly pageId?: string | null | undefined;
  readonly text?: string | null | undefined;
  readonly iconSrc?: string | undefined;
  readonly iconTint?: string | null | undefined;
  readonly iconSize?: number | undefined;
  readonly fontSize?: number | undefined;
  readonly textAnchor?: NoteTextAnchor | undefined;
  readonly textColor?: string | null | undefined;
  readonly global?: boolean | undefined;
  readonly elevation?: number | undefined;
  readonly sort?: number | undefined;
  /** null = the core's default font. */
  readonly fontFamily?: string | null | undefined;
  readonly locked?: boolean | undefined;
  /** Replaces the whole set. */
  readonly levels?: readonly string[] | undefined;
}

export interface NoteDraft extends NoteChanges {
  readonly x: number;
  readonly y: number;
}
