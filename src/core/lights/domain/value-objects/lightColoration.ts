/** The shader techniques a light blends with the scene, named after the core's `SHADER_TECHNIQUES` keys. */
export const LIGHT_COLORATIONS = [
  'legacy',
  'luminance',
  'internal-halo',
  'external-halo',
  'color-burn',
  'internal-burn',
  'external-burn',
  'low-absorption',
  'high-absorption',
  'invert-absorption',
  'natural-light',
  'natural-attenuation',
  'adaptive-attenuation'
] as const;

export type LightColoration = (typeof LIGHT_COLORATIONS)[number];

const ATTENUATION_COLORATIONS: readonly LightColoration[] = ['natural-attenuation', 'adaptive-attenuation'];

/** The techniques Foundry 14 added; older cores do not know them. */
export function isAttenuationColoration(coloration: LightColoration): boolean {
  return ATTENUATION_COLORATIONS.includes(coloration);
}
