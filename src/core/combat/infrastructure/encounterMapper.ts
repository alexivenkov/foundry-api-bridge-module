import { foundryGeneration } from '@/compat/foundryVersion';
import type { Encounter } from '@/core/combat/domain';
import type { FoundryEncounterDocument } from './foundryEncounterTypes';

const ENCOUNTER_NAMES_SINCE = 14;

function combatantSceneIds(document: FoundryEncounterDocument): string[] {
  const sceneIds = new Set<string>();
  for (const combatant of document.combatants.contents) {
    if (combatant.sceneId) {
      sceneIds.add(combatant.sceneId);
    }
  }
  return [...sceneIds];
}

export function toEncounter(document: FoundryEncounterDocument, defaultCombatId: string | null): Encounter {
  const encounter: Encounter = {
    id: document.id,
    sceneId: document.scene?.id ?? null,
    active: document.active,
    isDefault: document.id === defaultCombatId,
    started: document.started,
    round: document.round,
    turn: document.turn,
    combatantCount: document.combatants.contents.length,
    combatantSceneIds: combatantSceneIds(document)
  };
  return foundryGeneration() >= ENCOUNTER_NAMES_SINCE ? { ...encounter, name: document.name || null } : encounter;
}
