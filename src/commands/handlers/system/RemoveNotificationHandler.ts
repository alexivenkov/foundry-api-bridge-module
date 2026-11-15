import type { RemoveNotificationParams, RemoveNotificationResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryNotificationCenterService,
  removeNotificationRequestSchema,
  toRemoveNotificationCommand
} from '@/core/ui';
import type { NotifyHandlerDependencies } from './NotifyHandler';

export function createRemoveNotificationHandler(
  deps: NotifyHandlerDependencies = {}
): (params: RemoveNotificationParams) => Promise<RemoveNotificationResult> {
  const service = createFoundryNotificationCenterService(deps.ui);

  return function removeNotificationHandler(params: RemoveNotificationParams): Promise<RemoveNotificationResult> {
    try {
      const command = toRemoveNotificationCommand(parseRequest(removeNotificationRequestSchema, params));
      service.remove(command);
      return Promise.resolve({ removed: true, notificationId: command.notificationId });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const removeNotificationHandler = createRemoveNotificationHandler();
