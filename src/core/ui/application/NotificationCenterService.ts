import { CoreFeatureUnavailableError } from '@/core/shared';
import {
  NOTIFICATION_REMOVAL_UNAVAILABLE,
  NotificationNotFoundError,
  PROGRESS_NOTIFICATIONS_UNAVAILABLE,
  type NotificationCenter,
  type NotificationLevel,
  type ShownNotification
} from '@/core/ui/domain';
import type {
  NotifyCommand,
  RemoveNotificationCommand,
  StartProgressCommand,
  UpdateProgressCommand
} from './commands';

export interface NotificationCenterServiceDependencies {
  readonly notifications: NotificationCenter;
}

export interface ProgressStarted {
  readonly notificationId: number;
  readonly level: NotificationLevel;
  readonly pct: number;
}

export interface ProgressUpdated {
  readonly notificationId: number;
  readonly pct: number | null;
  readonly message: string | null;
  /** A non-permanent bar closes itself half a second after reaching 1. */
  readonly completed: boolean;
}

/** Notifications are local to the GM's browser: the core has no way to show one on a player's screen. */
export class NotificationCenterService {
  constructor(private readonly deps: NotificationCenterServiceDependencies) {}

  show(command: NotifyCommand): ShownNotification {
    return this.deps.notifications.show(command.notification);
  }

  startProgress(command: StartProgressCommand): ProgressStarted {
    this.requireTracking(PROGRESS_NOTIFICATIONS_UNAVAILABLE);
    const shown = this.deps.notifications.startProgress(command.progress);
    if (shown.id === null) {
      throw new CoreFeatureUnavailableError(PROGRESS_NOTIFICATIONS_UNAVAILABLE);
    }
    return { notificationId: shown.id, level: shown.level, pct: command.progress.pct ?? 0 };
  }

  updateProgress(command: UpdateProgressCommand): ProgressUpdated {
    this.requireTracking(PROGRESS_NOTIFICATIONS_UNAVAILABLE);
    this.requireNotification(command.notificationId);
    this.deps.notifications.updateProgress(command.notificationId, command.update);
    const pct = command.update.pct ?? null;
    return {
      notificationId: command.notificationId,
      pct,
      message: command.update.message ?? null,
      completed: pct === 1
    };
  }

  remove(command: RemoveNotificationCommand): void {
    this.requireTracking(NOTIFICATION_REMOVAL_UNAVAILABLE);
    this.requireNotification(command.notificationId);
    this.deps.notifications.remove(command.notificationId);
  }

  private requireTracking(refusal: string): void {
    if (!this.deps.notifications.tracksNotifications()) {
      throw new CoreFeatureUnavailableError(refusal);
    }
  }

  private requireNotification(notificationId: number): void {
    if (!this.deps.notifications.exists(notificationId)) {
      throw new NotificationNotFoundError(notificationId);
    }
  }
}
