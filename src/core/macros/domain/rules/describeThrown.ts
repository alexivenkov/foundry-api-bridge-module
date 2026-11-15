/** The text of whatever a macro, or its compiler, threw: scripts throw strings as readily as errors. */
export function describeThrown(thrown: unknown): string {
  return thrown instanceof Error ? thrown.message : String(thrown);
}
