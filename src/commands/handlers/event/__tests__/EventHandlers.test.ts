import { createFoundryEventHub, type EventHub } from '../../../../core/events';
import { FakeHooks, globalsWith } from '../../../../core/events/infrastructure/__tests__/fakeHooks';
import { createGetEventSubscriptionsHandler } from '../GetEventSubscriptionsHandler';
import { createGetEventTypesHandler } from '../GetEventTypesHandler';
import { createSubscribeEventsHandler } from '../SubscribeEventsHandler';
import { createUnsubscribeEventsHandler } from '../UnsubscribeEventsHandler';

function setup(): { hub: EventHub; hooks: FakeHooks } {
  const hooks = new FakeHooks();
  return { hub: createFoundryEventHub({ globals: globalsWith(hooks) }), hooks };
}

const mcp = { channel: 'MCP' };
const noChannel = 'Event subscriptions need a server connection: send this command over the MCP or API channel';

describe('event handlers', () => {
  describe('get-event-types', () => {
    it('lists the catalogue with descriptions', async () => {
      const result = await createGetEventTypesHandler(setup())({});

      expect(result.eventTypes).toHaveLength(29);
      expect(result.eventTypes[0]).toEqual({
        name: 'combat-started',
        description: expect.stringContaining('combat') as string
      });
      expect(result.eventTypes.map((type) => type.name)).toContain('chat-message-created');
    });
  });

  describe('subscribe-events', () => {
    it('subscribes the channel the command came on and registers the hooks', async () => {
      const deps = setup();

      const result = await createSubscribeEventsHandler(deps)({ events: ['token-moved', 'combat-started'] }, mcp);

      expect(result).toEqual({ channel: 'MCP', events: ['combat-started', 'token-moved'], queued: 0, dropped: 0, lastSeq: 0 });
      expect(deps.hooks.registeredHooks()).toEqual(['updateCombat', 'updateToken']);
    });

    it('rejects an unknown event name', async () => {
      await expect(createSubscribeEventsHandler(setup())({ events: ['nope'] }, mcp)).rejects.toThrow(
        "events.0: unknown event 'nope'; valid events: "
      );
    });

    it('refuses a command without a channel', async () => {
      await expect(createSubscribeEventsHandler(setup())({ events: ['*'] })).rejects.toThrow(noChannel);
    });
  });

  describe('unsubscribe-events and get-event-subscriptions', () => {
    it('stops named events, then all of them, and reports the subscription', async () => {
      const deps = setup();
      await createSubscribeEventsHandler(deps)({ events: ['*'] }, mcp);
      const unsubscribe = createUnsubscribeEventsHandler(deps);
      const getSubscription = createGetEventSubscriptionsHandler(deps);

      const partial = await unsubscribe({ events: ['token-moved'] }, mcp);
      expect(partial.events).not.toContain('token-moved');
      expect(partial.events).toContain('token-updated');
      expect((await getSubscription({}, { channel: 'API' })).events).toEqual([]);

      const none = await unsubscribe({}, mcp);
      expect(none).toEqual({ channel: 'MCP', events: [], queued: 0, dropped: 0, lastSeq: 0 });
      expect(await getSubscription({}, mcp)).toEqual(none);
      expect(deps.hooks.registeredHooks()).toEqual([]);
    });

    it('validates the names to stop', async () => {
      await expect(createUnsubscribeEventsHandler(setup())({ events: [] }, mcp)).rejects.toThrow('events');
    });

    it('refuses a command without a channel', async () => {
      await expect(createGetEventSubscriptionsHandler(setup())({})).rejects.toThrow(noChannel);
      await expect(createUnsubscribeEventsHandler(setup())({})).rejects.toThrow(noChannel);
    });
  });
});
