import {
  DirectoryAlreadyExistsError,
  FILE_SOURCES,
  FileOperationFailedError,
  redactFileSystemPaths,
  type DirectoryListing,
  type DirectoryQuery,
  type FileSource,
  type FileStorage,
  type StoragePath,
  type UploadableFile
} from '@/core/files/domain';
import type {
  FileGlobalsProvider,
  FoundryBrowseOptions,
  FoundryFileGlobals,
  FoundryFilePickerClass
} from './foundryFileTypes';

const fromGlobalThis: FileGlobalsProvider = () => globalThis as unknown as FoundryFileGlobals;

// Server texts of `LocalFileStorage` (identical in 13.351 and 14.368).
const MISSING_DIRECTORY = /does not exist or is not accessible/;
const EXISTING_PATH = /\bEEXIST\b/;

/** Anti-corruption layer over the static file API of `FilePicker`. */
export class FoundryFileStorage implements FileStorage {
  constructor(private readonly globals: FileGlobalsProvider = fromGlobalThis) {}

  availableSources(): readonly FileSource[] {
    const storages = this.globals().game.data?.files?.storages ?? [];
    return FILE_SOURCES.filter((source) => storages.includes(source));
  }

  worldId(): string | null {
    const id = this.globals().game.world?.id;
    return typeof id === 'string' && id !== '' ? id : null;
  }

  async listDirectory(query: DirectoryQuery): Promise<DirectoryListing | null> {
    const options: FoundryBrowseOptions = {};
    if (query.bucket !== null) {
      options.bucket = query.bucket;
    }
    if (query.extensions.length > 0) {
      options.extensions = [...query.extensions];
    }
    if (query.wildcard) {
      options.wildcard = true;
    }
    try {
      // The server decodes a browsed target once, so it gets the encoded form.
      const result = await this.filePicker().browse(query.source, query.path.toClientPath(), options);
      return {
        source: query.source,
        path: result.target,
        bucket: typeof result.bucket === 'string' ? result.bucket : null,
        directories: [...result.dirs],
        files: [...result.files]
      };
    } catch (error) {
      if (MISSING_DIRECTORY.test(messageOf(error))) {
        return null;
      }
      throw failure('Failed to browse files', error);
    }
  }

  async createDirectory(path: StoragePath): Promise<void> {
    try {
      await this.filePicker().createDirectory('data', path.toString(), {});
    } catch (error) {
      if (EXISTING_PATH.test(messageOf(error))) {
        throw new DirectoryAlreadyExistsError(path.toClientPath());
      }
      throw failure('Failed to create directory', error);
    }
  }

  async uploadFile(directory: StoragePath, file: UploadableFile): Promise<string> {
    const globals = this.globals();
    const FileClass = globals.File ?? File;
    const decode = globals.atob ?? atob;
    const content = Uint8Array.from(decode(file.base64), (char) => char.charCodeAt(0));
    const blob = new FileClass([content], file.name, { type: file.mediaType.mimeType });
    let response: unknown;
    try {
      // `notify: false` turns the core's success and warning notifications into console lines;
      // a refusal by the server is still shown to the GM and answered with `false`.
      response = await this.filePicker().upload('data', directory.toString(), blob, {}, { notify: false });
    } catch (error) {
      throw failure('Failed to upload file', error);
    }
    if (response === false) {
      throw new FileOperationFailedError('Failed to upload file: the server refused it');
    }
    const stored = isRecord(response) ? response['path'] : undefined;
    if (typeof stored !== 'string' || stored === '') {
      throw new FileOperationFailedError('Failed to upload file: the core reported no stored path');
    }
    return stored;
  }

  private filePicker(): FoundryFilePickerClass {
    const globals = this.globals();
    const picker = globals.foundry?.applications?.apps?.FilePicker?.implementation ?? globals.FilePicker;
    if (picker === undefined) {
      throw new FileOperationFailedError('The FilePicker API is not available');
    }
    return picker;
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function failure(prefix: string, error: unknown): FileOperationFailedError {
  const text = redactFileSystemPaths(messageOf(error)).slice(0, 500);
  return new FileOperationFailedError(`${prefix}: ${text}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
