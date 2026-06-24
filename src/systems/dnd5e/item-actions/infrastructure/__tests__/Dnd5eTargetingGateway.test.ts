import { Dnd5eTargetingGateway } from '../Dnd5eTargetingGateway';
import { TargetTokenNotFoundError } from '@/systems/shared/domain/errors';

const token1 = { setTarget: jest.fn() };
const token2 = { setTarget: jest.fn() };
const existing = { setTarget: jest.fn() };
const user = { id: 'u1', targets: new Set<{ setTarget: jest.Mock }>() };
const tokens = { get: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  user.targets.clear();
  (globalThis as Record<string, unknown>)['game'] = { user };
  (globalThis as Record<string, unknown>)['canvas'] = { tokens, scene: undefined };
});

describe('Dnd5eTargetingGateway', () => {
  it('clears existing targets, sets the new ones, and returns the count', () => {
    user.targets.add(existing);
    tokens.get.mockImplementation((id: string) =>
      id === 't1' ? token1 : id === 't2' ? token2 : undefined
    );

    const count = new Dnd5eTargetingGateway().setTargets(['t1', 't2']);

    expect(existing.setTarget).toHaveBeenCalledWith(false, { user, releaseOthers: false });
    expect(token1.setTarget).toHaveBeenCalledWith(true, { user, releaseOthers: false });
    expect(token2.setTarget).toHaveBeenCalledWith(true, { user, releaseOthers: false });
    expect(count).toBe(2);
  });

  it('throws TargetTokenNotFoundError when a token is missing', () => {
    tokens.get.mockReturnValue(undefined);

    expect(() => new Dnd5eTargetingGateway().setTargets(['missing'])).toThrow(TargetTokenNotFoundError);
    expect(() => new Dnd5eTargetingGateway().setTargets(['missing'])).toThrow(
      'Target token not found: missing'
    );
  });
});
