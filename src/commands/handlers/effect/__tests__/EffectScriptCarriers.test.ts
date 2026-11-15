import type { EffectGameProvider } from '../../../../core/effects';
import { createAddActorEffectHandler } from '../AddActorEffectHandler';
import { createUpdateActorEffectHandler } from '../UpdateActorEffectHandler';

function provider(game: unknown): EffectGameProvider {
  return { getGame: () => game } as unknown as EffectGameProvider;
}

const RAGE = {
  _id: 'rage',
  id: 'rage',
  name: 'Rage',
  img: null,
  disabled: false,
  origin: null,
  statuses: new Set<string>(),
  changes: [{ key: 'macro.itemMacro', value: '', mode: 0 }],
  duration: {},
  update: jest.fn().mockResolvedValue(undefined)
};

function heroGame(): { game: unknown; create: jest.Mock } {
  const create = jest.fn().mockResolvedValue([{ _id: 'new', name: 'Hex' }]);
  const effects = [RAGE];
  const hero = {
    id: 'a1',
    name: 'Hero',
    effects: { contents: effects, get: (id: string) => effects.find((effect) => effect._id === id) },
    statuses: new Set<string>(),
    toggleStatusEffect: jest.fn(),
    createEmbeddedDocuments: create
  };
  return { game: { actors: { get: (id: string) => (id === 'a1' ? hero : undefined) } }, create };
}

describe('effect handlers — changes that automation modules run', () => {
  it('add-actor-effect refuses a DAE macro change without the opt-in and adds it with the opt-in', async () => {
    const params = { actorId: 'a1', name: 'Hex', changes: [{ key: 'macro.execute', value: 'Hex', mode: 0 }] };

    const off = heroGame();
    await expect(
      createAddActorEffectHandler({ gameProvider: provider(off.game), scripts: { allowsScripts: () => false } })(params)
    ).rejects.toThrow(
      'Script macros are disabled: changes.0 (macro.execute) makes DAE run a macro. ' +
        'Enable "Allow Script Macros" in module settings to write it via API.'
    );
    expect(off.create).not.toHaveBeenCalled();

    const on = heroGame();
    await expect(
      createAddActorEffectHandler({ gameProvider: provider(on.game), scripts: { allowsScripts: () => true } })(params)
    ).resolves.toMatchObject({ effectId: 'new' });
  });

  it('update-actor-effect keeps a stored carrier editable and refuses a changed one', async () => {
    const { game } = heroGame();
    const handler = createUpdateActorEffectHandler({ gameProvider: provider(game), scripts: { allowsScripts: () => false } });

    await expect(
      handler({ actorId: 'a1', effectId: 'rage', changes: [{ key: 'macro.itemMacro', value: 'Other', mode: 0 }] })
    ).rejects.toThrow('Script macros are disabled: changes.0 (macro.itemMacro) makes DAE run a macro.');
    expect(RAGE.update).not.toHaveBeenCalled();

    await handler({
      actorId: 'a1',
      effectId: 'rage',
      changes: [
        { key: 'macro.itemMacro', value: '', mode: 0 },
        { key: 'flags.midi-qol.advantage.attack.all', value: '1', mode: 0 }
      ]
    });
    expect(RAGE.update).toHaveBeenCalled();
  });
});
