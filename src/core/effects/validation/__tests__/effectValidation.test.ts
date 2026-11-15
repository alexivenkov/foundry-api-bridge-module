import { ValidationError } from '../../../../kernel';
import { ActorTargetRequiredError } from '../../../shared';
import {
  addActorEffectRequestSchema,
  getActorEffectsRequestSchema,
  removeActorEffectRequestSchema,
  toAddEffectCommand,
  toListEffectsQuery,
  toRemoveEffectCommand,
  toToggleStatusCommand,
  toUpdateEffectCommand,
  toggleActorStatusRequestSchema,
  updateActorEffectRequestSchema
} from '..';

describe('effect request schemas', () => {
  it('accepts a new effect with only a name', () => {
    expect(addActorEffectRequestSchema.safeParse({ actorId: 'a1', name: 'Haste' }).success).toBe(true);
  });

  it.each([
    ['no name', { actorId: 'a1' }],
    ['statuses that are not a list of strings', { actorId: 'a1', name: 'x', statuses: 'prone' }],
    ['changes that are not a list', { actorId: 'a1', name: 'x', changes: { key: 'k' } }],
    ['a change that is not an object', { actorId: 'a1', name: 'x', changes: ['k=1'] }],
    ['a duration that is not an object', { actorId: 'a1', name: 'x', duration: 10 }],
    ['a non-boolean disabled flag', { actorId: 'a1', name: 'x', disabled: 'yes' }]
  ])('rejects a new effect with %s', (_case, request) => {
    expect(addActorEffectRequestSchema.safeParse(request).success).toBe(false);
  });

  it('keeps changes and duration as given, keys of any Foundry version included', () => {
    const request = {
      actorId: 'a1',
      name: 'Shield',
      changes: [
        { key: 'system.attributes.ac.bonus', value: '2', mode: 2, priority: 20 },
        { key: 'system.attributes.hp.temp', value: 5, type: 'add' }
      ],
      duration: { value: 3, units: 'rounds', rounds: 3 }
    };

    expect(addActorEffectRequestSchema.parse(request)).toEqual(request);
    expect(updateActorEffectRequestSchema.parse({ ...request, effectId: 'e1' })).toEqual({ ...request, effectId: 'e1' });
  });

  it('lets null clear the icon and the origin', () => {
    expect(addActorEffectRequestSchema.parse({ actorId: 'a1', name: 'x', img: null, origin: null })).toEqual({
      actorId: 'a1',
      name: 'x',
      img: null,
      origin: null
    });
  });

  it('ignores unknown keys', () => {
    expect(removeActorEffectRequestSchema.parse({ actorId: 'a1', effectId: 'e1', force: true })).toEqual({
      actorId: 'a1',
      effectId: 'e1'
    });
  });

  it('requires the effect id for update and remove, and the status id for toggle', () => {
    expect(updateActorEffectRequestSchema.safeParse({ actorId: 'a1', name: 'x' }).success).toBe(false);
    expect(removeActorEffectRequestSchema.safeParse({ actorId: 'a1' }).success).toBe(false);
    expect(toggleActorStatusRequestSchema.safeParse({ actorId: 'a1' }).success).toBe(false);
  });

  it('accepts an update that changes nothing', () => {
    expect(updateActorEffectRequestSchema.safeParse({ tokenId: 't1', effectId: 'e1' }).success).toBe(true);
  });

  it('leaves the choice between actor and token to the target', () => {
    expect(getActorEffectsRequestSchema.safeParse({}).success).toBe(true);
    expect(toggleActorStatusRequestSchema.safeParse({ statusId: 'prone' }).success).toBe(true);
  });

  it('rejects flags and ids of the wrong type', () => {
    expect(getActorEffectsRequestSchema.safeParse({ actorId: 'a1', includeDisabled: 'false' }).success).toBe(false);
    expect(toggleActorStatusRequestSchema.safeParse({ actorId: 'a1', statusId: 'prone', active: 1 }).success).toBe(false);
    expect(toggleActorStatusRequestSchema.safeParse({ actorId: 'a1', statusId: 5 }).success).toBe(false);
    expect(removeActorEffectRequestSchema.safeParse({ actorId: 'a1', effectId: null }).success).toBe(false);
  });

  it('leaves the fields that address the actor to the request mappers', () => {
    expect(getActorEffectsRequestSchema.parse({ actorId: 5, tokenId: 't1', sceneId: null })).toEqual({
      actorId: 5,
      tokenId: 't1',
      sceneId: null
    });
  });
});

