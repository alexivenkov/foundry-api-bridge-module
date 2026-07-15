import {
  Pf2eCompendiumPackNotFoundError,
  Pf2eCompendiumPackTypeError
} from './compendiumErrors';
import type {
  Pf2eCompendiumGameProvider,
  Pf2eCompendiumPack
} from './foundryCompendiumPackTypes';

// Explicit packIds resolve loudly (unknown pack / wrong pack type throw);
// omitted packIds discover every pack of the requested type.
export function resolvePacks(
  gameProvider: Pf2eCompendiumGameProvider,
  packType: string,
  packIds?: readonly string[]
): Pf2eCompendiumPack[] {
  const packs = gameProvider.getGame().packs;

  if (packIds !== undefined) {
    return packIds.map(packId => {
      const pack = packs?.get(packId);
      if (!pack) {
        throw new Pf2eCompendiumPackNotFoundError(packId);
      }
      if (pack.metadata.type !== packType) {
        throw new Pf2eCompendiumPackTypeError(packId, packType);
      }
      return pack;
    });
  }

  const discovered: Pf2eCompendiumPack[] = [];
  packs?.forEach(pack => {
    if (pack.metadata.type === packType) {
      discovered.push(pack);
    }
  });
  return discovered;
}
