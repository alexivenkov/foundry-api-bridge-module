import { CommandRouter } from '../CommandRouter';
import type { Command, CommandContext, EventSubscriptionResult, SubscribeEventsParams } from '../types';

const command: Command = { id: 'c-1', type: 'subscribe-events', params: { events: ['*'] } };
const subscription: EventSubscriptionResult = { channel: 'MCP', events: ['*'], queued: 0, dropped: 0, lastSeq: 0 };

describe('CommandRouter command context', () => {
  it('hands the context to the handler as its second argument', async () => {
    const router = new CommandRouter();
    const handler = jest.fn((_params: SubscribeEventsParams, _context?: CommandContext) => Promise.resolve(subscription));
    router.register('subscribe-events', handler);

    const response = await router.execute(command, { channel: 'MCP' });

    expect(handler).toHaveBeenCalledWith({ events: ['*'] }, { channel: 'MCP' });
    expect(response).toEqual({ id: 'c-1', success: true, data: subscription });
  });

  it('calls the handler with the params alone when there is no context', async () => {
    const router = new CommandRouter();
    const handler = jest.fn(() => Promise.resolve(subscription));
    router.register('subscribe-events', handler);

    await router.execute(command);

    expect(handler).toHaveBeenCalledWith({ events: ['*'] });
    expect(handler.mock.calls[0]).toHaveLength(1);
  });

  it('keeps one-argument handlers working with a context', async () => {
    const router = new CommandRouter();
    router.register('roll-dice', (params) => Promise.resolve({ total: 3, formula: params.formula, dice: [] }));

    const response = await router.execute({ id: 'r-1', type: 'roll-dice', params: { formula: '1d4' } }, { channel: 'API' });

    expect(response).toEqual({ id: 'r-1', success: true, data: { total: 3, formula: '1d4', dice: [] } });
  });

  it('turns a context-aware handler failure into an error response', async () => {
    const router = new CommandRouter();
    router.register('subscribe-events', (_params, context) => Promise.reject(new Error(`no ${String(context?.channel)}`)));

    const response = await router.execute(command, { channel: 'API' });

    expect(response).toEqual({ id: 'c-1', success: false, error: 'no API' });
  });
});
