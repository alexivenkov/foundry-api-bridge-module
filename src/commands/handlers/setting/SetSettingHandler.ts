import type { SetSettingParams, SetSettingResult } from '@/commands/types';
import {
  createFoundrySettingService,
  setSettingRequestSchema,
  toSetSettingCommand,
  type SettingWiring
} from '@/core/settings';
import { parseRequest } from '@/core/shared';
import { toWireSettingChange } from './settingWireMappers';

export function createSetSettingHandler(
  wiring: SettingWiring = {}
): (params: SetSettingParams) => Promise<SetSettingResult> {
  const service = createFoundrySettingService(wiring);

  return async function setSettingHandler(params: SetSettingParams): Promise<SetSettingResult> {
    const command = toSetSettingCommand(parseRequest(setSettingRequestSchema, params));
    return toWireSettingChange(await service.setSetting(command));
  };
}

export const setSettingHandler = createSetSettingHandler();
