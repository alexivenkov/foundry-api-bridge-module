import {
  addItemToActorRequestSchema,
  createItemRequestSchema,
  deleteActorItemRequestSchema,
  deleteItemRequestSchema,
  getActorItemsRequestSchema,
  getItemRequestSchema,
  toAddActorItemCommand,
  toCreateItemCommand,
  toDeleteItemCommand,
  toGetItemQuery,
  toListActorItemsQuery,
  toRemoveActorItemCommand,
  toUpdateActorItemCommand,
  toUpdateItemCommand,
  updateActorItemRequestSchema,
  updateItemRequestSchema
} from '..';

describe('world item request schemas', () => {
  it('accepts a new item with only a name and a type', () => {
    expect(createItemRequestSchema.safeParse({ name: 'Cask', type: 'loot' }).success).toBe(true);
  });

  it.each([
    ['no name', { type: 'loot' }],
    ['no type', { name: 'Cask' }],
    ['system data that is not an object', { name: 'Cask', type: 'loot', system: [1, 2] }]
  ])('rejects a new item with %s', (_case, request) => {
    expect(createItemRequestSchema.safeParse(request).success).toBe(false);
  });

  it('lets a null folder move the item to the root, and a null image clear it', () => {
    expect(updateItemRequestSchema.parse({ itemId: 'i1', folder: null, img: null })).toEqual({
      itemId: 'i1',
      folder: null,
      img: null
    });
  });

  it('keeps system data as given and ignores unknown keys', () => {
    const system = { damage: { parts: [['2d8', 'slashing']] }, rarity: 'rare' };

    expect(updateItemRequestSchema.parse({ itemId: 'i1', system, color: 'red' })).toEqual({ itemId: 'i1', system });
  });

  it('requires the item id for get, update and delete', () => {
    expect(getItemRequestSchema.safeParse({}).success).toBe(false);
    expect(updateItemRequestSchema.safeParse({ name: 'x' }).success).toBe(false);
    expect(deleteItemRequestSchema.safeParse({ itemId: 7 }).success).toBe(false);
  });

  it('accepts an empty item id, which simply finds no item', () => {
    expect(getItemRequestSchema.safeParse({ itemId: '' }).success).toBe(true);
  });
});

describe('actor item request schemas', () => {
  it('accepts a listing with only the actor', () => {
    expect(getActorItemsRequestSchema.safeParse({ actorId: 'a1' }).success).toBe(true);
  });

  it('tolerates an empty or null type filter', () => {
    expect(getActorItemsRequestSchema.safeParse({ actorId: 'a1', type: '' }).success).toBe(true);
    expect(getActorItemsRequestSchema.safeParse({ actorId: 'a1', type: null }).success).toBe(true);
  });

  it('rejects filter flags that are not booleans', () => {
    expect(getActorItemsRequestSchema.safeParse({ actorId: 'a1', equipped: 'true' }).success).toBe(false);
    expect(getActorItemsRequestSchema.safeParse({ actorId: 'a1', hasActivities: 1 }).success).toBe(false);
  });

  it('requires the actor everywhere, and the item for update and delete', () => {
    expect(getActorItemsRequestSchema.safeParse({}).success).toBe(false);
    expect(addItemToActorRequestSchema.safeParse({ name: 'Dagger', type: 'weapon' }).success).toBe(false);
    expect(updateActorItemRequestSchema.safeParse({ actorId: 'a1' }).success).toBe(false);
    expect(deleteActorItemRequestSchema.safeParse({ itemId: 'i1' }).success).toBe(false);
  });

  it('accepts an item update that changes nothing', () => {
    expect(updateActorItemRequestSchema.safeParse({ actorId: 'a1', itemId: 'i1' }).success).toBe(true);
  });

  it('accepts system data beyond the fields the wire type lists', () => {
    const request = { actorId: 'a1', itemId: 'i1', system: { uses: { spent: 1 }, quantity: 3 } };

    expect(updateActorItemRequestSchema.parse(request)).toEqual(request);
  });
});

describe('item request mappers', () => {
  it('maps the wire folder to a folder id', () => {
    expect(toCreateItemCommand({ name: 'Cask', type: 'loot', folder: 'f1' })).toEqual({
      draft: { name: 'Cask', type: 'loot', folderId: 'f1', img: undefined, system: undefined }
    });
    expect(toUpdateItemCommand({ itemId: 'i1', folder: null })).toEqual({
      itemId: 'i1',
      changes: { name: undefined, img: undefined, folderId: null, system: undefined }
    });
  });

  it('maps the id-only requests', () => {
    expect(toGetItemQuery({ itemId: 'i1' })).toEqual({ itemId: 'i1' });
    expect(toDeleteItemCommand({ itemId: 'i1' })).toEqual({ itemId: 'i1' });
    expect(toRemoveActorItemCommand({ actorId: 'a1', itemId: 'i1' })).toEqual({
      target: { kind: 'actor', actorId: 'a1' },
      itemId: 'i1'
    });
  });

  it('maps an inventory listing to a filter', () => {
    expect(toListActorItemsQuery({ actorId: 'a1', type: 'weapon', equipped: true, hasActivities: false })).toEqual({
      target: { kind: 'actor', actorId: 'a1' },
      filter: { type: 'weapon', equipped: true, hasActivities: false }
    });
  });

  it('reads an empty or null type as "any type"', () => {
    expect(toListActorItemsQuery({ actorId: 'a1', type: '' }).filter.type).toBeUndefined();
    expect(toListActorItemsQuery({ actorId: 'a1', type: null }).filter.type).toBeUndefined();
  });

  it('maps an added and an updated actor item', () => {
    expect(toAddActorItemCommand({ actorId: 'a1', name: 'Dagger', type: 'weapon', system: { quantity: 2 } })).toEqual({
      target: { kind: 'actor', actorId: 'a1' },
      draft: { name: 'Dagger', type: 'weapon', img: undefined, system: { quantity: 2 } }
    });
    expect(toUpdateActorItemCommand({ actorId: 'a1', itemId: 'i1', name: 'Dirk' })).toEqual({
      target: { kind: 'actor', actorId: 'a1' },
      itemId: 'i1',
      changes: { name: 'Dirk', img: undefined, system: undefined }
    });
  });
});
