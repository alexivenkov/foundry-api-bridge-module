import type { GetSettingsParams, GetSettingsResult } from '@/commands/types';
import {
  createFoundrySettingService,
  getSettingsRequestSchema,
  toListSettingsQuery,
  type SettingWiring
} from '@/core/settings';
import { parseRequest } from '@/core/shared';
import { toWireSettingSummary } from './settingWireMappers';

export function createGetSettingsHandler(
  wiring: SettingWiring = {}
): (params: GetSettingsParams) => Promise<GetSettingsResult> {
  const service = createFoundrySettingService(wiring);

  return function getSettingsHandler(params: GetSettingsParams): Promise<GetSettingsResult> {
    try {
      const entries = service.listSettings(toListSettingsQuery(parseRequest(getSettingsRequestSchema, params)));
      return Promise.resolve({ settings: entries.map(toWireSettingSummary) });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getSettingsHandler = createGetSettingsHandler();
