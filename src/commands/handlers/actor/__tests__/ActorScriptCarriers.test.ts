import type { ActorGameProvider } from '../../../../core/actors';
import { createCreateActorHandler } from '../CreateActorHandler';
import { createUpdateActorHandler } from '../UpdateActorHandler';

const DAE_BONUS = { bonuses: { abilities: { check: 'dae.eval(@abilities.str.mod)' } } };

function world(): { gameProvider: ActorGameProvider; create: jest.Mock; update: jest.Mock } {
  const update = jest.fn().mockResolvedValue(undefined);
  const goblin = {
    id: 'a1',
    uuid: 'Actor.a1',
    name: 'Goblin',
    type: 'npc',
    img: null,
    folder: null,
    _source: { system: DAE_BONUS },
    update
  };
  const create = jest.fn().mockResolvedValue({ ...goblin, id: 'new', uuid: 'Actor.new', name: 'Orc' });
  const game = { actors: { get: (id: string) => (id === 'a1' ? goblin : undefined), documentClass: { create } } };
  return { gameProvider: { getGame: () => game } as unknown as ActorGameProvider, create, update };
}

describe('actor handlers — system data that DAE runs', () => {
  it('create-actor refuses dae.eval without the opt-in and creates it with the opt-in', async () => {
    const off = world();
    await expect(
      createCreateActorHandler({ gameProvider: off.gameProvider, scripts: { allowsScripts: () => false } })({
        name: 'Orc',
        type: 'npc',
        system: DAE_BONUS
      })
    ).rejects.toThrow(
      'Script macros are disabled: system.bonuses.abilities.check makes DAE run JavaScript. ' +
        'Enable "Allow Script Macros" in module settings to write it via API.'
    );
    expect(off.create).not.toHaveBeenCalled();

    const on = world();
    await createCreateActorHandler({ gameProvider: on.gameProvider, scripts: { allowsScripts: () => true } })({
      name: 'Orc',
      type: 'npc',
      system: DAE_BONUS
    });
    expect(on.create).toHaveBeenCalled();
  });

  it('update-actor keeps a stored formula editable and refuses a new one', async () => {
    const { gameProvider, update } = world();
    const handler = createUpdateActorHandler({ gameProvider, scripts: { allowsScripts: () => false } });

    await handler({ actorId: 'a1', name: 'Goblin Boss', system: DAE_BONUS });
    await expect(
      handler({ actorId: 'a1', system: { bonuses: { abilities: { save: 'dae.eval(1)' } } } })
    ).rejects.toThrow('Script macros are disabled: system.bonuses.abilities.save makes DAE run JavaScript.');
    expect(update).toHaveBeenCalledTimes(1);
  });
});
