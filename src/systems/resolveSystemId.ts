declare const game: { system?: { id?: string } };

/**
 * Read the active world's game-system id from the Foundry global. Returns an
 * empty string when unavailable; `getGameSystem` then surfaces an
 * UnsupportedSystemError for the empty id.
 */
export function resolveSystemId(): string {
  return game.system?.id ?? '';
}
