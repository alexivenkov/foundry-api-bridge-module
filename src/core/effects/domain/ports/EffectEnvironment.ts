/** What the running Foundry generation stores on an ActiveEffect. */
export interface EffectFeatures {
  /** `type` and `system` (Foundry 12+). */
  readonly subtypes: boolean;
  /** A duration as one `value` in `units`, with an expiry event (Foundry 14+). */
  readonly durationUnits: boolean;
  /** Per-change application phases (Foundry 14+). */
  readonly changePhases: boolean;
  /** `showIcon` (Foundry 14+). */
  readonly iconVisibility: boolean;
}

/**
 * The registries an effect's ids are checked against. A registry that cannot
 * be read yields null, and nothing is checked against it.
 */
export interface EffectEnvironment {
  features(): EffectFeatures;
  effectTypes(): readonly string[] | null;
  changeTypes(): readonly string[] | null;
  changePhases(): readonly string[] | null;
  expiryEvents(): readonly string[] | null;
  /** Why the core refuses an origin; null when it accepts it. */
  originProblem(origin: string): string | null;
}
