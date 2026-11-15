import type {
  CanvasPan,
  CanvasPing,
  GridSnapping,
  GridWaypoint,
  ProgressNotification,
  ProgressUpdate,
  ScenePoint,
  ScrollingText,
  UiNotification
} from '@/core/ui/domain';

export interface NotifyCommand {
  readonly notification: UiNotification;
}

export interface PanCanvasCommand {
  readonly pan: CanvasPan;
}

export interface PingLocationCommand {
  readonly ping: CanvasPing;
}

export interface StartProgressCommand {
  readonly progress: ProgressNotification;
}

export interface UpdateProgressCommand {
  readonly notificationId: number;
  readonly update: ProgressUpdate;
}

export interface RemoveNotificationCommand {
  readonly notificationId: number;
}

export interface MeasureGridPathCommand {
  /** Undefined = the active scene. */
  readonly sceneId: string | undefined;
  readonly waypoints: readonly GridWaypoint[];
}

export interface SnapToGridCommand {
  readonly sceneId: string | undefined;
  readonly point: ScenePoint;
  readonly snapping: GridSnapping;
}

export interface ShowScrollingTextCommand {
  readonly text: ScrollingText;
}
