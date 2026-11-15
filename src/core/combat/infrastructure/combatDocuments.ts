import type { GameProvider } from '@/core/shared';
import { CombatNotFoundError } from '@/core/combat/domain';
import type { FoundryCombatDocument, FoundryCombatGame } from './foundryCombatTypes';

export type CombatGameProvider = GameProvider<FoundryCombatGame>;

export function findCombatDocument(game: FoundryCombatGame, combatId: string): FoundryCombatDocument | undefined {
  const active = game.combat;
  return active?.id === combatId ? active : game.combats.get(combatId);
}

export function requireCombatDocument(gameProvider: CombatGameProvider, combatId: string): FoundryCombatDocument {
  const document = findCombatDocument(gameProvider.getGame(), combatId);
  if (document === undefined) {
    throw new CombatNotFoundError(combatId);
  }
  return document;
}
