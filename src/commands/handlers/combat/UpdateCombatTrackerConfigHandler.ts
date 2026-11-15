import type { CombatTrackerConfigResult, UpdateCombatTrackerConfigParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTrackerConfigService,
  toUpdateTrackerConfigCommand,
  updateCombatTrackerConfigRequestSchema,
  type CombatWiring
} from '@/core/combat';
import { toWireTrackerConfig } from './combatFeatureWireMappers';

export function createUpdateCombatTrackerConfigHandler(
  wiring: CombatWiring = {}
): (params: UpdateCombatTrackerConfigParams) => Promise<CombatTrackerConfigResult> {
  const service = createFoundryTrackerConfigService(wiring);

  return async function updateCombatTrackerConfigHandler(
    params: UpdateCombatTrackerConfigParams
  ): Promise<CombatTrackerConfigResult> {
    const command = toUpdateTrackerConfigCommand(parseRequest(updateCombatTrackerConfigRequestSchema, params));
    return toWireTrackerConfig(await service.updateConfig(command));
  };
}

export const updateCombatTrackerConfigHandler = createUpdateCombatTrackerConfigHandler();
