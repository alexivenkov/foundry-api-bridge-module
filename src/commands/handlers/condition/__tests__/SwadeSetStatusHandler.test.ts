import { makeActor } from '@/systems/swade/shared/__tests__/swadeTestFixtures';

const mockGame = {
  system: { id: 'swade' },
  actors: { get: jest.fn() },
  scenes: { get: jest.fn(), active: { id: 's1', tokens: { get: jest.fn() } } }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

import { swadeSetStatusHandler } from '../SwadeSetStatusHandler';

describe('swade/set-status handler', () => {
  let actor = makeActor();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.system.id = 'swade';
    actor = makeActor();
    mockGame.actors.get.mockImplementation((id: string) => (id === 'a1' ? actor : undefined));
  });

  it('toggles the status through the system and lists the active statuses', async () => {
    const result = await swadeSetStatusHandler({ actorId: 'a1', status: 'stunned', active: true, overlay: false });
    expect(actor.toggleActiveEffect).toHaveBeenCalledWith('stunned', { active: true, overlay: false });
    expect(result).toEqual({ actorId: 'a1', status: 'stunned', active: true, statuses: ['stunned'] });
  });

  it('rejects an unknown status id with the list of valid ones', async () => {
    await expect(swadeSetStatusHandler({ actorId: 'a1', status: 'dazed' as 'shaken', active: true })).rejects.toThrow('"shaken"');
    expect(actor.toggleActiveEffect).not.toHaveBeenCalled();
  });

  it('rejects in a pf2e world', async () => {
    mockGame.system.id = 'pf2e';
    await expect(swadeSetStatusHandler({ actorId: 'a1', status: 'shaken', active: true })).rejects.toThrow(
      "Operation 'swade/set-status' is not supported by game system 'pf2e'"
    );
  });
});
