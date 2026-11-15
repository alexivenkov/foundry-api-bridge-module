import { CoreFeatureUnavailableError, type ActorTarget } from '../../../shared';
import { InvalidEffectOriginError, UnknownEffectRegistryIdError } from '../../domain';
import { EffectService } from '../EffectService';
import { FOUNDRY_13_FEATURES, FakeEffectEnvironment, FakeEffectStore, FakeWorld, effect } from './fakePorts';

// The attributes `add-actor-effect` / `update-actor-effect` gained.

const hero: ActorTarget = { kind: 'actor', actorId: 'a1' };

function setup(environment = new FakeEffectEnvironment()): { service: EffectService; store: FakeEffectStore } {
  const store = new FakeEffectStore({ 'world:a1': [effect({ id: 'bless', name: 'Bless' })] });
  const world = new FakeWorld([{ id: 'a1', name: 'Hero' }]);
  return { service: new EffectService({ scenes: world, actors: world, effects: store, environment }), store };
}

describe('EffectService, attributes added to the actor-effect commands', () => {
  it('hands a subtype, type data, description, sort and icon visibility to the store', async () => {
    const { service, store } = setup();
    const draft = {
      name: 'Haste',
      type: 'enchantment',
      system: { level: 3 },
      description: '<p>Fast.</p>',
      sort: 5,
      showIcon: 'always' as const
    };

    await service.addEffect({ target: hero, draft });

    expect(store.created).toEqual([{ ref: { kind: 'world', actorId: 'a1' }, draft }]);
  });

  it('refuses an unknown subtype and an icon visibility Foundry 13 does not store, and creates nothing', async () => {
    const { service, store } = setup();
    const old = setup(new FakeEffectEnvironment(FOUNDRY_13_FEATURES));

    await expect(service.addEffect({ target: hero, draft: { name: 'x', type: 'curse' } })).rejects.toThrow(
      UnknownEffectRegistryIdError
    );
    await expect(old.service.addEffect({ target: hero, draft: { name: 'x', showIcon: 'never' } })).rejects.toThrow(
      CoreFeatureUnavailableError
    );
    expect(store.created).toEqual([]);
    expect(old.store.created).toEqual([]);
  });

  it('does not check the origin of a new effect, which the command has always passed on as given', async () => {
    const environment = new FakeEffectEnvironment();
    environment.refusedOrigins = { Bob: 'must reference a valid document type' };
    const { service, store } = setup(environment);

    await service.addEffect({ target: hero, draft: { name: 'x', origin: 'Bob' } });

    expect(store.created).toHaveLength(1);
  });

  it('checks the origin an update sets', async () => {
    const environment = new FakeEffectEnvironment();
    environment.refusedOrigins = { Bob: 'must reference a valid document type' };
    const { service, store } = setup(environment);

    await expect(service.updateEffect({ target: hero, effectId: 'bless', changes: { origin: 'Bob' } })).rejects.toThrow(
      InvalidEffectOriginError
    );
    await service.updateEffect({ target: hero, effectId: 'bless', changes: { origin: null, tint: '#ff0000' } });

    expect(store.updated).toEqual([
      { ref: { kind: 'world', actorId: 'a1' }, effectId: 'bless', changes: { origin: null, tint: '#ff0000' } }
    ]);
  });

  it.each([
    ['Foundry 14', new FakeEffectEnvironment()],
    ['Foundry 13', new FakeEffectEnvironment(FOUNDRY_13_FEATURES)]
  ])('passes a duration in several units on, on create and on update (%s)', async (_core, environment) => {
    const { service, store } = setup(environment);

    await service.addEffect({ target: hero, draft: { name: 'x', duration: { rounds: 5, turns: 1 } } });
    await service.updateEffect({ target: hero, effectId: 'bless', changes: { duration: { seconds: 60, rounds: 10 } } });

    expect(store.created[0]?.draft.duration).toEqual({ rounds: 5, turns: 1 });
    expect(store.updated[0]?.changes.duration).toEqual({ seconds: 60, rounds: 10 });
  });
});
