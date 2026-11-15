import { CardStackService } from '../CardStackService';
import { FakeCardWorld, card, stack } from './fakePorts';

function setup(allows: boolean | undefined): { service: CardStackService; world: FakeCardWorld } {
  const world = new FakeCardWorld([
    stack('deck', 'deck', [card({ id: 'a', flags: { itemacro: { macro: { command: 'kept' } } } })])
  ]);
  const scripts = allows === undefined ? undefined : { allowsScripts: () => allows };
  return { service: new CardStackService({ stacks: world, cards: world, scripts }), world };
}

function writes(world: FakeCardWorld): string[] {
  return world.calls.map((call) => call.method).filter((method) => method === 'createCard' || method === 'updateCard');
}

describe('CardStackService — card flags that automation modules run', () => {
  it('refuses a carrier in a new card without the opt-in, or without a policy at all', async () => {
    for (const allows of [false, undefined]) {
      const { service, world } = setup(allows);
      await expect(
        service.createCard({ stackId: 'deck', draft: { name: 'Joker', flags: { 'midi-qol': { onUseMacroName: 'Boom' } } } })
      ).rejects.toThrow('Script macros are disabled: flags.midi-qol.onUseMacroName makes Midi-QOL run a macro.');
      expect(writes(world)).toEqual([]);
    }
  });

  it('creates it with the opt-in and ordinary flags without it', async () => {
    const allowed = setup(true);
    await allowed.service.createCard({ stackId: 'deck', draft: { name: 'Joker', flags: { 'midi-qol': { onUseMacroName: 'Boom' } } } });
    expect(writes(allowed.world)).toEqual(['createCard']);

    const plain = setup(false);
    await plain.service.createCard({ stackId: 'deck', draft: { name: 'Joker', flags: { world: { wild: true } }, system: { rank: 'J' } } });
    expect(writes(plain.world)).toEqual(['createCard']);
  });

  it('keeps a stored carrier editable and refuses a changed one', async () => {
    const { service, world } = setup(false);

    await service.updateCard({ stackId: 'deck', cardId: 'a', changes: { name: 'Ace', flags: { itemacro: { macro: { command: 'kept' } } } } });
    await expect(
      service.updateCard({ stackId: 'deck', cardId: 'a', changes: { flags: { 'itemacro.macro.command': 'changed' } } })
    ).rejects.toThrow('Script macros are disabled: flags.itemacro.macro.command makes Item Macro run a macro.');
    expect(writes(world)).toEqual(['updateCard']);
  });
});
