import { DomainError } from '@/kernel';

/** Subscriptions belong to a connection; a command that came without one cannot hold any. */
export class EventChannelRequiredError extends DomainError {
  constructor() {
    super('Event subscriptions need a server connection: send this command over the MCP or API channel');
    this.name = 'EventChannelRequiredError';
    Object.setPrototypeOf(this, EventChannelRequiredError.prototype);
  }
}
