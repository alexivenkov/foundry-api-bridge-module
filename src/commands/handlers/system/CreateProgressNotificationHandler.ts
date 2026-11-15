import type { CreateProgressNotificationParams, CreateProgressNotificationResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryNotificationCenterService,
  createProgressNotificationRequestSchema,
  toStartProgressCommand
} from '@/core/ui';
import type { NotifyHandlerDependencies } from './NotifyHandler';

export function createCreateProgressNotificationHandler(
  deps: NotifyHandlerDependencies = {}
): (params: CreateProgressNotificationParams) => Promise<CreateProgressNotificationResult> {
  const service = createFoundryNotificationCenterService(deps.ui);

  return function createProgressNotificationHandler(
    params: CreateProgressNotificationParams
  ): Promise<CreateProgressNotificationResult> {
    try {
      const started = service.startProgress(
        toStartProgressCommand(parseRequest(createProgressNotificationRequestSchema, params))
      );
      return Promise.resolve({ notificationId: started.notificationId, type: started.level, pct: started.pct });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const createProgressNotificationHandler = createCreateProgressNotificationHandler();
