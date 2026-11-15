import type { MeasuredTemplateType } from '@/core/templates/domain/model/MeasuredTemplate';

/** What the core's template tools give a new cone and a new ray. */
export interface TemplateToolDefaults {
  /** Degrees. */
  readonly coneAngle: number;
  /** Distance units. */
  readonly rayWidth: number;
}

export interface TemplateShapeState {
  readonly type: MeasuredTemplateType;
  readonly angle: number;
  readonly width: number;
}

/**
 * A cone without an opening angle and a ray without a width cover nothing:
 * they get what the core's template tools would give them.
 */
export function completeTemplateShape(
  state: TemplateShapeState,
  defaults: TemplateToolDefaults
): { readonly angle?: number; readonly width?: number } {
  if (state.type === 'cone' && state.angle <= 0) {
    return { angle: defaults.coneAngle };
  }
  if (state.type === 'ray' && state.width <= 0) {
    return { width: defaults.rayWidth };
  }
  return {};
}
