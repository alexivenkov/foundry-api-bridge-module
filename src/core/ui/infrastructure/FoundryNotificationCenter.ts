import type {
  NotificationCenter,
  NotificationLevel,
  ProgressNotification,
  ProgressUpdate,
  ShownNotification,
  UiNotification
} from '@/core/ui/domain';
import type { FoundryNotifications } from './foundryUiTypes';
import { readUi, type UiProvider } from './uiGlobals';

function notificationId(returned: unknown): number | null {
  const id = typeof returned === 'object' && returned !== null ? (returned as { id?: unknown }).id : undefined;
  return typeof id === 'number' ? id : null;
}

/**
 * Only what is set is passed on. `localize`, `format` and `clean` keep the
 * core defaults, so a message is never read as a localization key and is
 * always cleaned of HTML.
 */
function optionsOf(notification: UiNotification): Record<string, unknown> {
  const options: Record<string, unknown> = {};
  if (notification.permanent !== undefined) {
    options['permanent'] = notification.permanent;
  }
  if (notification.console !== undefined) {
    options['console'] = notification.console;
  }
  return options;
}

function showAt(
  notifications: FoundryNotifications,
  level: NotificationLevel,
  message: string,
  options: Record<string, unknown>
): ShownNotification {
  switch (level) {
    case 'success':
      if (notifications.success) {
        return { level: 'success', id: notificationId(notifications.success(message, options)) };
      }
      // A core without a success toast shows the message as plain info.
      return { level: 'info', id: notificationId(notifications.info(message, options)) };
    case 'warn':
      return { level: 'warn', id: notificationId(notifications.warn(message, options)) };
    case 'error':
      return { level: 'error', id: notificationId(notifications.error(message, options)) };
    case 'info':
      return { level: 'info', id: notificationId(notifications.info(message, options)) };
  }
}

/**
 * `ui.notifications` of the GM's client. Everything shown here stays in that
 * browser: the core broadcasts no notification to other clients.
 */
export class FoundryNotificationCenter implements NotificationCenter {
  constructor(private readonly ui: UiProvider = readUi) {}

  show(notification: UiNotification): ShownNotification {
    return showAt(this.ui().notifications, notification.level, notification.message, optionsOf(notification));
  }

  tracksNotifications(): boolean {
    const { notifications } = this.ui();
    return (
      typeof notifications.update === 'function' &&
      typeof notifications.has === 'function' &&
      typeof notifications.remove === 'function'
    );
  }

  /** A progress bar is never closed by the core's timer, only at 100 % or on removal. */
  startProgress(progress: ProgressNotification): ShownNotification {
    const { notifications } = this.ui();
    const shown = showAt(notifications, progress.level, progress.message, { ...optionsOf(progress), progress: true });
    if (shown.id !== null && progress.pct !== undefined && progress.pct > 0) {
      notifications.update?.(shown.id, { pct: progress.pct });
    }
    return shown;
  }

  exists(notificationId: number): boolean {
    return this.ui().notifications.has?.(notificationId) ?? false;
  }

  updateProgress(notificationId: number, update: ProgressUpdate): void {
    const change: { message?: string; pct?: number } = {};
    if (update.message !== undefined) {
      change.message = update.message;
    }
    if (update.pct !== undefined) {
      change.pct = update.pct;
    }
    this.ui().notifications.update?.(notificationId, change);
  }

  remove(notificationId: number): void {
    this.ui().notifications.remove?.(notificationId);
  }
}
