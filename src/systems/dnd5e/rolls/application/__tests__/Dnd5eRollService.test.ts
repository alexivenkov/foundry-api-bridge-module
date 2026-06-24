import { Dnd5eRollService } from '../Dnd5eRollService';
import type { ActorRollPort } from '@/systems/dnd5e/rolls/domain';
import type { RollOutcome } from '@/systems/shared/domain';

describe('Dnd5eRollService', () => {
  const outcome: RollOutcome = { total: 15, formula: '1d20 + 5', dice: [] };

  it('delegates rollSkill to the actor roll port', async () => {
    const rollSkill = jest.fn().mockResolvedValue(outcome);
    const rollAbility = jest.fn().mockResolvedValue(outcome);
    const rollSave = jest.fn().mockResolvedValue(outcome);
    const port: ActorRollPort = { rollSkill, rollAbility, rollSave };
    const service = new Dnd5eRollService(port);

    const result = await service.rollSkill({ actorId: 'a1', skill: 'ste', showInChat: true });

    expect(rollSkill).toHaveBeenCalledWith('a1', 'ste', { showInChat: true });
    expect(result).toBe(outcome);
  });

  it('delegates rollAbility to the actor roll port', async () => {
    const rollSkill = jest.fn().mockResolvedValue(outcome);
    const rollAbility = jest.fn().mockResolvedValue(outcome);
    const rollSave = jest.fn().mockResolvedValue(outcome);
    const port: ActorRollPort = { rollSkill, rollAbility, rollSave };
    const service = new Dnd5eRollService(port);

    const result = await service.rollAbility({ actorId: 'a1', ability: 'str', showInChat: false });

    expect(rollAbility).toHaveBeenCalledWith('a1', 'str', { showInChat: false });
    expect(result).toBe(outcome);
  });

  it('delegates rollSave to the actor roll port', async () => {
    const rollSkill = jest.fn().mockResolvedValue(outcome);
    const rollAbility = jest.fn().mockResolvedValue(outcome);
    const rollSave = jest.fn().mockResolvedValue(outcome);
    const port: ActorRollPort = { rollSkill, rollAbility, rollSave };
    const service = new Dnd5eRollService(port);

    const result = await service.rollSave({ actorId: 'a1', ability: 'con', showInChat: true });

    expect(rollSave).toHaveBeenCalledWith('a1', 'con', { showInChat: true });
    expect(result).toBe(outcome);
  });
});
