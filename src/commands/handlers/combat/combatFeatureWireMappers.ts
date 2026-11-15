import type {
  CombatEncounterSummary,
  CombatTrackerConfigResult,
  CombatantGroupResult,
  CombatantGroupSummary
} from '@/commands/types';
import type { CombatantGroup, CombatantGroupOutcome, Encounter, TrackerConfigView } from '@/core/combat';

/** `name` is left out, not null, on cores where encounters have no name. */
export function toWireEncounter(encounter: Encounter): CombatEncounterSummary {
  const summary: CombatEncounterSummary = {
    id: encounter.id,
    sceneId: encounter.sceneId,
    active: encounter.active,
    isDefault: encounter.isDefault,
    started: encounter.started,
    round: encounter.round,
    turn: encounter.turn,
    combatantCount: encounter.combatantCount
  };
  return encounter.name !== undefined ? { ...summary, name: encounter.name } : summary;
}

export function toWireCombatantGroup(group: CombatantGroup): CombatantGroupSummary {
  return {
    id: group.id,
    name: group.name,
    img: group.img,
    initiative: group.initiative,
    defeated: group.defeated,
    hidden: group.hidden,
    memberIds: [...group.memberIds]
  };
}

export function toWireCombatantGroupResult(outcome: CombatantGroupOutcome): CombatantGroupResult {
  return { ...toWireCombatantGroup(outcome.group), combatId: outcome.combatId };
}

/** `turnMarker` and `turnMarkerAnimations` are left out on cores without turn markers. */
export function toWireTrackerConfig(view: TrackerConfigView): CombatTrackerConfigResult {
  const { config } = view;
  const result: CombatTrackerConfigResult = { resource: config.resource, skipDefeated: config.skipDefeated };
  if (config.turnMarker !== undefined) {
    result.turnMarker = { ...config.turnMarker };
  }
  if (view.turnMarkerAnimations !== null) {
    result.turnMarkerAnimations = [...view.turnMarkerAnimations];
  }
  return result;
}
