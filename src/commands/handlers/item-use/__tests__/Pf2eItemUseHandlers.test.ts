const consume = jest.fn();
const cast = jest.fn();
const toMessage = jest.fn();

const itemsById: Record<string, unknown> = {
  potion: { id: 'potion', name: 'Healing Potion', type: 'consumable', quantity: 1, system: { uses: { value: 0, max: 1 } }, consume },
  fireball: { id: 'fireball', name: 'Fireball', type: 'spell', rank: 3, spellcasting: { cast } },
  wand: { id: 'wand', name: 'Wand of Magic Missile', type: 'equipment', toMessage }
};

const mockActor = {
  id: 'a1',
  name: 'Wizard',
  items: { get: jest.fn((id: string) => itemsById[id]) }
};

const mockGame = {
  system: { id: 'pf2e' },
  actors: { get: jest.fn() }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

import { pf2eUseConsumableHandler } from '../Pf2eUseConsumableHandler';
import { pf2eCastSpellHandler } from '../Pf2eCastSpellHandler';
import { pf2ePostItemHandler } from '../Pf2ePostItemHandler';

describe('PF2e item-use handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.system.id = 'pf2e';
    mockGame.actors.get.mockReturnValue(mockActor);
    consume.mockResolvedValue(undefined);
    cast.mockResolvedValue(undefined);
    toMessage.mockResolvedValue({ id: 'msg-9' });
  });

  it('uses a consumable', async () => {
    const result = await pf2eUseConsumableHandler({ actorId: 'a1', itemId: 'potion' });
    expect(consume).toHaveBeenCalledWith(1);
    expect(result.consumed).toBe(true);
    expect(result.itemName).toBe('Healing Potion');
  });

  it('casts a spell at a heightened rank', async () => {
    const result = await pf2eCastSpellHandler({ actorId: 'a1', spellId: 'fireball', rank: 5 });
    expect(cast).toHaveBeenCalledWith(itemsById['fireball'], { message: true, rank: 5 });
    expect(result).toEqual({ spellId: 'fireball', spellName: 'Fireball', rank: 5, cast: true });
  });

  it('posts an item to chat', async () => {
    const result = await pf2ePostItemHandler({ actorId: 'a1', itemId: 'wand' });
    expect(toMessage).toHaveBeenCalledWith(null, { create: true });
    expect(result.chatMessageId).toBe('msg-9');
  });

  it('rejects an item-use command in a dnd5e world', async () => {
    mockGame.system.id = 'dnd5e';
    await expect(pf2eCastSpellHandler({ actorId: 'a1', spellId: 'fireball' })).rejects.toThrow(
      "Operation 'pf2e/cast-spell' is not supported by game system 'dnd5e'"
    );
  });
});
