/**
 * A setting value as plain JSON. `JSON.stringify` already applies the value's
 * own `toJSON` (a DataModel gives its source, a `Color` its CSS string); a Set
 * and a Map, which have none, become an array and an object. Throws when the
 * value cannot be written as JSON at all (a cycle, a BigInt).
 */
export function toPlainJson(value: unknown): unknown {
  const text = JSON.stringify(value, (_key, inner: unknown) => {
    if (inner instanceof Set) {
      return Array.from(inner as Set<unknown>);
    }
    if (inner instanceof Map) {
      return Object.fromEntries(inner as Map<string, unknown>);
    }
    return inner;
  }) as string | undefined;
  return text === undefined ? null : (JSON.parse(text) as unknown);
}

/** For metadata that must never fail a listing. */
export function toPlainJsonOrNull(value: unknown): unknown {
  try {
    return toPlainJson(value);
  } catch {
    return null;
  }
}
