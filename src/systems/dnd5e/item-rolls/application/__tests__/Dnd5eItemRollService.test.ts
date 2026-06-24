import { Dnd5eItemRollService } from '../Dnd5eItemRollService';
import type { ItemRollPort } from '@/systems/dnd5e/item-rolls/domain';
import type { RollOutcome } from '@/systems/shared/domain';

describe('Dnd5eItemRollService', () => {
  const outcome: RollOutcome = { total: 18, formula: '1d20 + 5', dice: [] };

  it('delegates rollAttack to the item roll port', async () => {
    const rollAttack = jest.fn().mockResolvedValue(outcome);
    const rollDamage = jest.fn().mockResolvedValue(outcome);
    const port: ItemRollPort = { rollAttack, rollDamage };
    const service = new Dnd5eItemRollService(port);

    const result = await service.rollAttack({
      actorId: 'a1',
      itemId: 'i1',
      advantage: true,
      disadvantage: false,
      showInChat: false
    });

    expect(rollAttack).toHaveBeenCalledWith('a1', 'i1', {
      advantage: true,
      disadvantage: false,
      showInChat: false
    });
    expect(result).toBe(outcome);
  });

  it('delegates rollDamage to the item roll port', async () => {
    const rollAttack = jest.fn().mockResolvedValue(outcome);
    const rollDamage = jest.fn().mockResolvedValue(outcome);
    const port: ItemRollPort = { rollAttack, rollDamage };
    const service = new Dnd5eItemRollService(port);

    const result = await service.rollDamage({
      actorId: 'a1',
      itemId: 'i1',
      critical: true,
      showInChat: false
    });

    expect(rollDamage).toHaveBeenCalledWith('a1', 'i1', { critical: true, showInChat: false });
    expect(result).toBe(outcome);
  });
});
