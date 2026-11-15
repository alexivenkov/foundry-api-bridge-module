/** What `get-world-info` reads from `game`. Every part may be missing while the game is still loading. */
export interface FoundryWorldPack {
  collection: string;
  metadata: { label: string; type: string; system?: string | undefined };
  index: { size: number };
}

export interface FoundrySizedCollection {
  size: number;
}

/** A `Module` package of `game.modules` (BasePackage: `id`, `title`, `version`; client `active`). */
export interface FoundryWorldModule {
  id: string;
  title: string;
  version?: string | undefined;
  active: boolean;
}

export interface FoundryWorldUser {
  id: string;
  name: string;
  isGM: boolean;
  active: boolean;
}

export interface FoundryWorldInfoGame {
  world?: { id: string; title: string } | undefined;
  system?: { id: string; version: string } | undefined;
  version?: string | undefined;
  /** A Collection: `forEach` hands over the packages. */
  modules?:
    | {
        get(id: string): { version?: string | undefined } | undefined;
        forEach?(fn: (module: FoundryWorldModule) => void): void;
      }
    | undefined;
  journal?: FoundrySizedCollection | undefined;
  actors?: FoundrySizedCollection | undefined;
  items?: FoundrySizedCollection | undefined;
  /** `Scenes#active`: the scene marked active, if any. */
  scenes?: (FoundrySizedCollection & { active?: { id: string; name: string } | null | undefined }) | undefined;
  packs?: { forEach(fn: (pack: FoundryWorldPack) => void): void } | undefined;
  users?: { forEach(fn: (user: FoundryWorldUser) => void): void } | undefined;
  paused?: boolean | undefined;
  time?: { worldTime?: number | undefined } | undefined;
}

/**
 * The time components `CalendarData#timeToComponents` answers (Foundry 13.351
 * and 14.368): indexes are 0-based, `day` is the day of the year, `season` is
 * undefined when no season matches.
 */
export interface FoundryTimeComponents {
  year: number;
  day: number;
  month: number;
  dayOfMonth: number;
  dayOfWeek: number;
  hour: number;
  minute: number;
  second: number;
  season?: number | undefined;
  leapYear: boolean;
}

interface FoundryCalendarEntry {
  name: string;
  abbreviation?: string | null | undefined;
}

export interface FoundryCalendarMonth extends FoundryCalendarEntry {
  ordinal: number;
  days: number;
  leapDays?: number | null | undefined;
}

export interface FoundryCalendarDay extends FoundryCalendarEntry {
  ordinal: number;
}

export interface FoundryCalendarSeason extends FoundryCalendarEntry {
  monthStart?: number | null | undefined;
  monthEnd?: number | null | undefined;
  dayStart?: number | null | undefined;
  dayEnd?: number | null | undefined;
}

/**
 * `game.time.calendar`, a `CalendarData` instance (Foundry 13+). Its schema has
 * no `isRestDay`, `intercalary` or `dayOffset`: those keys of the config are
 * dropped when the model is built.
 */
export interface FoundryCalendar {
  name: string;
  description?: string | null | undefined;
  years: {
    yearZero: number;
    firstWeekday: number;
    leapYear?: { leapStart: number; leapInterval: number } | null | undefined;
  };
  months?: { values: FoundryCalendarMonth[] } | null | undefined;
  days: {
    values: FoundryCalendarDay[];
    daysPerYear: number;
    hoursPerDay: number;
    minutesPerHour: number;
    secondsPerMinute: number;
  };
  seasons?: { values: FoundryCalendarSeason[] } | null | undefined;
  timeToComponents(time: number): FoundryTimeComponents;
  componentsToTime(components: { year?: number }): number;
  format(time: number): string;
}

export interface FoundryGameTime {
  worldTime: number;
  advance(seconds: number): Promise<number>;
  set(seconds: number): Promise<number>;
  /** Foundry 13+. */
  calendar?: FoundryCalendar | undefined;
}

/** The clock and the pause of a game that is up and running. */
export interface FoundryRunningGame {
  time: FoundryGameTime;
  paused: boolean;
  togglePause(paused: boolean, options?: { broadcast?: boolean }): boolean;
  i18n?: { localize(key: string): string } | undefined;
}
