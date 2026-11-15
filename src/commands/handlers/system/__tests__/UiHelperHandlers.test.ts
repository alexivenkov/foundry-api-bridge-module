import type {
  FoundryGridGame,
  FoundryNotifications,
  FoundryStageGlobals
} from '../../../../core/ui/infrastructure';
import { createCreateProgressNotificationHandler } from '../CreateProgressNotificationHandler';
import { createGetCanvasViewHandler } from '../GetCanvasViewHandler';
import { createMeasureGridPathHandler } from '../MeasureGridPathHandler';
import { createNotifyHandler } from '../NotifyHandler';
import { createRemoveNotificationHandler } from '../RemoveNotificationHandler';
import { createShowScrollingTextHandler } from '../ShowScrollingTextHandler';
import { createSnapToGridHandler } from '../SnapToGridHandler';
import { createUpdateProgressNotificationHandler } from '../UpdateProgressNotificationHandler';

function notificationsV13(): { notifications: FoundryNotifications; live: Set<number>; update: jest.Mock } {
  let nextId = 41;
  const live = new Set<number>();
  const issue = (): { id: number } => {
    const id = nextId++;
    live.add(id);
    return { id };
  };
  const update = jest.fn();
  const notifications: FoundryNotifications = {
    info: jest.fn(issue),
    warn: jest.fn(issue),
    error: jest.fn(issue),
    success: jest.fn(issue),
    update,
    has: (id) => live.has(id),
    remove: (id) => {
      live.delete(id);
    }
  };
  return { notifications, live, update };
}

describe('notification handlers', () => {
  it('notify answers the core id on 13+', async () => {
    const { notifications } = notificationsV13();

    await expect(createNotifyHandler({ ui: () => ({ notifications }) })({ message: 'Hi', permanent: true })).resolves.toEqual({
      shown: true,
      type: 'info',
      notificationId: 41
    });
  });

  it('runs a progress bar from creation to removal', async () => {
    const { notifications, live, update } = notificationsV13();
    const ui = (): { notifications: FoundryNotifications } => ({ notifications });

    const created = await createCreateProgressNotificationHandler({ ui })({ message: 'Importing', pct: 0.2 });
    const updated = await createUpdateProgressNotificationHandler({ ui })({ notificationId: created.notificationId, pct: 1 });
    const removed = await createRemoveNotificationHandler({ ui })({ notificationId: created.notificationId });

    expect(created).toEqual({ notificationId: 41, type: 'info', pct: 0.2 });
    expect(updated).toEqual({ notificationId: 41, pct: 1, message: null, completed: true });
    expect(removed).toEqual({ removed: true, notificationId: 41 });
    expect(update).toHaveBeenLastCalledWith(41, { pct: 1 });
    expect(live.has(41)).toBe(false);
  });

  it('rejects an invalid percentage and an unknown notification', async () => {
    const { notifications } = notificationsV13();
    const ui = (): { notifications: FoundryNotifications } => ({ notifications });

    await expect(createUpdateProgressNotificationHandler({ ui })({ notificationId: 1, pct: 2 })).rejects.toThrow('pct');
    await expect(createRemoveNotificationHandler({ ui })({ notificationId: 99 })).rejects.toThrow('Notification not found: 99');
  });

  it('refuses progress on a core without notification ids', async () => {
    const ui = (): { notifications: FoundryNotifications } => ({
      notifications: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
    });

    await expect(createCreateProgressNotificationHandler({ ui })({ message: 'x' })).rejects.toThrow(
      'Progress notifications require Foundry 13 or newer'
    );
  });
});

