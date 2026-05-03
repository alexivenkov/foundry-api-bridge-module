import type { NotifyParams, NotifyResult } from '@/commands/types';
import { getUi } from './systemTypes';

export function notifyHandler(params: NotifyParams): Promise<NotifyResult> {
  const ui = getUi();
  const type = params.type ?? 'info';
  const opts: { permanent?: boolean } = {};
  if (params.permanent !== undefined) {
    opts.permanent = params.permanent;
  }

  switch (type) {
    case 'success':
      if (ui.notifications.success) {
        ui.notifications.success(params.message, opts);
      } else {
        ui.notifications.info(params.message, opts);
      }
      break;
    case 'warn':
      ui.notifications.warn(params.message, opts);
      break;
    case 'error':
      ui.notifications.error(params.message, opts);
      break;
    case 'info':
    default:
      ui.notifications.info(params.message, opts);
      break;
  }

  return Promise.resolve({ shown: true, type });
}
