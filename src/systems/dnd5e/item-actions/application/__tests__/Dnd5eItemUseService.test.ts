import { Dnd5eItemUseService } from '../Dnd5eItemUseService';
import type { ItemUsePort, UseItemOutcome } from '@/systems/dnd5e/item-actions/domain';

describe('Dnd5eItemUseService', () => {
  const outcome: UseItemOutcome = {
    itemId: 'i1',
    itemName: 'Sword',
    itemType: 'weapon',
    rolls: []
  };

  it('delegates use to the item use port with unpacked options', async () => {
    const use = jest.fn().mockResolvedValue(outcome);
    const port: ItemUsePort = { use };
    const service = new Dnd5eItemUseService(port);

    const result = await service.useItem({
      actorId: 'a1',
      itemId: 'i1',
      activityId: undefined,
      activityType: 'attack',
      consume: false,
      scaling: 3,
      showInChat: true
    });

    expect(use).toHaveBeenCalledWith('a1', 'i1', {
      activityId: undefined,
      activityType: 'attack',
      consume: false,
      scaling: 3,
      showInChat: true
    });
    expect(result).toBe(outcome);
  });
});
