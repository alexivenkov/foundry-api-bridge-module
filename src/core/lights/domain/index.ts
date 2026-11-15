export { LIGHT_COLORATIONS, isAttenuationColoration } from './value-objects/lightColoration';
export type { LightColoration } from './value-objects/lightColoration';
export { DEFAULT_DARKNESS_RANGE } from './model/Light';
export type {
  Light,
  LightAnimation,
  LightAnimationChanges,
  LightChanges,
  LightDarknessRange,
  LightDarknessRangeChanges,
  LightDraft,
  LightKind
} from './model/Light';
export {
  InvalidLightDarknessRangeError,
  LightCreationFailedError,
  LightNotFoundError,
  UnknownLightAnimationError,
  UnknownLightLevelError
} from './errors/lightErrors';
export type { LightEnvironment, LightFeatures, LightStore } from './ports/ports';
export {
  assertKnownAnimation,
  assertLightFeatures,
  assertSceneLevels,
  resolveDarknessRange
} from './rules/lightRules';
