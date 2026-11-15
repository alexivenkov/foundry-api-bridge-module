import {
  ActorNotFoundError,
  ActorTargetRequiredError,
  NoActiveSceneError,
  SceneNotFoundError,
  TargetTokenNotFoundError,
  TokenHasNoActorError,
  toActorTarget,
  type ActorAddress,
  type ActorIdentity,
  type ActorLocator,
  type LocatedActor,
  type SceneIdentity,
  type SceneLocator,
  type TargetToken
} from '../../domain';
import { requireActor } from '../requireActor';

const worldActor: ActorIdentity = { id: 'a1', name: 'Goblin' };
const tokenActor: ActorIdentity = { id: 'a1', name: 'Goblin 3' };

interface World {
  activeSceneId: string | null;
  tokens: Record<string, Record<string, TargetToken>>;
  findWorldActor: jest.Mock<ActorIdentity | null, [string]>;
}

function world(): World {
  return {
    activeSceneId: 's1',
    tokens: { s1: { t1: { id: 't1', actor: tokenActor } }, s2: { t9: { id: 't9', actor: tokenActor } } },
    findWorldActor: jest.fn((id: string) => (id === 'a1' ? worldActor : null))
  };
}

function resolve(state: World, address: ActorAddress): LocatedActor {
  const scenes: SceneLocator = {
    findScene: (sceneId): SceneIdentity | null => (sceneId in state.tokens ? { id: sceneId, name: sceneId } : null),
    findActiveScene: (): SceneIdentity | null =>
      state.activeSceneId !== null ? { id: state.activeSceneId, name: state.activeSceneId } : null
  };
  const actors: ActorLocator = {
    findWorldActor: state.findWorldActor,
    findToken: (sceneId, tokenId) => state.tokens[sceneId]?.[tokenId] ?? null
  };
  return requireActor(scenes, actors, toActorTarget(address));
}

describe('requireActor', () => {
  it('resolves a world actor by actorId', () => {
    expect(resolve(world(), { actorId: 'a1' })).toEqual({
      id: 'a1',
      name: 'Goblin',
      ref: { kind: 'world', actorId: 'a1' }
    });
  });

  it('prefers tokenId and returns the token actor with the token id', () => {
    const state = world();

    expect(resolve(state, { actorId: 'a1', tokenId: 't1' })).toEqual({
      id: 'a1',
      name: 'Goblin 3',
      ref: { kind: 'token', sceneId: 's1', tokenId: 't1' }
    });
    expect(state.findWorldActor).not.toHaveBeenCalled();
  });

  it('looks the token up on the requested scene', () => {
    const state = world();

    expect(resolve(state, { tokenId: 't9', sceneId: 's2' }).ref).toEqual({ kind: 'token', sceneId: 's2', tokenId: 't9' });
    expect(() => resolve(state, { tokenId: 't9', sceneId: 'nope' })).toThrow('Scene not found: nope');
    expect(() => resolve(state, { tokenId: 't9', sceneId: 'nope' })).toThrow(SceneNotFoundError);
  });

  it('does not look for the token on another scene than the one it resolved', () => {
    expect(() => resolve(world(), { tokenId: 't9' })).toThrow('Token not found: t9');
  });

  it('ignores the scene of a world actor target', () => {
    expect(resolve(world(), { actorId: 'a1', sceneId: 'nope' }).ref).toEqual({ kind: 'world', actorId: 'a1' });
  });

  it('explains every failure', () => {
    const state = world();

    expect(() => resolve(state, {})).toThrow('Either actorId or tokenId is required');
    expect(() => resolve(state, {})).toThrow(ActorTargetRequiredError);
    expect(() => resolve(state, { actorId: 'zz' })).toThrow('Actor not found: zz');
    expect(() => resolve(state, { actorId: 'zz' })).toThrow(ActorNotFoundError);
    expect(() => resolve(state, { tokenId: 'zz' })).toThrow('Token not found: zz');
    expect(() => resolve(state, { tokenId: 'zz' })).toThrow(TargetTokenNotFoundError);

    state.tokens['s1'] = { t1: { id: 't1', actor: null } };
    expect(() => resolve(state, { tokenId: 't1' })).toThrow('Token has no actor: t1');
    expect(() => resolve(state, { tokenId: 't1' })).toThrow(TokenHasNoActorError);

    state.activeSceneId = null;
    expect(() => resolve(state, { tokenId: 't1' })).toThrow('No active scene');
    expect(() => resolve(state, { tokenId: 't1' })).toThrow(NoActiveSceneError);
  });
});
