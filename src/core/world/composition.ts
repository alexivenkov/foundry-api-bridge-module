import { globalGameProvider } from '@/core/shared';
import {
  CalendarService,
  GamePauseService,
  WorldInfoService,
  WorldSessionService,
  WorldTimeService
} from './application';
import {
  FoundryGamePause,
  FoundryWorldCalendar,
  FoundryWorldClock,
  FoundryWorldInspector,
  FoundryWorldSessionInspector,
  runningGameProvider,
  type FoundryWorldInfoGame,
  type RunningGameProvider,
  type WorldInfoGameProvider
} from './infrastructure';

export const defaultWorldInfoGameProvider: WorldInfoGameProvider = globalGameProvider<FoundryWorldInfoGame>();

// Composition root of the context. Handlers pass a custom provider only in tests.

export function createFoundryWorldInfoService(
  gameProvider: WorldInfoGameProvider = defaultWorldInfoGameProvider
): WorldInfoService {
  return new WorldInfoService({ world: new FoundryWorldInspector(gameProvider) });
}

export function createFoundryWorldSessionService(
  gameProvider: WorldInfoGameProvider = defaultWorldInfoGameProvider
): WorldSessionService {
  return new WorldSessionService({ session: new FoundryWorldSessionInspector(gameProvider) });
}

export function createFoundryWorldTimeService(
  gameProvider: RunningGameProvider = runningGameProvider
): WorldTimeService {
  return new WorldTimeService({
    clock: new FoundryWorldClock(gameProvider),
    calendar: new FoundryWorldCalendar(gameProvider)
  });
}

export function createFoundryCalendarService(gameProvider: RunningGameProvider = runningGameProvider): CalendarService {
  return new CalendarService({
    clock: new FoundryWorldClock(gameProvider),
    calendar: new FoundryWorldCalendar(gameProvider)
  });
}

export function createFoundryGamePauseService(
  gameProvider: RunningGameProvider = runningGameProvider
): GamePauseService {
  return new GamePauseService({ pause: new FoundryGamePause(gameProvider) });
}
