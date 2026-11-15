import { DomainError } from '@/kernel';

export class NotificationsUnavailableError extends DomainError {
  constructor() {
    super('UI notifications not available');
    this.name = 'NotificationsUnavailableError';
    Object.setPrototypeOf(this, NotificationsUnavailableError.prototype);
  }
}

export class CanvasUnavailableError extends DomainError {
  constructor() {
    super('Canvas not available');
    this.name = 'CanvasUnavailableError';
    Object.setPrototypeOf(this, CanvasUnavailableError.prototype);
  }
}

/** Gone already: closed by the GM, timed out, or a progress bar that reached 100 %. */
export class NotificationNotFoundError extends DomainError {
  constructor(public readonly notificationId: number) {
    super(`Notification not found: ${String(notificationId)}`);
    this.name = 'NotificationNotFoundError';
    Object.setPrototypeOf(this, NotificationNotFoundError.prototype);
  }
}

export class CanvasNotReadyError extends DomainError {
  constructor() {
    super('Canvas is not ready: no scene is drawn on the GM client');
    this.name = 'CanvasNotReadyError';
    Object.setPrototypeOf(this, CanvasNotReadyError.prototype);
  }
}

/** Whole wire texts of the version refusals (`CoreFeatureUnavailableError`). */
export const PROGRESS_NOTIFICATIONS_UNAVAILABLE = 'Progress notifications require Foundry 13 or newer';
export const NOTIFICATION_REMOVAL_UNAVAILABLE = 'Removing a notification requires Foundry 13 or newer';
export const GRID_MEASUREMENT_UNAVAILABLE = 'Grid measurement and snapping require Foundry 12 or newer';
export const WAYPOINT_ELEVATION_UNAVAILABLE = 'Waypoint elevation requires Foundry 13 or newer';