describe('effect request mappers', () => {
  it('includes disabled effects unless told otherwise', () => {
    expect(toListEffectsQuery({ actorId: 'a1' }).includeDisabled).toBe(true);
    expect(toListEffectsQuery({ actorId: 'a1', includeDisabled: null }).includeDisabled).toBe(true);
    expect(toListEffectsQuery({ actorId: 'a1', includeDisabled: false }).includeDisabled).toBe(false);
  });

  it('addresses a token when a tokenId is given, on the named scene', () => {
    expect(toListEffectsQuery({ actorId: 'a1', tokenId: 't3', sceneId: 's2' }).target).toEqual({
      kind: 'token',
      tokenId: 't3',
      sceneId: 's2'
    });
  });

  it('maps a toggle with the options that were given', () => {
    expect(toToggleStatusCommand({ actorId: 'a1', statusId: 'prone', active: true })).toEqual({
      target: { kind: 'actor', actorId: 'a1' },
      statusId: 'prone',
      options: { active: true, overlay: undefined }
    });
  });

  it('maps a new effect to a draft', () => {
    const command = toAddEffectCommand({
      tokenId: 't3',
      name: 'Haste',
      img: 'haste.webp',
      disabled: false,
      origin: 'Actor.a1',
      statuses: ['hasted'],
      changes: [{ key: 'k', value: '1', mode: 2 }],
      duration: { rounds: 10 }
    });

    expect(command).toEqual({
      target: { kind: 'token', tokenId: 't3', sceneId: undefined },
      draft: {
        name: 'Haste',
        img: 'haste.webp',
        disabled: false,
        origin: 'Actor.a1',
        statuses: ['hasted'],
        changes: [{ key: 'k', value: '1', mode: 2 }],
        duration: { rounds: 10 }
      }
    });
  });

  it('maps an update and a removal', () => {
    expect(toUpdateEffectCommand({ actorId: 'a1', effectId: 'e1', disabled: true })).toEqual({
      target: { kind: 'actor', actorId: 'a1' },
      effectId: 'e1',
      changes: { name: undefined, img: undefined, disabled: true, changes: undefined, duration: undefined }
    });
    expect(toRemoveEffectCommand({ actorId: 'a1', effectId: 'e1' })).toEqual({
      target: { kind: 'actor', actorId: 'a1' },
      effectId: 'e1'
    });
  });

  it('does not look at an address field the target does not need', () => {
    expect(toRemoveEffectCommand({ actorId: 'a1', sceneId: null, effectId: 'e1' }).target).toEqual({
      kind: 'actor',
      actorId: 'a1'
    });
    expect(toToggleStatusCommand({ actorId: null, tokenId: 't3', statusId: 'prone' }).target).toEqual({
      kind: 'token',
      tokenId: 't3',
      sceneId: undefined
    });
  });

  it('rejects an address field of the wrong type when the target needs it', () => {
    expect(() => toListEffectsQuery({ actorId: 5 })).toThrow(ValidationError);
    expect(() => toListEffectsQuery({ tokenId: 't3', sceneId: null })).toThrow('sceneId: ');
  });

  it('rejects a request that names neither an actor nor a token', () => {
    expect(() => toToggleStatusCommand({ statusId: 'prone' })).toThrow(ActorTargetRequiredError);
    expect(() => toListEffectsQuery({})).toThrow('Either actorId or tokenId is required');
  });
});
