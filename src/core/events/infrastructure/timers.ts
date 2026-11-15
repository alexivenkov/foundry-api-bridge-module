import type { EventClock, EventScheduler } from '@/core/events/domain';

export const timerScheduler: EventScheduler = {
  schedule(callback: () => void, delayMs: number) {
    const handle = setTimeout(callback, delayMs);
    return {
      cancel(): void {
        clearTimeout(handle);
      }
    };
  }
};

export const systemClock: EventClock = {
  now(): number {
    return Date.now();
  }
};
