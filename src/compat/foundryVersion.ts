interface VersionGame {
  version?: string;
  release?: { generation?: number };
}

/**
 * The running Foundry VTT major version (generation).
 *
 * Prefers `game.release.generation` (a number, available since v10); falls back
 * to parsing the major segment of `game.version`. Returns 0 when neither is
 * available (e.g. before `ready`).
 */
export function foundryGeneration(): number {
  const game = (globalThis as { game?: VersionGame }).game;
  const generation = game?.release?.generation;
  if (typeof generation === 'number') {
    return generation;
  }
  const major = parseInt((game?.version ?? '').split('.')[0] ?? '', 10);
  return Number.isFinite(major) ? major : 0;
}

export function isV14Plus(): boolean {
  return foundryGeneration() >= 14;
}
