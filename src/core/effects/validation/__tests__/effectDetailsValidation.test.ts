import { ActorTargetRequiredError } from '../../../shared';
import {
  addActorEffectRequestSchema,
  createItemEffectRequestSchema,
  deleteItemEffectRequestSchema,
  getActorEffectRequestSchema,
  getItemEffectsRequestSchema,
  toAddEffectCommand,
  toCreateItemEffectCommand,
  toDeleteItemEffectCommand,
  toGetActorEffectQuery,
  toListItemEffectsQuery,
  toUpdateEffectCommand,
  toUpdateItemEffectCommand,
  updateActorEffectRequestSchema,
  updateItemEffectRequestSchema
} from '..';

describe('item-effect request schemas', () => {
  it('requires a non-empty item id and reads an empty or null owner id as absent', () => {
    expect(getItemEffectsRequestSchema.safeParse({ itemId: '' }).success).toBe(false);
    expect(getItemEffectsRequestSchema.safeParse({}).success).toBe(false);
    expect(toListItemEffectsQuery(getItemEffectsRequestSchema.parse({ itemId: 'ring', actorId: '', tokenId: null, sceneId: '' }))).toEqual({
      item: { itemId: 'ring', owner: null }
    });
  });

  it('names an owned item by actor id, or by token id (which wins) with an optional scene', () => {
    expect(toListItemEffectsQuery(getItemEffectsRequestSchema.parse({ itemId: 'sword', actorId: 'a1' }))).toEqual({
      item: { itemId: 'sword', owner: { kind: 'actor', actorId: 'a1' } }
    });
    expect(toDeleteItemEffectCommand(deleteItemEffectRequestSchema.parse({ itemId: 'club', actorId: 'a1', tokenId: 't3', sceneId: 'cave', effectId: 'e' }))).toEqual({
      item: { itemId: 'club', owner: { kind: 'token', tokenId: 't3', sceneId: 'cave' } },
      effectId: 'e'
    });
  });

  it('accepts every attribute in range, expanding a short tint and dropping duplicate statuses', () => {
    const request = createItemEffectRequestSchema.parse({
      itemId: 'ring',
      name: 'Shield',
      type: 'base',
      img: null,
      disabled: false,
      transfer: true,
      description: '<p>+2</p>',
      tint: '#F80',
      origin: 'Item.abcdefghijklmnop',
      statuses: ['shielded', 'shielded'],
      sort: -10,
      changes: [{ key: 'system.attributes.ac.bonus', type: 'add', value: 2, priority: null, phase: 'initial' }],
      duration: { value: 10, units: 'rounds', expiry: null },
      showIcon: 'always',
      system: { level: 1 },
      unknown: 'ignored'
    });

    expect(toCreateItemEffectCommand(request)).toEqual({
      item: { itemId: 'ring', owner: null },
      draft: {
        name: 'Shield',
        type: 'base',
        img: null,
        disabled: false,
        transfer: true,
        description: '<p>+2</p>',
        tint: '#ff8800',
        origin: 'Item.abcdefghijklmnop',
        statuses: ['shielded'],
        sort: -10,
        changes: [{ key: 'system.attributes.ac.bonus', type: 'add', value: 2, priority: null, phase: 'initial' }],
        duration: { value: 10, units: 'rounds', expiry: null },
        showIcon: 'always',
        system: { level: 1 }
      }
    });
  });

  it.each([
    ['an empty name', { name: '' }],
    ['a tint that is not a hex color', { name: 'x', tint: 'red' }],
    ['a fractional sort', { name: 'x', sort: 1.5 }],
    ['a fractional duration', { name: 'x', duration: { value: 1.5, units: 'rounds' } }],
    ['a zero duration', { name: 'x', duration: { value: 0, units: 'rounds' } }],
    ['an unknown duration unit', { name: 'x', duration: { value: 1, units: 'weeks' } }],
    ['an unknown icon visibility', { name: 'x', showIcon: 'sometimes' }],
    ['a change without a key', { name: 'x', changes: [{ key: '', type: 'add', value: 1 }] }],
    ['a change with an object value', { name: 'x', changes: [{ key: 'a', type: 'add', value: { x: 1 } }] }],
    ['an empty status', { name: 'x', statuses: [''] }],
    ['an empty origin', { name: 'x', origin: '' }],
    ['an empty image', { name: 'x', img: '' }]
  ])('rejects %s', (_case, attributes) => {
    expect(createItemEffectRequestSchema.safeParse({ itemId: 'ring', ...attributes }).success).toBe(false);
  });

  it('maps a partial update, keeping null as "clear" and absent as "keep"', () => {
    const request = updateItemEffectRequestSchema.parse({ itemId: 'ring', effectId: 'aura', origin: null, duration: null });

    expect(toUpdateItemEffectCommand(request)).toEqual({
      item: { itemId: 'ring', owner: null },
      effectId: 'aura',
      changes: {
        name: undefined,
        img: undefined,
        disabled: undefined,
        transfer: undefined,
        description: undefined,
        tint: undefined,
        origin: null,
        statuses: undefined,
        sort: undefined,
        changes: undefined,
        duration: null,
        showIcon: undefined,
        system: undefined
      }
    });
    expect(updateItemEffectRequestSchema.safeParse({ itemId: 'ring' }).success).toBe(false);
  });
});

