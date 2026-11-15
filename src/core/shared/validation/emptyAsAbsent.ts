/**
 * Older commands test `sceneId` for truthiness, so an empty string or `null`
 * means "not given" and falls back to the active scene. Their request mappers
 * keep that reading.
 */
export function emptyAsAbsent(value: string | null | undefined): string | undefined {
  return value === '' || value === null ? undefined : value;
}
