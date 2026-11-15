import type { FileSource, StoragePath } from '@/core/files/domain/value-objects/storagePath';
import type { UploadMediaType } from '@/core/files/domain/rules/uploadableFile';

export interface DirectoryQuery {
  readonly source: FileSource;
  readonly path: StoragePath;
  /** `s3` only. */
  readonly bucket: string | null;
  /** Lower-case, with the leading dot; empty for every file. */
  readonly extensions: readonly string[];
  /** The last segment of `path` is a glob pattern. */
  readonly wildcard: boolean;
}

/** A directory as the core lists it; paths are the core's client paths. */
export interface DirectoryListing {
  readonly source: FileSource;
  readonly path: string;
  readonly bucket: string | null;
  readonly directories: readonly string[];
  readonly files: readonly string[];
}

export interface UploadableFile {
  readonly name: string;
  readonly mediaType: UploadMediaType;
  /** Validated base64 without whitespace. */
  readonly base64: string;
  readonly byteLength: number;
}
