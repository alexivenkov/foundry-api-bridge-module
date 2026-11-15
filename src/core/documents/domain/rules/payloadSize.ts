import { PayloadTooLargeError } from '@/core/documents/domain/errors/documentErrors';

/** UTF-8 size of the value written as JSON; an unserializable value (`undefined`) counts as zero. */
export function jsonByteLength(value: unknown): number {
  const text = JSON.stringify(value) as string | undefined;
  return text === undefined ? 0 : new TextEncoder().encode(text).length;
}

export function requireJsonSize(what: string, value: unknown, limit: number): void {
  const bytes = jsonByteLength(value);
  if (bytes > limit) {
    throw new PayloadTooLargeError(what, bytes, limit);
  }
}
