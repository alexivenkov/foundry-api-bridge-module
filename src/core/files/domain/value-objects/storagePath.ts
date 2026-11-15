import { InvalidStoragePathError } from '@/core/files/domain/errors/fileErrors';

export const FILE_SOURCES = ['data', 'public', 's3'] as const;
export type FileSource = (typeof FILE_SOURCES)[number];

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const WINDOWS_RESERVED = /[<>:"|?*]/;

/**
 * A `/`-separated path inside a storage source, kept as its decoded segments.
 * Callers may send the URL-encoded form the core reports (`My%20Maps`) or the
 * raw one (`My Maps`): each segment is decoded once.
 */
export class StoragePath {
  private constructor(readonly segments: readonly string[]) {}

  static readonly ROOT = new StoragePath([]);

  static parse(raw: string, field = 'path'): StoragePath {
    const segments = raw
      .split('/')
      .filter((segment, index, all) => segment !== '' || (index !== 0 && index !== all.length - 1));
    return new StoragePath(segments.map((segment) => decodeSegment(segment, raw, field)));
  }

  get isRoot(): boolean {
    return this.segments.length === 0;
  }

  get name(): string | null {
    return this.segments[this.segments.length - 1] ?? null;
  }

  parent(): StoragePath {
    return new StoragePath(this.segments.slice(0, -1));
  }

  child(name: string): StoragePath {
    return new StoragePath([...this.segments, name]);
  }

  /** The raw form, as the core's write operations take it. */
  toString(): string {
    return this.segments.join('/');
  }

  /** The URL-encoded form, as the core reports paths and decodes them when browsing (`encodeURL`). */
  toClientPath(): string {
    return this.segments.map(encodeSegment).join('/');
  }
}

/** The core's `encodeURL` for a relative path segment. */
export function encodeSegment(segment: string): string {
  return encodeURIComponent(segment).replace(/'/g, '%27');
}

/**
 * The decoded last segment of a path the core reported, or null when it is
 * not valid percent-encoding.
 */
export function decodedName(clientPath: string): string | null {
  const name = clientPath.split('/').pop() ?? '';
  try {
    return decodeURIComponent(name);
  } catch {
    return null;
  }
}

/**
 * The core decodes a write path inconsistently between generations (13 decodes
 * a new directory after its containment check), so a written path may not
 * carry a `%` once decoded, nor characters other platforms refuse.
 */
export function assertWritableSegments(path: StoragePath, field: string): void {
  for (const segment of path.segments) {
    if (segment.includes('%') || WINDOWS_RESERVED.test(segment) || /[. ]$/.test(segment)) {
      throw new InvalidStoragePathError(
        field,
        path.toString(),
        `segment '${segment}' may not contain % < > : " | ? * nor end with a dot or a space`
      );
    }
  }
}

function decodeSegment(segment: string, raw: string, field: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    throw new InvalidStoragePathError(field, raw, `segment '${segment}' is not valid percent-encoding`);
  }
  if (decoded === '') {
    throw new InvalidStoragePathError(field, raw, 'empty segment');
  }
  if (decoded === '.' || decoded === '..') {
    throw new InvalidStoragePathError(field, raw, `'${decoded}' segments are not allowed`);
  }
  if (decoded.includes('/') || decoded.includes('\\')) {
    throw new InvalidStoragePathError(field, raw, 'a segment may not contain a slash or a backslash');
  }
  if (CONTROL_CHARACTERS.test(decoded)) {
    throw new InvalidStoragePathError(field, raw, 'control characters are not allowed');
  }
  return decoded;
}