describe('get-actor-effect request', () => {
  it('addresses an actor or a token and requires one of them', () => {
    expect(toGetActorEffectQuery(getActorEffectRequestSchema.parse({ actorId: 'a1', sceneId: null, effectId: 'e' }))).toEqual({
      target: { kind: 'actor', actorId: 'a1' },
      effectId: 'e'
    });
    expect(toGetActorEffectQuery(getActorEffectRequestSchema.parse({ tokenId: 't3', sceneId: '', effectId: 'e' }))).toEqual({
      target: { kind: 'token', tokenId: 't3', sceneId: undefined },
      effectId: 'e'
    });
    expect(() => toGetActorEffectQuery(getActorEffectRequestSchema.parse({ actorId: '', effectId: 'e' }))).toThrow(
      ActorTargetRequiredError
    );
    expect(getActorEffectRequestSchema.safeParse({ actorId: 'a1' }).success).toBe(false);
  });
});

describe('actor-effect requests, added attributes', () => {
  it('passes the new attributes of a new effect on', () => {
    const request = addActorEffectRequestSchema.parse({
      actorId: 'a1',
      name: 'Haste',
      type: 'enchantment',
      system: { level: 3 },
      description: '<p>Fast.</p>',
      sort: 5,
      showIcon: 'never'
    });

    expect(toAddEffectCommand(request).draft).toMatchObject({
      type: 'enchantment',
      system: { level: 3 },
      description: '<p>Fast.</p>',
      sort: 5,
      showIcon: 'never'
    });
  });

  it('passes tint, origin and statuses of an update on, expanding the tint and dropping duplicate statuses', () => {
    const request = updateActorEffectRequestSchema.parse({
      actorId: 'a1',
      effectId: 'e1',
      tint: '#ABC',
      origin: null,
      statuses: ['prone', 'prone']
    });

    expect(toUpdateEffectCommand(request).changes).toMatchObject({ tint: '#aabbcc', origin: null, statuses: ['prone'] });
  });

  it.each([
    ['add', addActorEffectRequestSchema, { actorId: 'a1', name: 'x', sort: 0.5 }],
    ['add', addActorEffectRequestSchema, { actorId: 'a1', name: 'x', type: '' }],
    ['add', addActorEffectRequestSchema, { actorId: 'a1', name: 'x', showIcon: 2 }],
    ['update', updateActorEffectRequestSchema, { actorId: 'a1', effectId: 'e', tint: '#12345' }],
    ['update', updateActorEffectRequestSchema, { actorId: 'a1', effectId: 'e', statuses: [''] }],
    ['update', updateActorEffectRequestSchema, { actorId: 'a1', effectId: 'e', origin: '' }]
  ])('validates the new attributes of %s strictly', (_command, schema, request) => {
    expect(schema.safeParse(request).success).toBe(false);
  });

  it('keeps ignoring a tint on a new effect, as the command always has', () => {
    const request = addActorEffectRequestSchema.parse({ actorId: 'a1', name: 'x', tint: 'not even a color' });

    expect(toAddEffectCommand(request).draft).not.toHaveProperty('tint');
  });
});
