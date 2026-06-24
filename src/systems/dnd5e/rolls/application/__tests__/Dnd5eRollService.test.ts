import { Dnd5eRollService } from '../Dnd5eRollService';
import type { ActorRollPort } from '@/systems/dnd5e/rolls/domain';
import type { RollOutcome } from '@/systems/shared/domain';

describe('Dnd5eRollService', () => {
  const outcome: RollOutcome = { total: 15, formula: '1d20 + 5', dice: [] };

  it('delegates rollSkill to the actor roll port', async () => {
    const rollSkill = jest.fn().mockResolvedValue(outcome);
    const port: ActorRollPort = { rollSkill };
    const service = new Dnd5eRollService(port);

    const result = await service.rollSkill({ actorId: 'a1', skill: 'ste', showInChat: true });

    expect(rollSkill).toHaveBeenCalledWith('a1', 'ste', { showInChat: true });
    expect(result).toBe(outcome);
  });
});
