import { resolveSwadeActor, resolveSwadeTargetToken } from '../resolveSwadeActor';
import { makeActor, makeGame } from '../../__tests__/swadeTestFixtures';

describe('resolveSwadeActor', () => {
  const actor = makeActor({ id: 'a1' });
  const tokenActor = makeActor({ id: 'a-token', name: 'Goblin' });
  const game = makeGame({ actors: [actor], tokens: [{ id: 't1', name: 'Goblin 3', actor: tokenActor }, { id: 't2', name: 'Empty', actor: null }] });

  it('resolves a world actor by actorId', () => {
    expect(resolveSwadeActor(game, { actorId: 'a1', tokenId: undefined, sceneId: undefined })).toEqual({ actor });
  });

  it("resolves a token's actor by tokenId on the active scene and echoes the token", () => {
    expect(resolveSwadeActor(game, { actorId: undefined, tokenId: 't1', sceneId: undefined })).toEqual({ actor: tokenActor, tokenId: 't1' });
    expect(resolveSwadeActor(game, { actorId: undefined, tokenId: 't1', sceneId: 's1' }).tokenId).toBe('t1');
  });

  it('prefers the token when both are given', () => {
    expect(resolveSwadeActor(game, { actorId: 'a1', tokenId: 't1', sceneId: undefined }).actor).toBe(tokenActor);
  });

  it('fails with the contract texts', () => {
    expect(() => resolveSwadeActor(game, { actorId: 'nope', tokenId: undefined, sceneId: undefined })).toThrow('Actor not found: nope');
    expect(() => resolveSwadeActor(game, { actorId: undefined, tokenId: 'zz', sceneId: undefined })).toThrow('Token not found on active scene: zz');
    expect(() => resolveSwadeActor(game, { actorId: undefined, tokenId: 'zz', sceneId: 's1' })).toThrow('Token not found on scene s1: zz');
    expect(() => resolveSwadeActor(game, { actorId: undefined, tokenId: 't1', sceneId: 's9' })).toThrow('Scene not found: s9');
    expect(() => resolveSwadeActor(game, { actorId: undefined, tokenId: 't2', sceneId: undefined })).toThrow('Token has no actor: t2');
    expect(() => resolveSwadeActor(game, { actorId: undefined, tokenId: undefined, sceneId: undefined })).toThrow('Either actorId or tokenId is required');
    expect(() => resolveSwadeActor(makeGame({ noActiveScene: true }), { actorId: undefined, tokenId: 't1', sceneId: undefined })).toThrow('No active scene');
  });

  it('resolves a target token with its name', () => {
    expect(resolveSwadeTargetToken(game, 't1', undefined)).toEqual({ tokenId: 't1', name: 'Goblin 3', actor: tokenActor });
    expect(() => resolveSwadeTargetToken(game, 'zz', undefined)).toThrow('Target token not found: zz');
    expect(() => resolveSwadeTargetToken(game, 't2', undefined)).toThrow('Token has no actor: t2');
  });
});
