import type { CombatTrackerConfigResult, GetCombatTrackerConfigParams } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTrackerConfigService,
  getCombatTrackerConfigRequestSchema,
  type CombatWiring
} from '@/core/combat';
import { toWireTrackerConfig } from './combatFeatureWireMappers';

export function createGetCombatTrackerConfigHandler(
  wiring: CombatWiring = {}
): (params: GetCombatTrackerConfigParams) => Promise<CombatTrackerConfigResult> {
  const service = createFoundryTrackerConfigService(wiring);

  return function getCombatTrackerConfigHandler(
    params: GetCombatTrackerConfigParams
  ): Promise<CombatTrackerConfigResult> {
    try {
      parseRequest(getCombatTrackerConfigRequestSchema, params);
      return Promise.resolve(toWireTrackerConfig(service.getConfig()));
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const getCombatTrackerConfigHandler = createGetCombatTrackerConfigHandler();
