export * from './value-objects';
export * from './model';
export * from './errors';
export type {
  BehaviorConfigReader,
  RegionBehaviorCatalog,
  RegionBehaviorStore,
  RegionMacroResolver,
  RegionFeatures,
  RegionPointTest,
  RegionStore,
  ScriptBehaviorPolicy
} from './ports/ports';
export {
  assertElevationOrder,
  assertRegionChangesSupported,
  mergeElevation
} from './rules/regionRules';
export {
  assertBehaviorConfigSupported,
  assertBehaviorTypeRegistered,
  assertMacroTargetAllowed,
  assertScriptBehaviorAllowed,
  macroTargetToCheck
} from './rules/behaviorRules';
