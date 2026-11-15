import type { GetSettingParams, GetSettingResult } from '@/commands/types';
import {
  createFoundrySettingService,
  getSettingRequestSchema,
  toGetSettingQuery,
  type SettingWiring
} from '@/core/settings';
import { parseRequest } from '@/core/shared';
import { toWireSettingDetails } from './settingWireMappers';

export function createGetSettingHandler(
  wiring: SettingWiring = {}
): (params: GetSettingParams) => Promise<GetSettingResult> {
  const service = createFoundrySettingService(wiring);

  return function getSettingHandler(params: GetSettingParams): Promise<GetSettingResult> {
    try {
      const entry = service.getSetting(toGetSettingQuery(parseRequest(getSettingRequestSchema, params)));
      return Promise.resolve(toWireSettingDetails(entry));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getSettingHandler = createGetSettingHandler();
