import { ValidationError } from '../../../../kernel';
import { ActorTargetRequiredError } from '../../../shared';
import {
  createActorRequestSchema,
  deleteActorRequestSchema,
  getActorRequestSchema,
  toCreateActorCommand,
  toDeleteActorCommand,
  toGetActorQuery,
  toUpdateActorCommand,
  updateActorRequestSchema
} from '..';

describe('actor request schemas', () => {
  it('accepts a new actor with only a name and a type', () => {
    expect(createActorRequestSchema.safeParse({ name: 'Orc', type: 'npc' }).success).toBe(true);
  });

  it.each([
    ['no name', { type: 'npc' }],
    ['no type', { name: 'Orc' }],
    ['a non-string name', { name: 5, type: 'npc' }],
    ['system data that is not an object', { name: 'Orc', type: 'npc', system: 'cr 1' }]
  ])('rejects a new actor with %s', (_case, request) => {
    expect(createActorRequestSchema.safeParse(request).success).toBe(false);
  });

  it('keeps system data as given, whatever is inside', () => {
    const system = { attributes: { hp: { value: 15, max: 15 } }, traits: ['goblinoid'], cr: 0.25 };

    expect(createActorRequestSchema.parse({ name: 'Orc', type: 'npc', system }).system).toEqual(system);
  });

  it('lets null clear the folder and the image', () => {
    expect(updateActorRequestSchema.parse({ actorId: 'a1', folder: null, img: null })).toEqual({
      actorId: 'a1',
      folder: null,
      img: null
    });
  });

  it('ignores unknown keys', () => {
    expect(updateActorRequestSchema.parse({ actorId: 'a1', hp: 5 })).toEqual({ actorId: 'a1' });
  });

  it('accepts an update that addresses a token, or changes nothing', () => {
    expect(updateActorRequestSchema.safeParse({ tokenId: 't1', sceneId: 's1' }).success).toBe(true);
    expect(updateActorRequestSchema.safeParse({ actorId: 'a1' }).success).toBe(true);
  });

  it('leaves the choice between actor and token to the target', () => {
    expect(updateActorRequestSchema.safeParse({ name: 'x' }).success).toBe(true);
  });

  it('rejects ids that are not strings', () => {
    expect(getActorRequestSchema.safeParse({}).success).toBe(false);
    expect(getActorRequestSchema.safeParse({ actorId: 5 }).success).toBe(false);
    expect(deleteActorRequestSchema.safeParse({ actorId: null }).success).toBe(false);
  });

  it('leaves the fields that address the actor of an update to the request mapper', () => {
    expect(updateActorRequestSchema.parse({ actorId: null, tokenId: 't1', sceneId: 5 })).toEqual({
      actorId: null,
      tokenId: 't1',
      sceneId: 5
    });
  });

  it('accepts an empty actor id, which simply finds no actor', () => {
    expect(getActorRequestSchema.safeParse({ actorId: '' }).success).toBe(true);
  });
});

describe('actor request mappers', () => {
  it('maps the wire folder to a folder id', () => {
    const command = toCreateActorCommand({ name: 'Orc', type: 'npc', folder: 'f1', img: 'orc.webp', system: { cr: 1 } });

    expect(command).toEqual({
      draft: { name: 'Orc', type: 'npc', folderId: 'f1', img: 'orc.webp', system: { cr: 1 } }
    });
  });

  it('addresses a world actor by actorId', () => {
    expect(toUpdateActorCommand({ actorId: 'a1', name: 'Boss' })).toEqual({
      target: { kind: 'actor', actorId: 'a1' },
      changes: { name: 'Boss', img: undefined, folderId: undefined, system: undefined }
    });
  });

  it('addresses a token when a tokenId is given, even next to an actorId', () => {
    expect(toUpdateActorCommand({ actorId: 'a1', tokenId: 't1', sceneId: 's1' }).target).toEqual({
      kind: 'token',
      tokenId: 't1',
      sceneId: 's1'
    });
  });

  it('does not read an empty scene id as "the active scene"', () => {
    expect(toUpdateActorCommand({ tokenId: 't1', sceneId: '' }).target).toEqual({
      kind: 'token',
      tokenId: 't1',
      sceneId: ''
    });
  });

  it('does not look at an address field the target does not need', () => {
    expect(toUpdateActorCommand({ actorId: null, tokenId: 't1' }).target).toEqual({
      kind: 'token',
      tokenId: 't1',
      sceneId: undefined
    });
    expect(toUpdateActorCommand({ actorId: 'a1', sceneId: null }).target).toEqual({ kind: 'actor', actorId: 'a1' });
  });

  it('rejects an address field of the wrong type when the target needs it', () => {
    expect(() => toUpdateActorCommand({ actorId: 5 })).toThrow(ValidationError);
    expect(() => toUpdateActorCommand({ tokenId: null })).toThrow('tokenId: ');
    expect(() => toUpdateActorCommand({ tokenId: 't1', sceneId: null })).toThrow('sceneId: ');
  });

  it('rejects an update that names neither an actor nor a token', () => {
    expect(() => toUpdateActorCommand({ name: 'x' })).toThrow(ActorTargetRequiredError);
    expect(() => toUpdateActorCommand({ sceneId: 's1' })).toThrow('Either actorId or tokenId is required');
  });

  it('maps the id-only requests', () => {
    expect(toGetActorQuery({ actorId: 'a1' })).toEqual({ actorId: 'a1' });
    expect(toDeleteActorCommand({ actorId: 'a1' })).toEqual({ actorId: 'a1' });
  });
});
