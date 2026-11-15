import { NotificationsUnavailableError } from '../../domain';
import { FoundryNotificationCenter } from '../FoundryNotificationCenter';
import type { FoundryNotifications } from '../foundryUiTypes';
import { readUi } from '../uiGlobals';

interface ToastMocks {
  notifications: FoundryNotifications;
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  success: jest.Mock;
}

function toastUi(withSuccess = true): ToastMocks {
  const info = jest.fn();
  const warn = jest.fn();
  const error = jest.fn();
  const success = jest.fn();
  const notifications: FoundryNotifications = withSuccess ? { info, warn, error, success } : { info, warn, error };
  return { notifications, info, warn, error, success };
}

interface Mocks {
  notifications: FoundryNotifications;
  info: jest.Mock;
  warn: jest.Mock;
  success: jest.Mock;
  update: jest.Mock;
  has: jest.Mock;
  remove: jest.Mock;
}

// `Notifications#notify` of 13.351 / 14.368 answers the queued Notification, whose `id` the other methods take.
function v13(): Mocks {
  let nextId = 1;
  const issue = (): { id: number } => ({ id: nextId++ });
  const info = jest.fn(issue);
  const warn = jest.fn(issue);
  const success = jest.fn(issue);
  const update = jest.fn();
  const has = jest.fn((id: number) => id === 1);
  const remove = jest.fn();
  return {
    notifications: { info, warn, error: jest.fn(issue), success, update, has, remove },
    info,
    warn,
    success,
    update,
    has,
    remove
  };
}

function centerOver(notifications: FoundryNotifications): FoundryNotificationCenter {
  return new FoundryNotificationCenter(() => ({ notifications }));
}

describe('FoundryNotificationCenter', () => {
  describe('show', () => {
    it.each(['info', 'warn', 'error', 'success'] as const)('shows a %s notification with the method of that name', (level) => {
      const ui = toastUi();

      const shown = centerOver(ui.notifications).show({ message: 'hello', level });

      expect(shown).toEqual({ level, id: null });
      expect(ui[level]).toHaveBeenCalledTimes(1);
      expect(ui[level]).toHaveBeenCalledWith('hello', {});
      const others = (['info', 'warn', 'error', 'success'] as const).filter((name) => name !== level);
      for (const other of others) {
        expect(ui[other]).not.toHaveBeenCalled();
      }
    });

    it('shows a success as plain info on a core that has no success toast, and says so', () => {
      const ui = toastUi(false);

      const shown = centerOver(ui.notifications).show({ message: 'yay', level: 'success' });

      expect(ui.info).toHaveBeenCalledWith('yay', {});
      expect(shown.level).toBe('info');
    });

    it('answers success only where the success toast exists', () => {
      const ui = toastUi(true);

      expect(centerOver(ui.notifications).show({ message: 'yay', level: 'success' }).level).toBe('success');
      expect(ui.success).toHaveBeenCalledWith('yay', {});
      expect(ui.info).not.toHaveBeenCalled();
    });

    it.each([true, false])('passes permanent: %s on', (permanent) => {
      const ui = toastUi();

      centerOver(ui.notifications).show({ message: 'sticky', level: 'error', permanent });

      expect(ui.error).toHaveBeenCalledWith('sticky', { permanent });
    });

    it('gives the options no key that is not set, undefined included', () => {
      const ui = toastUi();

      centerOver(ui.notifications).show({ message: 'plain', level: 'info', permanent: undefined, console: undefined });

      expect(Object.keys((ui.info.mock.calls as unknown[][])[0]?.[1] as object)).toEqual([]);
    });

    it('calls the methods on the notifications object itself', () => {
      const seen: unknown[] = [];
      const notifications: FoundryNotifications = {
        info(this: unknown) {
          seen.push(this);
        },
        warn: jest.fn(),
        error: jest.fn()
      };

      centerOver(notifications).show({ message: 'bound', level: 'success' });
      centerOver(notifications).show({ message: 'bound', level: 'info' });

      expect(seen).toEqual([notifications, notifications]);
    });

    describe('by default', () => {
      afterEach(() => {
        delete (globalThis as Record<string, unknown>)['ui'];
      });

      it('shows through the ui global, read when the notification is shown', () => {
        const center = new FoundryNotificationCenter();
        const ui = toastUi();
        (globalThis as Record<string, unknown>)['ui'] = { notifications: ui.notifications, sidebar: {} };

        center.show({ message: 'late', level: 'warn' });

        expect(ui.warn).toHaveBeenCalledWith('late', {});
        expect(readUi()).toEqual({ notifications: ui.notifications });
      });

      it.each([
        ['there is no ui', undefined],
        ['the ui has no notifications yet', {}]
      ])('is not available while %s', (_case, ui) => {
        if (ui !== undefined) {
          (globalThis as Record<string, unknown>)['ui'] = ui;
        }
        const act = (): void => {
          new FoundryNotificationCenter().show({ message: 'early', level: 'info' });
        };

        expect(act).toThrow(NotificationsUnavailableError);
        expect(act).toThrow('UI notifications not available');
      });
    });
  });

  it('shows a toast with only the options that are set and answers its id', () => {
    const { notifications, warn } = v13();

    expect(centerOver(notifications).show({ message: 'careful', level: 'warn', console: false })).toEqual({
      level: 'warn',
      id: 1
    });
    expect(warn).toHaveBeenCalledWith('careful', { console: false });
  });

  it('never asks the core to localize or skip cleaning', () => {
    const { notifications, info } = v13();

    centerOver(notifications).show({ message: 'COMBAT.Begin', level: 'info', permanent: true });

    expect(info).toHaveBeenCalledWith('COMBAT.Begin', { permanent: true });
  });

  it('answers no id where the core returns none (before 13)', () => {
    const info = jest.fn();
    const center = centerOver({ info, warn: jest.fn(), error: jest.fn() });

    expect(center.show({ message: 'old', level: 'success' })).toEqual({ level: 'info', id: null });
    expect(center.tracksNotifications()).toBe(false);
  });

  it('tracks notifications where update, has and remove exist', () => {
    expect(centerOver(v13().notifications).tracksNotifications()).toBe(true);
  });

  it('starts a progress bar and moves it to the starting percentage', () => {
    const { notifications, success, update } = v13();

    const shown = centerOver(notifications).startProgress({ message: 'Importing', level: 'success', pct: 0.4, permanent: true });

    expect(shown).toEqual({ level: 'success', id: 1 });
    expect(success).toHaveBeenCalledWith('Importing', { permanent: true, progress: true });
    expect(update).toHaveBeenCalledWith(1, { pct: 0.4 });
  });

  it('leaves a new bar empty when no percentage is given', () => {
    const { notifications, update } = v13();

    centerOver(notifications).startProgress({ message: 'Importing', level: 'info' });

    expect(update).not.toHaveBeenCalled();
  });

  it('updates, checks and removes by id', () => {
    const { notifications, update, has, remove } = v13();
    const center = centerOver(notifications);

    center.updateProgress(1, { message: 'Done', pct: 1 });
    center.updateProgress(1, { pct: 0.5 });
    center.remove(1);

    expect(update).toHaveBeenNthCalledWith(1, 1, { message: 'Done', pct: 1 });
    expect(update).toHaveBeenNthCalledWith(2, 1, { pct: 0.5 });
    expect(center.exists(1)).toBe(true);
    expect(center.exists(2)).toBe(false);
    expect(has).toHaveBeenCalledWith(2);
    expect(remove).toHaveBeenCalledWith(1);
  });
});
