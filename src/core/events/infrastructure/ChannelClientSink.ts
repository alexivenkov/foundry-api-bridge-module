import type { EventSink, QueuedEvent } from '@/core/events/domain';

/** The event envelope on the wire (the `EventMessage` the transport sends). */
export interface EventChannelMessage {
  type: 'event';
  event: string;
  data: Record<string, unknown>;
  ts: number;
  seq: number;
}

/** What the sink needs from a connection; the transport's WebSocket client fits it. */
export interface EventChannelClient {
  isConnected(): boolean;
  /** False when the message was not sent (the socket is not open). */
  sendEvent(message: EventChannelMessage): boolean;
}

/** Sends events through the module's connections, by channel label (`MCP`, `API`). */
export class ChannelClientSink implements EventSink {
  private readonly clients = new Map<string, EventChannelClient>();

  attach(channel: string, client: EventChannelClient): void {
    this.clients.set(channel, client);
  }

  detach(channel: string): void {
    this.clients.delete(channel);
  }

  isOpen(channel: string): boolean {
    return this.clients.get(channel)?.isConnected() ?? false;
  }

  send(channel: string, event: QueuedEvent): boolean {
    const client = this.clients.get(channel);
    if (client === undefined) {
      return false;
    }
    return client.sendEvent({ type: 'event', event: event.name, data: event.data, ts: event.ts, seq: event.seq });
  }
}
