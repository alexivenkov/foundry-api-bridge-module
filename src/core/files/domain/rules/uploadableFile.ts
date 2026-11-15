import { FileTypeNotAllowedError, InvalidFileNameError } from '@/core/files/domain/errors/fileErrors';

export type UploadMediaKind = 'image' | 'audio' | 'video';

export interface UploadMediaType {
  readonly kind: UploadMediaKind;
  readonly mimeType: string;
}

/**
 * `CONST.IMAGE_FILE_EXTENSIONS` + `AUDIO_FILE_EXTENSIONS` +
 * `VIDEO_FILE_EXTENSIONS` without `svg`, identical in Foundry 13.351 and
 * 14.368. Everything else the core accepts for upload (SVG, text, JSON, PDF,
 * fonts, 3D models) is refused: those files would be served from the Foundry
 * origin. `webm` is the audio / video container both lists name.
 */
export const UPLOAD_MEDIA_TYPES: ReadonlyMap<string, UploadMediaType> = new Map(Object.entries({
  apng: { kind: 'image', mimeType: 'image/apng' },
  avif: { kind: 'image', mimeType: 'image/avif' },
  bmp: { kind: 'image', mimeType: 'image/bmp' },
  gif: { kind: 'image', mimeType: 'image/gif' },
  jpeg: { kind: 'image', mimeType: 'image/jpeg' },
  jpg: { kind: 'image', mimeType: 'image/jpeg' },
  png: { kind: 'image', mimeType: 'image/png' },
  tiff: { kind: 'image', mimeType: 'image/tiff' },
  webp: { kind: 'image', mimeType: 'image/webp' },
  aac: { kind: 'audio', mimeType: 'audio/aac' },
  flac: { kind: 'audio', mimeType: 'audio/flac' },
  m4a: { kind: 'audio', mimeType: 'audio/mp4' },
  mid: { kind: 'audio', mimeType: 'audio/midi' },
  mp3: { kind: 'audio', mimeType: 'audio/mpeg' },
  ogg: { kind: 'audio', mimeType: 'audio/ogg' },
  opus: { kind: 'audio', mimeType: 'audio/opus' },
  wav: { kind: 'audio', mimeType: 'audio/wav' },
  webm: { kind: 'video', mimeType: 'video/webm' },
  m4v: { kind: 'video', mimeType: 'video/mp4' },
  mp4: { kind: 'video', mimeType: 'video/mp4' },
  ogv: { kind: 'video', mimeType: 'video/ogg' }
} satisfies Record<string, UploadMediaType>));

export const UPLOAD_EXTENSIONS: readonly string[] = [...UPLOAD_MEDIA_TYPES.keys()];

export const MAX_FILE_NAME_LENGTH = 200;

const FORBIDDEN_NAME_CHARACTERS = /[/\\%<>:"|?*\u0000-\u001f\u007f]/;

export interface UploadFileName {
  readonly name: string;
  readonly extension: string;
  readonly mediaType: UploadMediaType;
}

/**
 * The core stores an upload under the name it is given (express-fileupload
 * without `safeFileNames`) and picks the MIME type from the extension alone.
 */
export function parseUploadFileName(name: string): UploadFileName {
  if (name.length === 0 || name.length > MAX_FILE_NAME_LENGTH) {
    throw new InvalidFileNameError(name, `must be 1–${String(MAX_FILE_NAME_LENGTH)} characters`);
  }
  if (name.startsWith('.')) {
    throw new InvalidFileNameError(name, 'may not start with a dot');
  }
  if (name.trim() !== name || name.endsWith('.')) {
    throw new InvalidFileNameError(name, 'may not start or end with a space nor end with a dot');
  }
  if (FORBIDDEN_NAME_CHARACTERS.test(name)) {
    throw new InvalidFileNameError(name, 'may not contain / \\ % < > : " | ? * or control characters');
  }
  const dot = name.lastIndexOf('.');
  if (dot <= 0) {
    throw new InvalidFileNameError(name, 'needs an extension');
  }
  const extension = name.slice(dot + 1).toLowerCase();
  const mediaType = UPLOAD_MEDIA_TYPES.get(extension);
  if (mediaType === undefined) {
    throw new FileTypeNotAllowedError(`.${extension}`, UPLOAD_EXTENSIONS);
  }
  return { name, extension, mediaType };
}
