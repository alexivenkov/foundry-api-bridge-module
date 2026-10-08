import { resolveActorTarget } from '../actorTarget';

const worldActor = { id: 'a1' };
const tokenActor = { id: 'a1' };
const scene = { id: 's1', tokens: { get: jest.fn() } };
const game = {
  actors: { get: jest.fn() },
  scenes: { get: jest.fn(), active: scene as typeof scene | null }
};

describe('resolveActorTarget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    game.scenes.active = scene;
    game.actors.get.mockImplementation((id: string) => (id === 'a1' ? worldActor : undefined));
    scene.tokens.get.mockImplementation((id: string) => (id === 't1' ? { id: 't1', actor: tokenActor } : undefined));
  });

  it('resolves a world actor by actorId', () => {
    expect(resolveActorTarget(game, { actorId: 'a1' })).toEqual({ actor: worldActor });
  });

  it('prefers tokenId and returns the token actor with the token id', () => {
    expect(resolveActorTarget(game, { actorId: 'a1', tokenId: 't1' })).toEqual({ actor: tokenActor, tokenId: 't1' });
    expect(game.actors.get).not.toHaveBeenCalled();
  });

  it('looks the token up on the requested scene', () => {
    const other = { id: 's2', tokens: { get: jest.fn().mockReturnValue({ id: 't9', actor: tokenActor }) } };
    game.scenes.get.mockImplementation((id: string) => (id === 's2' ? other : undefined));

    expect(resolveActorTarget(game, { tokenId: 't9', sceneId: 's2' }).tokenId).toBe('t9');
    expect(() => resolveActorTarget(game, { tokenId: 't9', sceneId: 'nope' })).toThrow('Scene not found: nope');
  });

  it('explains every failure', () => {
    expect(() => resolveActorTarget(game, {})).toThrow('Either actorId or tokenId is required');
    expect(() => resolveActorTarget(game, { actorId: 'zz' })).toThrow('Actor not found: zz');
    expect(() => resolveActorTarget(game, { tokenId: 'zz' })).toThrow('Token not found: zz');
    scene.tokens.get.mockReturnValue({ id: 't1', actor: null });
    expect(() => resolveActorTarget(game, { tokenId: 't1' })).toThrow('Token has no actor: t1');
    game.scenes.active = null;
    expect(() => resolveActorTarget(game, { tokenId: 't1' })).toThrow('No active scene');
  });
});
