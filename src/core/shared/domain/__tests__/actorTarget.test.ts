import { ActorTargetRequiredError } from '../errors/actorTargetErrors';
import { targetTokenId, toActorTarget, type LocatedActor } from '../model/ActorTarget';

describe('toActorTarget', () => {
  it('addresses a world actor by its id', () => {
    expect(toActorTarget({ actorId: 'a1' })).toEqual({ kind: 'actor', actorId: 'a1' });
  });

  it('addresses a token on the active scene when no scene is named', () => {
    expect(toActorTarget({ tokenId: 't1' })).toEqual({ kind: 'token', tokenId: 't1', sceneId: undefined });
  });

  it('keeps the scene of a token', () => {
    expect(toActorTarget({ tokenId: 't1', sceneId: 's2' })).toEqual({ kind: 'token', tokenId: 't1', sceneId: 's2' });
  });

  it('lets the token win when both ids are given', () => {
    expect(toActorTarget({ actorId: 'a1', tokenId: 't1' }).kind).toBe('token');
  });

  it('drops the scene of a world actor', () => {
    expect(toActorTarget({ actorId: 'a1', sceneId: 's2' })).toEqual({ kind: 'actor', actorId: 'a1' });
  });

  it('reads an empty id as an id, not as a missing one', () => {
    expect(toActorTarget({ actorId: 'a1', tokenId: '' })).toEqual({ kind: 'token', tokenId: '', sceneId: undefined });
    expect(toActorTarget({ actorId: '' })).toEqual({ kind: 'actor', actorId: '' });
  });

  it('requires one of the two ids', () => {
    expect(() => toActorTarget({})).toThrow(ActorTargetRequiredError);
    expect(() => toActorTarget({ sceneId: 's1' })).toThrow('Either actorId or tokenId is required');
  });
});

describe('targetTokenId', () => {
  const actor = { id: 'a1', name: 'Goblin' };

  it('names the token the actor was reached through', () => {
    const located: LocatedActor = { ...actor, ref: { kind: 'token', sceneId: 's1', tokenId: 't1' } };

    expect(targetTokenId(located)).toBe('t1');
  });

  it('is undefined for a world actor', () => {
    const located: LocatedActor = { ...actor, ref: { kind: 'world', actorId: 'a1' } };

    expect(targetTokenId(located)).toBeUndefined();
  });
});
