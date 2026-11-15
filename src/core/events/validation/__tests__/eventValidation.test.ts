import { parseRequest } from '../../../shared';
import {
  subscribeEventsRequestSchema,
  toEventSubscriptionQuery,
  toSubscribeEventsCommand,
  toUnsubscribeEventsCommand,
  unsubscribeEventsRequestSchema
} from '..';

describe('event request validation', () => {
  it('accepts catalogue names and the wildcard, ignoring unknown keys', () => {
    const request = parseRequest(subscribeEventsRequestSchema, { events: ['token-moved', '*'], extra: 1 });

    expect(toSubscribeEventsCommand(request, 'MCP')).toEqual({ channel: 'MCP', events: ['token-moved', '*'] });
  });

  it('rejects an unknown name, listing the valid ones', () => {
    expect(() => parseRequest(subscribeEventsRequestSchema, { events: ['token-moved', 'token-teleported'] })).toThrow(
      /^events\.1: unknown event 'token-teleported'; valid events: combat-started, .*targets-changed or '\*'$/
    );
  });

  it('rejects a missing, empty or non-list event selection', () => {
    expect(() => parseRequest(subscribeEventsRequestSchema, {})).toThrow('events');
    expect(() => parseRequest(subscribeEventsRequestSchema, { events: [] })).toThrow('events');
    expect(() => parseRequest(subscribeEventsRequestSchema, { events: 'token-moved' })).toThrow('events');
    expect(() => parseRequest(subscribeEventsRequestSchema, null)).toThrow();
  });

  it('reads absent or null unsubscribe params as every event', () => {
    for (const params of [undefined, null, {}, { events: null }]) {
      const request = parseRequest(unsubscribeEventsRequestSchema, params);
      expect(toUnsubscribeEventsCommand(request, 'API')).toEqual({ channel: 'API', events: undefined });
    }
    const named = parseRequest(unsubscribeEventsRequestSchema, { events: ['game-paused'] });
    expect(toUnsubscribeEventsCommand(named, 'API')).toEqual({ channel: 'API', events: ['game-paused'] });
  });

  it('rejects an unknown name and an empty list on unsubscribe', () => {
    expect(() => parseRequest(unsubscribeEventsRequestSchema, { events: ['nope'] })).toThrow("unknown event 'nope'");
    expect(() => parseRequest(unsubscribeEventsRequestSchema, { events: [] })).toThrow('events');
  });

  it('carries the channel into the query', () => {
    expect(toEventSubscriptionQuery(undefined)).toEqual({ channel: undefined });
  });
});
