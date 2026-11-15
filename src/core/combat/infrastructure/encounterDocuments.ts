import { CombatNotFoundError } from '@/core/combat/domain';
import type { CombatWorldGameProvider, FoundryCombatWorldGame, FoundryEncounterDocument } from './foundryEncounterTypes';

export function findEncounterDocument(
  game: FoundryCombatWorldGame,
  combatId: string
): FoundryEncounterDocument | undefined {
  const viewed = game.combat;
  return viewed?.id === combatId ? viewed : game.combats.get(combatId);
}

export function requireEncounterDocument(
  worldProvider: CombatWorldGameProvider,
  combatId: string
): FoundryEncounterDocument {
  const document = findEncounterDocument(worldProvider.getGame(), combatId);
  if (document === undefined) {
    throw new CombatNotFoundError(combatId);
  }
  return document;
}
