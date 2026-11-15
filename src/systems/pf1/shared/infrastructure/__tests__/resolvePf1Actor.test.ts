import { resolvePf1Actor } from '../resolvePf1Actor';
import { makeActor, makeGame } from '@/systems/pf1/shared/__tests__/pf1TestFixtures';

describe('resolvePf1Actor', () => {
  const actor = makeActor();
  const goblin = makeActor({ id: 'g1', name: 'Goblin', type: 'npc' });
  const game = makeGame({
    actors: [actor],
    tokens: [
      { id: 't1', name: 'Goblin', actor: goblin },
      { id: 't2', name: 'Marker', actor: null }
    ]
  });

  it('resolves a world actor by id', () => {
    expect(resolvePf1Actor(game, { actorId: 'a1', tokenId: undefined, sceneId: undefined })).toEqual({ actor });
  });

  it('resolves a token actor on the active or a named scene, token first', () => {
    expect(resolvePf1Actor(game, { actorId: 'a1', tokenId: 't1', sceneId: undefined })).toEqual({ actor: goblin, tokenId: 't1' });
    expect(resolvePf1Actor(game, { actorId: undefined, tokenId: 't1', sceneId: 's1' }).actor).toBe(goblin);
  });

  it('explains every miss', () => {
    expect(() => resolvePf1Actor(game, { actorId: 'zz', tokenId: undefined, sceneId: undefined })).toThrow('zz');
    expect(() => resolvePf1Actor(game, { actorId: undefined, tokenId: 'tx', sceneId: undefined })).toThrow('Token not found on active scene: tx');
    expect(() => resolvePf1Actor(game, { actorId: undefined, tokenId: 't1', sceneId: 'sx' })).toThrow('Scene not found: sx');
    expect(() => resolvePf1Actor(game, { actorId: undefined, tokenId: 't2', sceneId: undefined })).toThrow('Token has no actor: t2');
    expect(() => resolvePf1Actor(game, { actorId: undefined, tokenId: undefined, sceneId: undefined })).toThrow('Either actorId or tokenId is required');
  });

  it('needs an active scene for a token without sceneId', () => {
    const noScene = { ...game, scenes: { get: () => undefined, active: null } };
    expect(() => resolvePf1Actor(noScene, { actorId: undefined, tokenId: 't1', sceneId: undefined })).toThrow('No active scene');
  });
});
