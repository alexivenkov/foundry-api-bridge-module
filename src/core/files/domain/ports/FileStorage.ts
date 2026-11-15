import type { DirectoryListing, DirectoryQuery, UploadableFile } from '@/core/files/domain/model/FileListing';
import type { FileSource, StoragePath } from '@/core/files/domain/value-objects/storagePath';

/**
 * The server's file storages as the GM client reaches them. A refusal of the
 * core surfaces as `FileOperationFailedError` with any host path redacted.
 */
export interface FileStorage {
  /** The storages the server offers to this user. */
  availableSources(): readonly FileSource[];
  /** The id of the loaded world; null before one is loaded. */
  worldId(): string | null;
  /** Resolves to null when the directory does not exist. */
  listDirectory(query: DirectoryQuery): Promise<DirectoryListing | null>;
  /** Creates one directory in the `data` source; its parent must exist. */
  createDirectory(path: StoragePath): Promise<void>;
  /** Stores the file in a `data` directory and resolves to the path the core reported. */
  uploadFile(directory: StoragePath, file: UploadableFile): Promise<string>;
}
