import { CoreFeatureUnavailableError, type SceneIdentity, type SceneLocator } from '../../../shared';
import {
  CanvasNotReadyError,
  NotificationNotFoundError,
  type CanvasStage,
  type CanvasViewState,
  type GridPathMeasurement,
  type GridSnapping,
  type GridWaypoint,
  type NotificationCenter,
  type NotificationLevel,
  type ProgressNotification,
  type ProgressUpdate,
  type SceneGrid,
  type SceneGrids,
  type ScenePoint,
  type ScrollingText,
  type ShownNotification,
  type UiNotification
} from '../../domain';
import { CanvasStageService } from '../CanvasStageService';
import { GridService } from '../GridService';
import { NotificationCenterService } from '../NotificationCenterService';

class FakeNotificationCenter implements NotificationCenter {
  tracked = true;
  readonly live = new Set<number>([7]);
  readonly calls: string[] = [];
  readonly shown: UiNotification[] = [];
  /** The level this UI shows a success at: plain info on a core without a success toast. */
  successShownAs: NotificationLevel = 'success';

  show(notification: UiNotification): ShownNotification {
    this.shown.push(notification);
    const level = notification.level === 'success' ? this.successShownAs : notification.level;
    return { level, id: this.tracked ? 1 : null };
  }

  tracksNotifications(): boolean {
    return this.tracked;
  }

  startProgress(progress: ProgressNotification): ShownNotification {
    this.calls.push(`progress:${progress.message}`);
    return { level: progress.level, id: 9 };
  }

  exists(notificationId: number): boolean {
    return this.live.has(notificationId);
  }

  updateProgress(notificationId: number, update: ProgressUpdate): void {
    this.calls.push(`update:${String(notificationId)}:${JSON.stringify(update)}`);
  }

  remove(notificationId: number): void {
    this.calls.push(`remove:${String(notificationId)}`);
  }
}

describe('NotificationCenterService', () => {
  function setup(): { center: FakeNotificationCenter; service: NotificationCenterService } {
    const center = new FakeNotificationCenter();
    return { center, service: new NotificationCenterService({ notifications: center }) };
  }

  it('shows a notification and passes the id on', () => {
    const { service } = setup();

    expect(service.show({ notification: { message: 'hi', level: 'warn' } })).toEqual({ level: 'warn', id: 1 });
  });

  it('shows the notification as it was asked for', () => {
    const { center, service } = setup();
    const notification = { message: 'Roll for initiative', level: 'warn' as const, permanent: true };

    service.show({ notification });

    expect(center.shown).toEqual([notification]);
  });

  it.each(['info', 'warn', 'error', 'success'] as const)('answers %s for a notification shown at that level', (level) => {
    expect(setup().service.show({ notification: { message: 'm', level } }).level).toBe(level);
  });

  it('answers the level the UI really used, not the one asked for', () => {
    const { center, service } = setup();
    center.successShownAs = 'info';

    const shown = service.show({ notification: { message: 'yay', level: 'success' } });

    expect(shown.level).toBe('info');
    expect(center.shown).toEqual([{ message: 'yay', level: 'success' }]);
  });

  it('starts a progress bar at the given percentage', () => {
    const { center, service } = setup();

    expect(service.startProgress({ progress: { message: 'Loading', level: 'info', pct: 0.25 } })).toEqual({
      notificationId: 9,
      level: 'info',
      pct: 0.25
    });
    expect(center.calls).toEqual(['progress:Loading']);
  });

  it('updates a live progress bar and says when it completed', () => {
    const { center, service } = setup();

    expect(service.updateProgress({ notificationId: 7, update: { pct: 1 } })).toEqual({
      notificationId: 7,
      pct: 1,
      message: null,
      completed: true
    });
    expect(service.updateProgress({ notificationId: 7, update: { message: 'Half', pct: 0.5 } }).completed).toBe(false);
    expect(center.calls).toEqual(['update:7:{"pct":1}', 'update:7:{"message":"Half","pct":0.5}']);
  });

  it('refuses a notification that is gone', () => {
    const { center, service } = setup();

    expect(() => service.updateProgress({ notificationId: 3, update: { pct: 0.5 } })).toThrow(new NotificationNotFoundError(3));
    expect(() => {
      service.remove({ notificationId: 3 });
    }).toThrow('Notification not found: 3');
    expect(center.calls).toEqual([]);
  });

  it('removes a live notification', () => {
    const { center, service } = setup();

    service.remove({ notificationId: 7 });

    expect(center.calls).toEqual(['remove:7']);
  });

  it('refuses progress and removal below Foundry 13, but still shows a toast', () => {
    const { center, service } = setup();
    center.tracked = false;

    expect(() => service.startProgress({ progress: { message: 'x', level: 'info' } })).toThrow(
      new CoreFeatureUnavailableError('Progress notifications require Foundry 13 or newer')
    );
    expect(() => service.updateProgress({ notificationId: 7, update: { pct: 1 } })).toThrow('Foundry 13');
    expect(() => {
      service.remove({ notificationId: 7 });
    }).toThrow('Removing a notification requires Foundry 13 or newer');
    expect(service.show({ notification: { message: 'still', level: 'info' } })).toEqual({ level: 'info', id: null });
  });
});

