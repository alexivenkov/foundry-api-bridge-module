// CONST.AUDIO_FILE_EXTENSIONS, identical in Foundry 13.351 and 14.368.
export const AUDIO_FILE_EXTENSIONS = ['aac', 'flac', 'm4a', 'mid', 'mp3', 'ogg', 'opus', 'wav', 'webm'] as const;

// The core's own test (`hasFileExtension`): the extension ends the path, a
// query string may follow, case does not matter.
const AUDIO_PATH = new RegExp(`\\.(?:${AUDIO_FILE_EXTENSIONS.join('|')})(?:\\?.*)?$`, 'i');

/**
 * One audio file: a path under the Foundry data root or a URL with an audio
 * extension. Stricter than the core, which also lets a wildcard pattern or
 * base64 data through: neither plays as a single positional or ambient sound.
 */
export function isAudioPath(path: string): boolean {
  return !path.includes('*') && !path.startsWith('data:') && AUDIO_PATH.test(path);
}
