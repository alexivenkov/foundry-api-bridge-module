import { resolveCoc7Actor, resolveCoc7TargetToken } from '../resolveCoc7Actor';
import { makeActor, makeGame } from '@/systems/coc7/shared/__tests__/coc7TestFixtures';

describe('resolveCoc7Actor', () => {
  it('finds a world actor by id', () => {
    const actor = makeActor();
    const resolved = resolveCoc7Actor(makeGame({ actors: [actor] }), { actorId: 'a1', tokenId: undefined, sceneId: undefined });
    expect(resolved.actor).toBe(actor);
    expect(resolved.tokenId).toBeUndefined();
    expect(resolved.token).toBeUndefined();
  });

  it("finds a token's actor on the active scene and echoes the token", () => {
    const ghoul = makeActor({ id: 'g1', type: 'creature' });
    const token = { id: 't1', name: 'Ghoul', actor: ghoul };
    const resolved = resolveCoc7Actor(makeGame({ tokens: [token] }), { actorId: undefined, tokenId: 't1', sceneId: undefined });
    expect(resolved).toEqual({ actor: ghoul, tokenId: 't1', token });
  });

  it('finds a token on a given scene', () => {
    const ghoul = makeActor({ id: 'g1' });
    const game = makeGame({ tokens: [{ id: 't1', name: 'Ghoul', actor: ghoul }], sceneId: 'scene-9' });
    expect(resolveCoc7Actor(game, { actorId: undefined, tokenId: 't1', sceneId: 'scene-9' }).actor).toBe(ghoul);
  });

  it.each([
    [{ actorId: 'nope', tokenId: undefined, sceneId: undefined }, {}, 'Actor not found: nope'],
    [{ actorId: undefined, tokenId: 't9', sceneId: undefined }, {}, 'Token not found on active scene: t9'],
    [{ actorId: undefined, tokenId: 't9', sceneId: 's1' }, {}, 'Token not found on scene s1: t9'],
    [{ actorId: undefined, tokenId: 't1', sceneId: 'other' }, {}, 'Scene not found: other'],
    [{ actorId: undefined, tokenId: 't1', sceneId: undefined }, { noActiveScene: true }, 'No active scene'],
    [{ actorId: undefined, tokenId: 'empty', sceneId: undefined }, { tokens: [{ id: 'empty', name: 'Empty', actor: null }] }, 'Token has no actor: empty'],
    [{ actorId: undefined, tokenId: undefined, sceneId: undefined }, {}, 'Either actorId or tokenId is required']
  ])('rejects %j with the contract text', (target, gameOptions, message) => {
    expect(() => resolveCoc7Actor(makeGame(gameOptions), target)).toThrow(message);
  });
});

describe('resolveCoc7TargetToken', () => {
  it('finds a target token with its actor', () => {
    const ghoul = makeActor({ id: 'g1' });
    const game = makeGame({ tokens: [{ id: 't1', name: 'Ghoul', actor: ghoul }] });
    expect(resolveCoc7TargetToken(game, 't1', undefined)).toEqual({ tokenId: 't1', name: 'Ghoul', actor: ghoul });
  });

  it('rejects a missing target token', () => {
    expect(() => resolveCoc7TargetToken(makeGame(), 't1', undefined)).toThrow('Target token not found: t1');
  });
});
