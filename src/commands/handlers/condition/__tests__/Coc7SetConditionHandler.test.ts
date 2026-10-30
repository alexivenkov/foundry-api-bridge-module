import { makeActor, makeStatus } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';
import { installCoc7World, uninstallCoc7World } from '@/commands/handlers/actor/__tests__/coc7HandlerTestSupport';
import { coc7SetConditionHandler } from '../Coc7SetConditionHandler';

describe('coc7/set-condition handler', () => {
  let actor = makeActor();

  beforeEach(() => {
    actor = makeActor({ items: [makeStatus({ id: 'st-1', name: 'Nyctophobia' })] });
    installCoc7World({ actors: [actor] });
  });

  afterEach(() => {
    uninstallCoc7World();
  });

  it('sets and unsets a condition through the system and lists the statuses', async () => {
    const on = await coc7SetConditionHandler({ actorId: 'a1', condition: 'tempoInsane', active: true, realTime: false, duration: 2 });
    expect(actor.conditionsSet).toHaveBeenCalledWith(['tempoInsane'], { realTime: false, duration: 2 });
    expect(on).toEqual({
      actorId: 'a1',
      conditions: { criticalWounds: false, unconscious: false, dying: false, dead: false, prone: false, tempoInsane: true, indefInsane: false },
      statuses: [{ id: 'st-1', name: 'Nyctophobia', phobia: true, mania: false }]
    });
    const off = await coc7SetConditionHandler({ actorId: 'a1', condition: 'tempoInsane', active: false });
    expect(actor.conditionsUnset).toHaveBeenCalledWith(['tempoInsane']);
    expect(off.conditions.tempoInsane).toBe(false);
  });

  it('rejects an unknown condition id with the list of valid ones', async () => {
    await expect(coc7SetConditionHandler({ actorId: 'a1', condition: 'shaken' as 'prone', active: true })).rejects.toThrow('"prone"');
    expect(actor.conditionsSet).not.toHaveBeenCalled();
  });

  it('rejects in a swade world', async () => {
    installCoc7World({ systemId: 'swade', actors: [actor] });
    await expect(coc7SetConditionHandler({ actorId: 'a1', condition: 'prone', active: true })).rejects.toThrow(
      "Operation 'coc7/set-condition' is not supported by game system 'swade'"
    );
  });
});
