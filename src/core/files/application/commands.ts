import type { DirectoryQuery, StoragePath, UploadableFile } from '@/core/files/domain';

export type BrowseFilesQuery = DirectoryQuery;

export interface CreateDirectoryCommand {
  readonly path: StoragePath;
}

export interface UploadFileCommand {
  readonly directory: StoragePath;
  readonly file: UploadableFile;
  readonly overwrite: boolean;
}

export interface CreatedDirectory {
  /** The core's client form: URL-encoded per segment. */
  readonly path: string;
}

export interface UploadedFile {
  /** The stored path the core reported. */
  readonly path: string;
  readonly size: number;
  readonly overwritten: boolean;
}
