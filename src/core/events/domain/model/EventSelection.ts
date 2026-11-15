import { EVENT_NAMES } from './eventCatalogue';
import type { GameEventName } from './eventPayloads';

export const ALL_EVENTS = '*';
export type EventSelector = GameEventName | typeof ALL_EVENTS;

/** The events one channel asked for: everything (`*`) or a set of names. Immutable. */
export class EventSelection {
  static readonly NONE = new EventSelection(false, new Set());

  private constructor(
    private readonly all: boolean,
    private readonly names: ReadonlySet<GameEventName>
  ) {}

  static of(selectors: readonly EventSelector[]): EventSelection {
    return EventSelection.NONE.with(selectors);
  }

  get isEmpty(): boolean {
    return !this.all && this.names.size === 0;
  }

  includes(name: GameEventName): boolean {
    return this.all || this.names.has(name);
  }

  with(selectors: readonly EventSelector[]): EventSelection {
    if (this.all || selectors.includes(ALL_EVENTS)) {
      return new EventSelection(true, new Set());
    }
    return new EventSelection(false, new Set([...this.names, ...(selectors as readonly GameEventName[])]));
  }

  /** Absent selectors, or `*` among them, remove everything. Removing a name from `*` leaves every other name. */
  without(selectors: readonly EventSelector[] | undefined): EventSelection {
    if (selectors === undefined || selectors.includes(ALL_EVENTS)) {
      return EventSelection.NONE;
    }
    const removed = new Set(selectors as readonly GameEventName[]);
    const remaining = this.eventNames().filter((name) => !removed.has(name));
    return new EventSelection(false, new Set(remaining));
  }

  /** Every selected event name, in catalogue order. */
  eventNames(): GameEventName[] {
    return EVENT_NAMES.filter((name) => this.includes(name));
  }

  /** `['*']` for everything, else the names in catalogue order. */
  toSelectors(): EventSelector[] {
    return this.all ? [ALL_EVENTS] : this.eventNames();
  }
}
