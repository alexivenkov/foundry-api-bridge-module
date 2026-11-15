import { NoActiveSceneError } from '@/core/shared';

/**
 * Token and door commands have always answered `No active scene`, without the
 * hint the domain wording carries. The text is part of their wire contract.
 */
export function withShortNoActiveScene(error: unknown): unknown {
  return error instanceof NoActiveSceneError ? new Error('No active scene') : error;
}

/**
 * Write results (and `get-actor-items`, effects) have always carried an image as
 * stored — `null` once it was cleared — although the wire type promises a
 * string. Read results turn a missing image into an empty string instead.
 */
export function storedImage(img: string | null): string {
  return img as string;
}

/** The read-only commands have always rejected with an Error object, whatever was thrown. */
export function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