class FakeScenes implements SceneLocator {
  readonly scenes: SceneIdentity[] = [
    { id: 'active', name: 'Active' },
    { id: 'other', name: 'Other' }
  ];
  activeId: string | null = 'active';

  findScene(sceneId: string): SceneIdentity | null {
    return this.scenes.find((scene) => scene.id === sceneId) ?? null;
  }

  findActiveScene(): SceneIdentity | null {
    return this.activeId === null ? null : this.findScene(this.activeId);
  }
}

class FakeGrids implements SceneGrids {
  generation = 13;
  readonly measured: { sceneId: string; waypoints: readonly GridWaypoint[] }[] = [];
  readonly snapped: { sceneId: string; point: ScenePoint; snapping: GridSnapping }[] = [];
  missing = false;

  supportsMeasurement(): boolean {
    return this.generation >= 12;
  }

  supportsElevation(): boolean {
    return this.generation >= 13;
  }

  describe(): SceneGrid | null {
    return this.missing ? null : { type: 'square', units: 'ft', diagonalRule: 'alternating1' };
  }

  measurePath(sceneId: string, waypoints: readonly GridWaypoint[]): GridPathMeasurement {
    this.measured.push({ sceneId, waypoints });
    return { distance: 25, cost: 25, spaces: 4, diagonals: 3, euclidean: 26.2, segments: [] };
  }

  snapPoint(sceneId: string, point: ScenePoint, snapping: GridSnapping): ScenePoint {
    this.snapped.push({ sceneId, point, snapping });
    return { x: 150, y: 150 };
  }
}

