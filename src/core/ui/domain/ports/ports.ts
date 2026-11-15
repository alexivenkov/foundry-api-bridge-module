import type { CanvasPan, CanvasPing } from '@/core/ui/domain/model/CanvasView';
import type { CanvasViewState, ScrollingText } from '@/core/ui/domain/model/CanvasStage';
import type {
  GridPathMeasurement,
  GridSnapping,
  GridWaypoint,
  SceneGrid,
  ScenePoint
} from '@/core/ui/domain/model/Grid';
import type {
  ProgressNotification,
  ProgressUpdate,
  ShownNotification,
  UiNotification
} from '@/core/ui/domain/model/Notification';

/**
 * The notifications of the GM's client, with the ids and progress bars of
 * Foundry 13+. Throws `NotificationsUnavailableError` while the UI is not up.
 */
export interface NotificationCenter {
  /** Answers the level the notification was shown at (a UI without a success toast shows plain info) and its id. */
  show(notification: UiNotification): ShownNotification;
  /** Whether notifications carry ids that can be updated and removed (13+). */
  tracksNotifications(): boolean;
  /** Only when notifications are tracked: the id is never null then. */
  startProgress(progress: ProgressNotification): ShownNotification;
  /** Shown or still queued. */
  exists(notificationId: number): boolean;
  updateProgress(notificationId: number, update: ProgressUpdate): void;
  remove(notificationId: number): void;
}

/** The canvas of the GM's client. Throws `CanvasUnavailableError` while there is none. */
export interface CanvasViewport {
  pan(pan: CanvasPan): Promise<void>;
  /** Resolves to false when the canvas refused the ping, as it does for a point outside the scene. */
  ping(ping: CanvasPing): Promise<boolean>;
}

/** The grid of a scene document, which exists without a drawn canvas. */
export interface SceneGrids {
  supportsMeasurement(): boolean;
  supportsElevation(): boolean;
  /** Null when there is no such scene. */
  describe(sceneId: string): SceneGrid | null;
  measurePath(sceneId: string, waypoints: readonly GridWaypoint[]): GridPathMeasurement;
  snapPoint(sceneId: string, point: ScenePoint, snapping: GridSnapping): ScenePoint;
}

/** What the GM's canvas shows. Every method but `isReady` assumes a drawn scene. */
export interface CanvasStage {
  isReady(): boolean;
  view(): CanvasViewState;
  /** Starts the animation without waiting for it; false when the world turned scrolling text off. */
  showScrollingText(text: ScrollingText): boolean;
}
