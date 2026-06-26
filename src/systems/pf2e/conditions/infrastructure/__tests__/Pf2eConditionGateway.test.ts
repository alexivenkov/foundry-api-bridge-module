import { Pf2eConditionGateway } from '../Pf2eConditionGateway';
import type {
  FoundryConditionItem,
  FoundryPf2eConditionActor,
  FoundryPf2eConditionGame
} from '../foundryPf2eConditionTypes';
import { ActorNotFoundError, ValidationError } from '@/systems/shared/domain/errors';

function condition(slug: string, value: number | null, active = true): FoundryConditionItem {
  return {
    id: `${slug}-id`,
    slug,
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    value,
    active,
    update: jest.fn().mockResolvedValue(undefined)
  };
}

interface ActorMocks {
  increaseCondition: jest.Mock;
  decreaseCondition: jest.Mock;
  getCondition: jest.Mock;
}

function createActor(active: FoundryConditionItem[] = []): {
  actor: FoundryPf2eConditionActor;
  mocks: ActorMocks;
} {
  const mocks: ActorMocks = {
    increaseCondition: jest.fn().mockResolvedValue(undefined),
    decreaseCondition: jest.fn().mockResolvedValue(undefined),
    getCondition: jest.fn().mockReturnValue(null)
  };
  const actor = {
    id: 'a1',
    name: 'Hero',
    conditions: { active },
    increaseCondition: mocks.increaseCondition,
    decreaseCondition: mocks.decreaseCondition,
    getCondition: mocks.getCondition
  } as unknown as FoundryPf2eConditionActor;
  return { actor, mocks };
}

function createGame(actor: unknown): FoundryPf2eConditionGame {
  return { actors: { get: jest.fn().mockReturnValue(actor) } } as unknown as FoundryPf2eConditionGame;
}

describe('Pf2eConditionGateway', () => {
  it('creates an absent valued condition at the requested value', async () => {
    const { actor, mocks } = createActor();
    mocks.getCondition.mockReturnValueOnce(null).mockReturnValue(condition('frightened', 2));
    const gateway = new Pf2eConditionGateway(createGame(actor));

    const outcome = await gateway.setCondition('a1', 'frightened', 2);

    expect(mocks.increaseCondition).toHaveBeenCalledWith('frightened', { value: 2 });
    expect(outcome).toEqual({
      actorId: 'a1',
      condition: { slug: 'frightened', name: 'Frightened', value: 2, active: true }
    });
  });

  it('sets an existing valued condition to an exact value via update, not increase', async () => {
    const { actor, mocks } = createActor();
    const existing = condition('frightened', 3);
    mocks.getCondition.mockReturnValueOnce(existing).mockReturnValue(condition('frightened', 1));
    const gateway = new Pf2eConditionGateway(createGame(actor));

    const outcome = await gateway.setCondition('a1', 'frightened', 1);

    expect(existing.update).toHaveBeenCalledWith({ 'system.value.value': 1 });
    expect(mocks.increaseCondition).not.toHaveBeenCalled();
    expect(outcome.condition?.value).toBe(1);
  });

  it('leaves an already-correct valued condition untouched', async () => {
    const { actor, mocks } = createActor();
    const existing = condition('frightened', 2);
    mocks.getCondition.mockReturnValue(existing);
    const gateway = new Pf2eConditionGateway(createGame(actor));

    await gateway.setCondition('a1', 'frightened', 2);

    expect(existing.update).not.toHaveBeenCalled();
    expect(mocks.increaseCondition).not.toHaveBeenCalled();
  });

  it('sets a non-valued condition without a value', async () => {
    const { actor, mocks } = createActor();
    mocks.getCondition.mockReturnValue(condition('prone', null));
    const gateway = new Pf2eConditionGateway(createGame(actor));

    await gateway.setCondition('a1', 'prone', undefined);

    expect(mocks.increaseCondition).toHaveBeenCalledWith('prone', {});
  });

  it('removes a condition via decreaseCondition forceRemove', async () => {
    const { actor, mocks } = createActor();
    mocks.getCondition.mockReturnValue(null);
    const gateway = new Pf2eConditionGateway(createGame(actor));

    const outcome = await gateway.removeCondition('a1', 'frightened');

    expect(mocks.decreaseCondition).toHaveBeenCalledWith('frightened', { forceRemove: true });
    expect(outcome).toEqual({ actorId: 'a1', slug: 'frightened', removed: true });
  });

  it('increases a condition by one', async () => {
    const { actor, mocks } = createActor();
    mocks.getCondition.mockReturnValue(condition('frightened', 3));
    const gateway = new Pf2eConditionGateway(createGame(actor));

    const outcome = await gateway.increaseCondition('a1', 'frightened');

    expect(mocks.increaseCondition).toHaveBeenCalledWith('frightened');
    expect(outcome.condition?.value).toBe(3);
  });

  it('decreases a condition, returning null when removed', async () => {
    const { actor, mocks } = createActor();
    mocks.getCondition.mockReturnValue(null);
    const gateway = new Pf2eConditionGateway(createGame(actor));

    const outcome = await gateway.decreaseCondition('a1', 'frightened');

    expect(mocks.decreaseCondition).toHaveBeenCalledWith('frightened');
    expect(outcome.condition).toBeNull();
  });

  it('lists active conditions', async () => {
    const { actor } = createActor([condition('frightened', 2), condition('prone', null)]);
    const gateway = new Pf2eConditionGateway(createGame(actor));

    const outcome = await gateway.getConditions('a1');

    expect(outcome).toEqual({
      actorId: 'a1',
      actorName: 'Hero',
      conditions: [
        { slug: 'frightened', name: 'Frightened', value: 2, active: true },
        { slug: 'prone', name: 'Prone', value: null, active: true }
      ]
    });
  });

  it('throws ActorNotFoundError when the actor is missing', async () => {
    const gateway = new Pf2eConditionGateway(createGame(undefined));

    await expect(gateway.setCondition('missing', 'frightened', 1)).rejects.toThrow(ActorNotFoundError);
  });

  it('throws ValidationError for an unsupported slug', async () => {
    const { actor } = createActor();
    const gateway = new Pf2eConditionGateway(createGame(actor));

    await expect(gateway.setCondition('a1', 'persistent-damage', 1)).rejects.toThrow(ValidationError);
  });
});
