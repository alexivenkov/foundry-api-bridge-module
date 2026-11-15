import { z } from 'zod';

// `CONST.IMAGE_FILE_EXTENSIONS` / `VIDEO_FILE_EXTENSIONS` and the test of
// `FilePathField` (`hasFileExtension`: the extension may be followed by a
// query string), the same in Foundry 13 and 14. The core would reject any other
// path with a validation error of its own.
const IMAGE_EXTENSIONS = ['apng', 'avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'tiff', 'webp'];
const VIDEO_EXTENSIONS = ['m4v', 'mp4', 'ogv', 'webm'];

function extensionPattern(extensions: readonly string[]): RegExp {
  return new RegExp(`\\.(${extensions.join('|')})(\\?.*)?$`, 'i');
}

const IMAGE_PATH = extensionPattern(IMAGE_EXTENSIONS);
const MEDIA_PATH = extensionPattern([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

export const imagePath = z
  .string()
  .regex(IMAGE_PATH, `must be an image file (${IMAGE_EXTENSIONS.join(', ')})`);

export const imageOrVideoPath = z
  .string()
  .regex(MEDIA_PATH, `must be an image or video file (${[...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].join(', ')})`);
