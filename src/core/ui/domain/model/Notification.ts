export const NOTIFICATION_LEVELS = ['info', 'warn', 'error', 'success'] as const;
export type NotificationLevel = (typeof NOTIFICATION_LEVELS)[number];

/** A toast shown to the GM whose client runs the module. */
export interface UiNotification {
  readonly message: string;
  readonly level: NotificationLevel;
  /** Stays until dismissed. Omitted, the UI decides. */
  readonly permanent?: boolean | undefined;
  /** Also logged to the browser console. Omitted, the core logs it. */
  readonly console?: boolean | undefined;
}

/** A notification as the UI took it: the level it used and the id it gave (null where the core gives none). */
export interface ShownNotification {
  readonly level: NotificationLevel;
  readonly id: number | null;
}

export interface ProgressNotification extends UiNotification {
  /** 0–1; omitted, the bar starts empty. */
  readonly pct?: number | undefined;
}

export interface ProgressUpdate {
  readonly message?: string | undefined;
  readonly pct?: number | undefined;
}
