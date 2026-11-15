import { findFoundryScene } from '@/core/shared';
import type { CombatToken, CombatTokenReader } from '@/core/combat/domain';
import { requireEncounterDocument } from './encounterDocuments';
import type { CombatWorldGameProvider } from './foundryEncounterTypes';

/** The tokens of the world's scenes, as `TokenDocument.createCombatants` turns one into a combatant. */
export class FoundryCombatTokenReader implements CombatTokenReader {
  constructor(private readonly worldProvider: CombatWorldGameProvider) {}

  linkedSceneId(combatId: string): string | null {
    return requireEncounterDocument(this.worldProvider, combatId).scene?.id ?? null;
  }

  findToken(sceneId: string, tokenId: string): CombatToken | null {
    const scene = findFoundryScene(this.worldProvider.getGame().scenes, sceneId);
    const token = scene?.tokens.get(tokenId);
    if (!scene || !token) {
      return null;
    }
    return { id: token.id, sceneId: scene.id, actorId: token.actorId, hidden: token.hidden };
  }
}
