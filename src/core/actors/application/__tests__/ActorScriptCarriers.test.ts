import type { ActorTarget } from '../../../shared';
import type { ActorSources, SystemData } from '../../domain';
import { ActorService } from '../ActorService';
import { FakeActorStore, FakeWorld } from './fakePorts';

const goblin: ActorTarget = { kind: 'actor', actorId: 'a1' };
const DAE_BONUS = { bonuses: { mwak: { attack: '1 + dae.eval(@abilities.str.mod > 2 ? 1 : 0)' } } };

function setup(allows: boolean | undefined, stored: SystemData | null = null): { service: ActorService; store: FakeActorStore } {
  const store = new FakeActorStore();
  const world = new FakeWorld([{ id: 'a1', name: 'Goblin' }]);
  const sources: ActorSources = { storedSystem: () => stored };
  const scripts = allows === undefined ? undefined : { allowsScripts: () => allows };
  return { service: new ActorService({ scenes: world, locator: world, actors: store, scripts, sources }), store };
}

describe('ActorService — system data that DAE runs', () => {
  it('refuses dae.eval in the system data without the opt-in, or without a policy at all', async () => {
    for (const allows of [false, undefined]) {
      const { service, store } = setup(allows);
      await expect(service.createActor({ draft: { name: 'Orc', type: 'npc', system: DAE_BONUS } })).rejects.toThrow(
        'Script macros are disabled: system.bonuses.mwak.attack makes DAE run JavaScript.'
      );
      await expect(service.updateActor({ target: goblin, changes: { system: DAE_BONUS } })).rejects.toThrow(
        'Script macros are disabled'
      );
      expect(store.created).toEqual([]);
      expect(store.updated).toEqual([]);
    }
  });

  it('writes it with the opt-in and ordinary formulas without it', async () => {
    const allowed = setup(true);
    await allowed.service.createActor({ draft: { name: 'Orc', type: 'npc', system: DAE_BONUS } });
    expect(allowed.store.created).toHaveLength(1);

    const plain = setup(false);
    await plain.service.updateActor({ target: goblin, changes: { system: { bonuses: { mwak: { attack: '1 + @prof' } } } } });
    expect(plain.store.updated).toHaveLength(1);
  });

  it('keeps a stored formula editable when it comes back unchanged', async () => {
    const { service, store } = setup(false, DAE_BONUS);

    await service.updateActor({ target: goblin, changes: { name: 'Big Goblin', system: DAE_BONUS } });

    expect(store.updated).toHaveLength(1);
  });
});
