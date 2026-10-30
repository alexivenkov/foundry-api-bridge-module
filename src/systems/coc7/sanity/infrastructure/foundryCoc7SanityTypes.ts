import { getCoc7Game, type FoundryCoc7Game } from '@/systems/coc7/shared/infrastructure';

export type FoundryCoc7SanityGame = FoundryCoc7Game;

export function getCoc7SanityGame(): FoundryCoc7SanityGame {
  return getCoc7Game();
}

export type UuidResolver = (uuid: string) => Promise<unknown>;

/** Foundry's global `fromUuid`, which the bout-of-madness tables are stored as. */
export function foundryUuidResolver(): UuidResolver {
  return async (uuid: string): Promise<unknown> => {
    const fromUuid = (globalThis as { fromUuid?: UuidResolver }).fromUuid;
    if (typeof fromUuid !== 'function') {
      return null;
    }
    return fromUuid(uuid);
  };
}
