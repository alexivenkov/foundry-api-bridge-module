import type { NotifyParams, NotifyResult } from '@/commands/types';
import { asError } from '@/commands/handlers/legacyWire';
import { parseRequest } from '@/core/shared';
import {
  createFoundryNotificationCenterService,
  notifyRequestSchema,
  toNotifyCommand,
  type UiProvider
} from '@/core/ui';

export interface NotifyHandlerDependencies {
  ui?: UiProvider;
}

export function createNotifyHandler(
  deps: NotifyHandlerDependencies = {}
): (params: NotifyParams) => Promise<NotifyResult> {
  const service = createFoundryNotificationCenterService(deps.ui);

  return function notifyHandler(params: NotifyParams): Promise<NotifyResult> {
    try {
      const shown = service.show(toNotifyCommand(parseRequest(notifyRequestSchema, params)));
      const result: NotifyResult = { shown: true, type: shown.level };
      if (shown.id !== null) {
        result.notificationId = shown.id;
      }
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(asError(error));
    }
  };
}

export const notifyHandler = createNotifyHandler();
