// An absolute host path: `/…` or `C:\…` / `C:/…` or `\\server\…`, starting a
// word (the core writes them bare or in quotes: "mkdir '/home/…/Data/x'").
const ABSOLUTE_PATH = /(?<=^|[\s'"`(=])(?:[A-Za-z]:[\\/]|\\\\|\/)[^\s'"`)]*/g;

/**
 * Some core file errors name the absolute host path (`Target directory
 * /home/…/Data/worlds/x does not exist.`, Node's `EEXIST: …, mkdir '…'`);
 * that path must not leave the GM browser.
 */
export function redactFileSystemPaths(text: string): string {
  return text.replace(ABSOLUTE_PATH, '<path>');
}
