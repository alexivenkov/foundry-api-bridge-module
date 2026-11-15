import type {
  EventClock,
  EventScheduler,
  EventSink,
  EventTimer,
  GameEventListener,
  GameEventName,
  GameEventSource,
  QueuedEvent
} from '../../domain';

interface Task {
  readonly at: number;
  readonly order: number;
  readonly callback: () => void;
  cancelled: boolean;
}

/** A clock and timers under the test's control: nothing runs until `advance`. */
export class FakeTimeline implements EventScheduler, EventClock {
  private time = 1_000_000;
  private order = 0;
  private tasks: Task[] = [];

  now(): number {
    return this.time;
  }

  schedule(callback: () => void, delayMs: number): EventTimer {
    const task: Task = { at: this.time + delayMs, order: this.order++, callback, cancelled: false };
    this.tasks.push(task);
    return {
      cancel(): void {
        task.cancelled = true;
      }
    };
  }

  advance(ms: number): void {
    const end = this.time + ms;
    for (;;) {
      const due = this.tasks
        .filter((task) => !task.cancelled && task.at <= end)
        .sort((a, b) => a.at - b.at || a.order - b.order)[0];
      if (due === undefined) {
        break;
      }
      this.tasks = this.tasks.filter((task) => task !== due);
      this.time = due.at;
      due.callback();
    }
    this.time = end;
  }

  get pendingTimers(): number {
    return this.tasks.filter((task) => !task.cancelled).length;
  }
}

export class FakeSink implements EventSink {
  readonly sent: Array<{ channel: string; event: QueuedEvent }> = [];
  readonly open = new Set<string>(['MCP', 'API']);
  failing = false;

  isOpen(channel: string): boolean {
    return this.open.has(channel);
  }

  send(channel: string, event: QueuedEvent): boolean {
    if (this.failing) {
      throw new Error('socket gone');
    }
    this.sent.push({ channel, event });
    return true;
  }

  sentTo(channel: string): QueuedEvent[] {
    return this.sent.filter((entry) => entry.channel === channel).map((entry) => entry.event);
  }
}

export class FakeSource implements GameEventSource {
  watched: ReadonlySet<GameEventName> = new Set();
  listener: GameEventListener | null = null;
  calls = 0;

  watch(events: ReadonlySet<GameEventName>, listener: GameEventListener): void {
    this.watched = events;
    this.listener = listener;
    this.calls += 1;
  }
}