describe('GridService', () => {
  function setup(): { scenes: FakeScenes; grids: FakeGrids; service: GridService } {
    const scenes = new FakeScenes();
    const grids = new FakeGrids();
    return { scenes, grids, service: new GridService({ scenes, grids }) };
  }

  const path = [
    { x: 50, y: 50 },
    { x: 350, y: 350 }
  ];

  it('measures on the active scene by default', () => {
    const { grids, service } = setup();

    const result = service.measurePath({ sceneId: undefined, waypoints: path });

    expect(result).toEqual({
      sceneId: 'active',
      grid: { type: 'square', units: 'ft', diagonalRule: 'alternating1' },
      measurement: { distance: 25, cost: 25, spaces: 4, diagonals: 3, euclidean: 26.2, segments: [] }
    });
    expect(grids.measured).toEqual([{ sceneId: 'active', waypoints: path }]);
  });

  it('measures on a named scene and snaps there', () => {
    const { grids, service } = setup();
    const snapping = { modes: ['center' as const], resolution: 1 };

    expect(service.measurePath({ sceneId: 'other', waypoints: path }).sceneId).toBe('other');
    expect(service.snapToGrid({ sceneId: 'other', point: { x: 130, y: 170 }, snapping })).toEqual({
      sceneId: 'other',
      point: { x: 150, y: 150 }
    });
    expect(grids.snapped).toEqual([{ sceneId: 'other', point: { x: 130, y: 170 }, snapping }]);
  });

  it('answers the canonical scene errors', () => {
    const { scenes, service } = setup();

    expect(() => service.measurePath({ sceneId: 'nope', waypoints: path })).toThrow('Scene not found: nope');
    scenes.activeId = null;
    expect(() => service.measurePath({ sceneId: undefined, waypoints: path })).toThrow('No active scene; specify sceneId');
  });

  it('reads a scene that vanished before its grid as not found', () => {
    const { grids, service } = setup();
    grids.missing = true;

    expect(() => service.snapToGrid({ sceneId: 'other', point: { x: 0, y: 0 }, snapping: { modes: ['vertex'], resolution: 1 } })).toThrow(
      'Scene not found: other'
    );
  });

  it('refuses below Foundry 12, and elevation below 13', () => {
    const { grids, service } = setup();
    grids.generation = 12;

    expect(() => service.measurePath({ sceneId: undefined, waypoints: [{ x: 0, y: 0, elevation: 5 }, { x: 1, y: 1 }] })).toThrow(
      'Waypoint elevation requires Foundry 13 or newer'
    );
    expect(service.measurePath({ sceneId: undefined, waypoints: path }).sceneId).toBe('active');

    grids.generation = 11;
    expect(() => service.measurePath({ sceneId: undefined, waypoints: path })).toThrow(
      new CoreFeatureUnavailableError('Grid measurement and snapping require Foundry 12 or newer')
    );
    expect(() => service.snapToGrid({ sceneId: undefined, point: { x: 0, y: 0 }, snapping: { modes: ['center'], resolution: 1 } })).toThrow(
      CoreFeatureUnavailableError
    );
  });
});

class FakeStage implements CanvasStage {
  ready = true;
  textShown = true;
  readonly texts: ScrollingText[] = [];

  isReady(): boolean {
    return this.ready;
  }

  view(): CanvasViewState {
    return {
      sceneId: 's1',
      sceneName: 'Crypt',
      center: { x: 500, y: 400 },
      scale: 1,
      visibleArea: { x: 0, y: 0, width: 1000, height: 800 }
    };
  }

  showScrollingText(text: ScrollingText): boolean {
    this.texts.push(text);
    return this.textShown;
  }
}

describe('CanvasStageService', () => {
  it('reads the view of a drawn canvas', () => {
    expect(new CanvasStageService({ stage: new FakeStage() }).getView().sceneId).toBe('s1');
  });

  it('shows scrolling text and says whether the world lets it show', () => {
    const stage = new FakeStage();
    const service = new CanvasStageService({ stage });
    const text = { origin: { x: 1, y: 2 }, text: 'Crit!' };

    expect(service.showScrollingText({ text })).toEqual({ shown: true, sceneId: 's1' });
    stage.textShown = false;
    expect(service.showScrollingText({ text })).toEqual({ shown: false, sceneId: 's1' });
    expect(stage.texts).toEqual([text, text]);
  });

  it('refuses both while no scene is drawn', () => {
    const stage = new FakeStage();
    stage.ready = false;
    const service = new CanvasStageService({ stage });

    expect(() => service.getView()).toThrow(new CanvasNotReadyError());
    expect(() => service.showScrollingText({ text: { origin: { x: 0, y: 0 }, text: 'x' } })).toThrow(
      'Canvas is not ready: no scene is drawn on the GM client'
    );
    expect(stage.texts).toEqual([]);
  });
});