describe('grid handlers', () => {
  const measurePath = jest.fn(() => ({
    distance: 10,
    cost: 10,
    spaces: 2,
    diagonals: 0,
    euclidean: 10,
    segments: [{ distance: 10, cost: 10, spaces: 2, diagonals: 0, euclidean: 10 }]
  }));
  const getSnappedPoint = jest.fn(() => ({ x: 100, y: 200 }));
  const scene = { id: 's1', name: 'Crypt', grid: { type: 1, units: 'ft', diagonals: 1, measurePath, getSnappedPoint } };
  const game: FoundryGridGame = { scenes: { get: (id) => (id === 's1' ? scene : undefined), active: scene } };
  const deps = { gameProvider: { getGame: () => game }, generation: () => 13 };

  it('measure-grid-path measures on the active scene', async () => {
    const result = await createMeasureGridPathHandler(deps)({
      waypoints: [
        { x: 50, y: 50, elevation: 0 },
        { x: 50, y: 50, elevation: 10 }
      ]
    });

    expect(result).toEqual({
      sceneId: 's1',
      gridType: 'square',
      units: 'ft',
      diagonalRule: 'exact',
      distance: 10,
      cost: 10,
      spaces: 2,
      diagonals: 0,
      euclidean: 10,
      segments: [{ distance: 10, cost: 10, spaces: 2, diagonals: 0, euclidean: 10 }]
    });
  });

  it('measure-grid-path rejects a single waypoint, an unknown scene and elevation below 13', async () => {
    await expect(createMeasureGridPathHandler(deps)({ waypoints: [{ x: 0, y: 0 }] })).rejects.toThrow('waypoints');
    await expect(
      createMeasureGridPathHandler(deps)({ sceneId: 'nope', waypoints: [{ x: 0, y: 0 }, { x: 1, y: 1 }] })
    ).rejects.toThrow('Scene not found: nope');
    await expect(
      createMeasureGridPathHandler({ ...deps, generation: () => 12 })({ waypoints: [{ x: 0, y: 0, elevation: 5 }, { x: 1, y: 1 }] })
    ).rejects.toThrow('Waypoint elevation requires Foundry 13 or newer');
  });

  it('snap-to-grid snaps with the mode mask', async () => {
    await expect(createSnapToGridHandler(deps)({ sceneId: 's1', x: 130, y: 170, mode: 'vertex' })).resolves.toEqual({
      sceneId: 's1',
      x: 100,
      y: 200
    });
    expect(getSnappedPoint).toHaveBeenLastCalledWith({ x: 130, y: 170 }, { mode: 0xf0, resolution: 1 });
  });

  it('snap-to-grid rejects an unknown mode', async () => {
    await expect(createSnapToGridHandler(deps)({ x: 0, y: 0, mode: 'nearest' as 'center' })).rejects.toThrow('mode');
  });
});

describe('canvas handlers', () => {
  function stage(ready = true): { globals: FoundryStageGlobals; createScrollingText: jest.Mock } {
    const createScrollingText = jest.fn().mockResolvedValue(undefined);
    const globals: FoundryStageGlobals = {
      canvas: {
        ready,
        scene: { id: 's1', name: 'Crypt' },
        stage: { pivot: { x: 500, y: 400 }, scale: { x: 2 } },
        screenDimensions: [1000, 800],
        interface: { createScrollingText }
      },
      game: { settings: { get: () => true } }
    };
    return { globals, createScrollingText };
  }

  it('get-canvas-view reads the GM view', async () => {
    const { globals } = stage();

    await expect(createGetCanvasViewHandler({ globals: () => globals, generation: () => 13 })({})).resolves.toEqual({
      sceneId: 's1',
      sceneName: 'Crypt',
      x: 500,
      y: 400,
      scale: 2,
      visibleArea: { x: 250, y: 200, width: 500, height: 400 }
    });
  });

  it('get-canvas-view adds the level on 14+', async () => {
    const { globals } = stage();

    const result = await createGetCanvasViewHandler({ globals: () => globals, generation: () => 14 })({});

    expect(result.levelId).toBeNull();
  });

  it('show-scrolling-text draws on the GM canvas', async () => {
    const { globals, createScrollingText } = stage();

    const result = await createShowScrollingTextHandler({ globals: () => globals })({ x: 10, y: 20, text: '-5', color: '#f00' });

    expect(result).toEqual({ shown: true, sceneId: 's1', x: 10, y: 20 });
    expect(createScrollingText).toHaveBeenCalledWith({ x: 10, y: 20 }, '-5', { fill: '#ff0000' });
  });

  it('both refuse while no scene is drawn, and text is validated', async () => {
    const { globals } = stage(false);

    await expect(createGetCanvasViewHandler({ globals: () => globals })({})).rejects.toThrow('Canvas is not ready');
    await expect(createShowScrollingTextHandler({ globals: () => globals })({ x: 0, y: 0, text: 'x' })).rejects.toThrow(
      'Canvas is not ready'
    );
    await expect(createShowScrollingTextHandler({ globals: () => stage().globals })({ x: 0, y: 0, text: '' })).rejects.toThrow(
      'text'
    );
  });
});
