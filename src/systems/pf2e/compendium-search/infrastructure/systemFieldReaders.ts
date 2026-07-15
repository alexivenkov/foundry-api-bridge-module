// Tolerant readers over pf2e `system` data: any missing or wrongly-shaped
// field degrades to null/[] so a schema drift never crashes a search.

export function valueAt(source: Record<string, unknown>, path: readonly string[]): unknown {
  let current: unknown = source;
  for (const segment of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function finiteNumberAt(
  source: Record<string, unknown>,
  path: readonly string[]
): number | null {
  const value = valueAt(source, path);
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function stringAt(
  source: Record<string, unknown>,
  path: readonly string[]
): string | null {
  const value = valueAt(source, path);
  return typeof value === 'string' && value !== '' ? value : null;
}

export function stringArrayAt(
  source: Record<string, unknown>,
  path: readonly string[]
): readonly string[] {
  const value = valueAt(source, path);
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
}
