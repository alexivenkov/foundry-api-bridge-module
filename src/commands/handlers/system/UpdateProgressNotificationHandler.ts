import type { UpdateProgressNotificationParams, UpdateProgressNotificationResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryNotificationCenterService,
  toUpdateProgressCommand,
  updateProgressNotificationRequestSchema
} from '@/core/ui';
import type { NotifyHandlerDependencies } from './NotifyHandler';

export function createUpdateProgressNotificationHandler(
  deps: NotifyHandlerDependencies = {}
): (params: UpdateProgressNotificationParams) => Promise<UpdateProgressNotificationResult> {
  const service = createFoundryNotificationCenterService(deps.ui);

  return function updateProgressNotificationHandler(
    params: UpdateProgressNotificationParams
  ): Promise<UpdateProgressNotificationResult> {
    try {
      const updated = service.updateProgress(
        toUpdateProgressCommand(parseRequest(updateProgressNotificationRequestSchema, params))
      );
      return Promise.resolve({
        notificationId: updated.notificationId,
        pct: updated.pct,
        message: updated.message,
        completed: updated.completed
      });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const updateProgressNotificationHandler = createUpdateProgressNotificationHandler();
