import type { CombatEncounterSummary, ToggleCombatSceneLinkParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryEncounterService,
  toToggleSceneLinkCommand,
  toggleCombatSceneLinkRequestSchema,
  type CombatWiring
} from '@/core/combat';
import { toWireEncounter } from './combatFeatureWireMappers';

export function createToggleCombatSceneLinkHandler(
  wiring: CombatWiring = {}
): (params: ToggleCombatSceneLinkParams) => Promise<CombatEncounterSummary> {
  const service = createFoundryEncounterService(wiring);

  return async function toggleCombatSceneLinkHandler(
    params: ToggleCombatSceneLinkParams
  ): Promise<CombatEncounterSummary> {
    const command = toToggleSceneLinkCommand(parseRequest(toggleCombatSceneLinkRequestSchema, params));
    return toWireEncounter(await service.toggleSceneLink(command));
  };
}

export const toggleCombatSceneLinkHandler = createToggleCombatSceneLinkHandler();
