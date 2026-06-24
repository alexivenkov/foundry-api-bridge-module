/**
 * Outbound port for token targeting. Clears existing targets and sets the
 * given ones; returns the number set. Throws when a token id is missing.
 */
export interface TargetingPort {
  setTargets(tokenIds: readonly string[]): number;
}
