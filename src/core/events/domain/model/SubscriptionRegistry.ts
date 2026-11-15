import { EventSelection } from './EventSelection';
import type { GameEventName } from './eventPayloads';

/** Which channel listens to which events. A channel with an empty selection is not kept. */
export class SubscriptionRegistry {
  private readonly selections = new Map<string, EventSelection>();

  selectionOf(channel: string): EventSelection {
    return this.selections.get(channel) ?? EventSelection.NONE;
  }

  replace(channel: string, selection: EventSelection): void {
    if (selection.isEmpty) {
      this.selections.delete(channel);
    } else {
      this.selections.set(channel, selection);
    }
  }

  drop(channel: string): void {
    this.selections.delete(channel);
  }

  channelsFor(name: GameEventName): string[] {
    return [...this.selections].filter(([, selection]) => selection.includes(name)).map(([channel]) => channel);
  }

  /** The union of every channel's events: what the event source has to produce. */
  wantedEvents(): ReadonlySet<GameEventName> {
    return new Set([...this.selections.values()].flatMap((selection) => selection.eventNames()));
  }
}
