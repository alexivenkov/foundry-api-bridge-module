import { Pf2eStrikeGateway } from '../Pf2eStrikeGateway';
import type {
  FoundryCheckRoll,
  FoundryDamageRoll,
  FoundryStrikeActor,
  FoundryPf2eStrikeGame
} from '../foundryPf2eStrikeTypes';
import { ActorNotFoundError, RollResolutionError } from '@/systems/shared/domain/errors';
import { StrikeNotFoundError } from '@/systems/pf2e/strikes/domain';

const attackRoll: FoundryCheckRoll = {
  total: 24,
  formula: '1d20 + 14',
  dice: [{ faces: 20, number: 1, results: [{ result: 18 }] }],
  degreeOfSuccess: 3
};

const damageRoll: FoundryDamageRoll = {
  total: 12,
  formula: '1d8 + 6[slashing]',
  dice: [{ faces: 8, number: 1, results: [{ result: 6 }] }]
};

interface StrikeMocks {
  variant0Roll: jest.Mock;
  variant1Roll: jest.Mock;
  damage: jest.Mock;
  critical: jest.Mock;
}

function createActor(): { actor: FoundryStrikeActor; mocks: StrikeMocks } {
  const mocks: StrikeMocks = {
    variant0Roll: jest.fn().mockResolvedValue(attackRoll),
    variant1Roll: jest.fn().mockResolvedValue(attackRoll),
    damage: jest.fn().mockResolvedValue(damageRoll),
    critical: jest.fn().mockResolvedValue(damageRoll)
  };
  const actor = {
    id: 'a1',
    name: 'Fighter',
    system: {
      actions: [
        {
          type: 'strike',
          slug: 'longsword',
          label: 'Longsword',
          ready: true,
          variants: [
            { label: '+14', roll: mocks.variant0Roll },
            { label: '+9', roll: mocks.variant1Roll }
          ],
          damage: mocks.damage,
          critical: mocks.critical
        }
      ]
    }
  } as unknown as FoundryStrikeActor;
  return { actor, mocks };
}

function createGame(actor: unknown): FoundryPf2eStrikeGame {
  return { actors: { get: jest.fn().mockReturnValue(actor) } } as unknown as FoundryPf2eStrikeGame;
}

describe('Pf2eStrikeGateway', () => {
  it('lists strike actions with variant labels', async () => {
    const { actor } = createActor();
    const gateway = new Pf2eStrikeGateway(createGame(actor));

    const outcome = await gateway.listStrikes('a1');

    expect(outcome).toEqual({
      actorId: 'a1',
      actorName: 'Fighter',
      strikes: [{ slug: 'longsword', label: 'Longsword', ready: true, variants: ['+14', '+9'] }]
    });
  });

  it('rolls the requested MAP variant and maps degree to isCritical', async () => {
    const { actor, mocks } = createActor();
    const gateway = new Pf2eStrikeGateway(createGame(actor));

    const outcome = await gateway.rollStrike('a1', 'longsword', 1, { showInChat: true });

    expect(mocks.variant1Roll).toHaveBeenCalledWith({ createMessage: true });
    expect(mocks.variant0Roll).not.toHaveBeenCalled();
    expect(outcome.total).toBe(24);
    expect(outcome.isCritical).toBe(true);
  });

  it('rolls normal damage via damage()', async () => {
    const { actor, mocks } = createActor();
    const gateway = new Pf2eStrikeGateway(createGame(actor));

    const outcome = await gateway.rollStrikeDamage('a1', 'longsword', false, { showInChat: false });

    expect(mocks.damage).toHaveBeenCalledWith({ createMessage: false });
    expect(mocks.critical).not.toHaveBeenCalled();
    expect(outcome).toEqual({
      total: 12,
      formula: '1d8 + 6[slashing]',
      dice: [{ type: 'd8', count: 1, results: [6] }]
    });
  });

  it('rolls critical damage via critical()', async () => {
    const { actor, mocks } = createActor();
    const gateway = new Pf2eStrikeGateway(createGame(actor));

    await gateway.rollStrikeDamage('a1', 'longsword', true, { showInChat: false });

    expect(mocks.critical).toHaveBeenCalledWith({ createMessage: false });
    expect(mocks.damage).not.toHaveBeenCalled();
  });

  it('throws StrikeNotFoundError for an unknown slug', async () => {
    const { actor } = createActor();
    const gateway = new Pf2eStrikeGateway(createGame(actor));

    await expect(gateway.rollStrike('a1', 'greataxe', 0, { showInChat: false })).rejects.toThrow(
      StrikeNotFoundError
    );
  });

  it('throws RollResolutionError when the MAP variant is absent', async () => {
    const { actor } = createActor();
    const gateway = new Pf2eStrikeGateway(createGame(actor));

    await expect(gateway.rollStrike('a1', 'longsword', 2, { showInChat: false })).rejects.toThrow(
      RollResolutionError
    );
  });

  it('throws RollResolutionError when the attack roll returns null', async () => {
    const { actor, mocks } = createActor();
    mocks.variant0Roll.mockResolvedValue(null);
    const gateway = new Pf2eStrikeGateway(createGame(actor));

    await expect(gateway.rollStrike('a1', 'longsword', 0, { showInChat: false })).rejects.toThrow(
      'Strike attack returned no result'
    );
  });

  it('throws RollResolutionError when damage returns a formula string', async () => {
    const { actor, mocks } = createActor();
    mocks.damage.mockResolvedValue('1d8 + 6');
    const gateway = new Pf2eStrikeGateway(createGame(actor));

    await expect(
      gateway.rollStrikeDamage('a1', 'longsword', false, { showInChat: false })
    ).rejects.toThrow(RollResolutionError);
  });

  it('throws ActorNotFoundError when the actor is missing', async () => {
    const gateway = new Pf2eStrikeGateway(createGame(undefined));

    await expect(gateway.listStrikes('missing')).rejects.toThrow(ActorNotFoundError);
  });
});
