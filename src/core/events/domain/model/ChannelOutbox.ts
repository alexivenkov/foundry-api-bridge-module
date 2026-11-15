import type { PublishedEvent, QueuedEvent } from './GameEvent';

/**
 * The events waiting to be sent on one channel. Bounded: when full, the
 * oldest event is dropped and counted. Every queued event gets the next
 * sequence number, so a dropped one leaves a gap the receiver can see.
 */
export class ChannelOutbox {
  private readonly queue: QueuedEvent[] = [];
  private seq = 0;
  private droppedCount = 0;

  constructor(private readonly capacity: number) {}

  enqueue(event: PublishedEvent): QueuedEvent {
    this.seq += 1;
    const queued: QueuedEvent = { ...event, seq: this.seq };
    this.queue.push(queued);
    while (this.queue.length > this.capacity) {
      this.queue.shift();
      this.droppedCount += 1;
    }
    return queued;
  }

  take(max: number): QueuedEvent[] {
    return this.queue.splice(0, max);
  }

  /** An event that was taken but could not be sent. */
  recordLost(): void {
    this.droppedCount += 1;
  }

  get size(): number {
    return this.queue.length;
  }

  get dropped(): number {
    return this.droppedCount;
  }

  get lastSeq(): number {
    return this.seq;
  }
}
