import { z } from 'zod';
import { ValidationError } from '../../../../kernel';
import { ActorTargetRequiredError } from '../../domain';
import { actorTargetRequestShape, readActorTarget } from '../actorTargetRequest';

describe('actorTargetRequestShape', () => {
  const schema = z.object({ ...actorTargetRequestShape, name: z.string().optional() });

  it('keeps the address fields whatever their type, and adds none that were not sent', () => {
    expect(schema.parse({ actorId: null, tokenId: 't1', sceneId: 5 })).toEqual({ actorId: null, tokenId: 't1', sceneId: 5 });
    expect(schema.parse({ actorId: 'a1' })).toEqual({ actorId: 'a1' });
    expect(schema.parse({})).toEqual({});
  });
});

describe('readActorTarget', () => {
  it('reads a world actor target', () => {
    expect(readActorTarget({ actorId: 'a1' })).toEqual({ kind: 'actor', actorId: 'a1' });
  });

  it('reads a token target, with or without a scene', () => {
    expect(readActorTarget({ tokenId: 't1' })).toEqual({ kind: 'token', tokenId: 't1', sceneId: undefined });
    expect(readActorTarget({ tokenId: 't1', sceneId: 's2' })).toEqual({ kind: 'token', tokenId: 't1', sceneId: 's2' });
  });

  it('lets the token win and does not look at the actor id then', () => {
    expect(readActorTarget({ actorId: 'a1', tokenId: 't1' }).kind).toBe('token');
    expect(readActorTarget({ actorId: null, tokenId: 't1' })).toEqual({ kind: 'token', tokenId: 't1', sceneId: undefined });
    expect(readActorTarget({ actorId: 5, tokenId: 't1' }).kind).toBe('token');
  });

  it('does not look at the scene of a world actor target', () => {
    expect(readActorTarget({ actorId: 'a1', sceneId: null })).toEqual({ kind: 'actor', actorId: 'a1' });
    expect(readActorTarget({ actorId: 'a1', sceneId: 5 })).toEqual({ kind: 'actor', actorId: 'a1' });
  });

  it('keeps empty ids as ids', () => {
    expect(readActorTarget({ tokenId: '', sceneId: '' })).toEqual({ kind: 'token', tokenId: '', sceneId: '' });
    expect(readActorTarget({ actorId: '' })).toEqual({ kind: 'actor', actorId: '' });
  });

  it.each([
    ['a token id that is not a string', { tokenId: 5 }, 'tokenId: '],
    ['a null token id, even next to an actor id', { actorId: 'a1', tokenId: null }, 'tokenId: '],
    ['a scene id that is not a string, next to a token id', { tokenId: 't1', sceneId: null }, 'sceneId: '],
    ['an actor id that is not a string', { actorId: null }, 'actorId: ']
  ])('rejects %s', (_case, request, field) => {
    expect(() => readActorTarget(request)).toThrow(ValidationError);
    expect(() => readActorTarget(request)).toThrow(field);
  });

  it('requires one of the two ids', () => {
    expect(() => readActorTarget({})).toThrow(ActorTargetRequiredError);
    expect(() => readActorTarget({ sceneId: 's1' })).toThrow('Either actorId or tokenId is required');
  });
});
