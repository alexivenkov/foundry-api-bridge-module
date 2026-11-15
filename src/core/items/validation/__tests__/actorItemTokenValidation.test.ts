import { ValidationError } from '../../../../kernel';
import {
  addItemToActorRequestSchema,
  addItemToTokenActorRequestSchema,
  createItemRequestSchema,
  deleteActorItemRequestSchema,
  deleteTokenActorItemRequestSchema,
  getActorItemsRequestSchema,
  getTokenActorItemsRequestSchema,
  parseActorItemRequest,
  toAddActorItemCommand,
  toCreateItemCommand,
  toListActorItemsQuery,
  toRemoveActorItemCommand,
  toUpdateActorItemCommand,
  toUpdateItemCommand,
  updateActorItemRequestSchema,
  updateItemRequestSchema,
  updateTokenActorItemRequestSchema
} from '..';

describe('actor-item requests addressed to a token', () => {
  const listing = (params: unknown): ReturnType<typeof toListActorItemsQuery> =>
    toListActorItemsQuery(parseActorItemRequest(getActorItemsRequestSchema, getTokenActorItemsRequestSchema, params));

  it('reads a token id as the token target, with the scene it names or the active one', () => {
    expect(listing({ tokenId: 't3', sceneId: 'cave' }).target).toEqual({ kind: 'token', tokenId: 't3', sceneId: 'cave' });
    expect(listing({ tokenId: 't3', sceneId: '' }).target).toEqual({ kind: 'token', tokenId: 't3', sceneId: undefined });
    expect(listing({ tokenId: 't3', sceneId: null }).target).toEqual({ kind: 'token', tokenId: 't3', sceneId: undefined });
  });

  it('lets a token id win over an actor id', () => {
    expect(listing({ actorId: 'a1', tokenId: 't3' }).target).toEqual({ kind: 'token', tokenId: 't3', sceneId: undefined });
  });

  it('reads an empty or null token id as absent, and then requires the actor id as before', () => {
    expect(listing({ actorId: 'a1', tokenId: '' }).target).toEqual({ kind: 'actor', actorId: 'a1' });
    expect(listing({ actorId: 'a1', tokenId: null }).target).toEqual({ kind: 'actor', actorId: 'a1' });
    expect(() => listing({ tokenId: null })).toThrow(ValidationError);
    expect(() => listing({})).toThrow(/actorId/);
  });

  it('rejects a token id or scene id of the wrong type', () => {
    expect(() => listing({ tokenId: 3 })).toThrow(/tokenId/);
    expect(() => listing({ tokenId: 't3', sceneId: 4 })).toThrow(/sceneId/);
  });

  it('keeps the other fields of each command in the token form', () => {
    const add = parseActorItemRequest(addItemToActorRequestSchema, addItemToTokenActorRequestSchema, {
      tokenId: 't3',
      name: 'Rock',
      type: 'loot',
      sort: 7
    });
    const update = parseActorItemRequest(updateActorItemRequestSchema, updateTokenActorItemRequestSchema, {
      tokenId: 't3',
      itemId: 'club',
      name: 'Big Club'
    });
    const remove = parseActorItemRequest(deleteActorItemRequestSchema, deleteTokenActorItemRequestSchema, {
      tokenId: 't3',
      itemId: 'club'
    });

    expect(toAddActorItemCommand(add)).toEqual({
      target: { kind: 'token', tokenId: 't3', sceneId: undefined },
      draft: { name: 'Rock', type: 'loot', img: undefined, system: undefined, sort: 7 }
    });
    expect(toUpdateActorItemCommand(update).changes.name).toBe('Big Club');
    expect(toRemoveActorItemCommand(remove)).toEqual({
      target: { kind: 'token', tokenId: 't3', sceneId: undefined },
      itemId: 'club'
    });
    expect(() =>
      parseActorItemRequest(updateActorItemRequestSchema, updateTokenActorItemRequestSchema, { tokenId: 't3' })
    ).toThrow(/itemId/);
  });
});

describe('item sort position', () => {
  it('passes an integer sort on', () => {
    expect(toCreateItemCommand(createItemRequestSchema.parse({ name: 'Sword', type: 'weapon', sort: -300 })).draft.sort).toBe(-300);
    expect(toUpdateItemCommand(updateItemRequestSchema.parse({ itemId: 'i1', sort: 0 })).changes.sort).toBe(0);
  });

  it.each([
    ['create-item', createItemRequestSchema, { name: 'Sword', type: 'weapon', sort: 1.5 }],
    ['update-item', updateItemRequestSchema, { itemId: 'i1', sort: '3' }],
    ['add-item-to-actor', addItemToActorRequestSchema, { actorId: 'a1', name: 'Sword', type: 'weapon', sort: 2.5 }],
    ['update-actor-item', updateActorItemRequestSchema, { actorId: 'a1', itemId: 'i1', sort: Number.NaN }]
  ])('%s rejects a sort the core would round or cast', (_command, schema, request) => {
    expect(schema.safeParse(request).success).toBe(false);
  });
});
