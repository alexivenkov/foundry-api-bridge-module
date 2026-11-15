/** The `browseFiles` answer of the server's local and S3 storages (Foundry 13.351 / 14.368). */
export interface FoundryBrowseResult {
  /** The listed directory, URL-encoded (`encodeURL`); for S3 the decoded key prefix. */
  target: string;
  dirs: string[];
  files: string[];
  /** S3 only, when a bucket was listed. */
  bucket?: string | undefined;
}

export interface FoundryBrowseOptions {
  bucket?: string;
  extensions?: string[];
  wildcard?: boolean;
}

/** `{status, message, path}` on success; `false`, `undefined` or `{}` when the upload failed. */
export type FoundryUploadResponse = { path?: unknown; message?: unknown } | false | undefined | null;

/**
 * The static file API of `FilePicker` (`foundry.applications.apps.FilePicker`
 * in Foundry 13+, the global `FilePicker` before). Each call goes to the
 * server: `browse` / `createDirectory` over the `manageFiles` socket event,
 * `upload` as a POST to `/upload`.
 */
export interface FoundryFilePickerClass {
  browse(source: string, target: string, options?: FoundryBrowseOptions): Promise<FoundryBrowseResult>;
  createDirectory(source: string, target: string, options?: Record<string, unknown>): Promise<unknown>;
  upload(
    source: string,
    path: string,
    file: File,
    body?: Record<string, unknown>,
    options?: { notify?: boolean }
  ): Promise<FoundryUploadResponse>;
}

export type FileConstructor = new (parts: BlobPart[], name: string, options?: FilePropertyBag) => File;

export interface FoundryFileGlobals {
  game: {
    world?: { id?: string | null } | null;
    data?: { files?: { storages?: readonly string[] | null } | null } | null;
  };
  foundry?: {
    applications?: { apps?: { FilePicker?: { implementation?: FoundryFilePickerClass } } };
  };
  /** The pre-13 global; Foundry 13+ keeps it only as a deprecated alias. */
  FilePicker?: FoundryFilePickerClass;
  File?: FileConstructor;
  atob?: (data: string) => string;
}

export type FileGlobalsProvider = () => FoundryFileGlobals;
