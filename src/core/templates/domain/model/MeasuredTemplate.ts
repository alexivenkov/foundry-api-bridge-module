export const MEASURED_TEMPLATE_TYPES = ['circle', 'cone', 'rectangle', 'ray'] as const;
export type MeasuredTemplateType = (typeof MEASURED_TEMPLATE_TYPES)[number];

/** An area of effect on the scene, measured in the scene's distance units. */
export interface MeasuredTemplate {
  readonly id: string;
  readonly authorId: string | null;
  readonly type: MeasuredTemplateType;
  readonly x: number;
  readonly y: number;
  readonly elevation: number;
  readonly sort: number;
  readonly distance: number;
  readonly direction: number;
  readonly angle: number;
  readonly width: number;
  readonly borderColor: string;
  readonly fillColor: string;
  readonly texture: string | null;
  readonly hidden: boolean;
}

/** What a caller may set. An omitted attribute is left to the core default (create) or kept (update). */
export interface MeasuredTemplateChanges {
  readonly type?: MeasuredTemplateType | undefined;
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly elevation?: number | undefined;
  readonly sort?: number | undefined;
  readonly distance?: number | undefined;
  readonly direction?: number | undefined;
  readonly angle?: number | undefined;
  readonly width?: number | undefined;
  readonly borderColor?: string | undefined;
  readonly fillColor?: string | undefined;
  /** `null` removes the image. */
  readonly texture?: string | null | undefined;
  readonly hidden?: boolean | undefined;
}

export interface MeasuredTemplateDraft extends MeasuredTemplateChanges {
  readonly type: MeasuredTemplateType;
  readonly x: number;
  readonly y: number;
  readonly distance: number;
  /** Absent: the core makes the current user the author. */
  readonly authorId?: string | undefined;
}
