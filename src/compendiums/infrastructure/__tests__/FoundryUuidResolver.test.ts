import { FoundryUuidResolver } from '../FoundryUuidResolver';

function makeFoundryDoc(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    uuid: 'Compendium.dnd5e.classfeatures.Item.abc',
    documentName: 'Item',
    id: 'abc',
    name: 'Rage',
    type: 'feat',
    img: 'rage.png',
    pack: 'dnd5e.classfeatures',
    parent: null,
    toObject: () => ({ name: 'Rage', system: { uses: 2 } }),
    ...overrides
  };
}

describe('FoundryUuidResolver', () => {
  it('maps a resolved compendium document', async () => {
    const resolver = new FoundryUuidResolver(async () => makeFoundryDoc());

    const record = await resolver.resolve('Compendium.dnd5e.classfeatures.Item.abc');

    expect(record).toEqual({
      uuid: 'Compendium.dnd5e.classfeatures.Item.abc',
      documentName: 'Item',
      id: 'abc',
      name: 'Rage',
      type: 'feat',
      img: 'rage.png',
      pack: 'dnd5e.classfeatures',
      parentUuid: null,
      data: { name: 'Rage', system: { uses: 2 } }
    });
  });

  it('maps a world embedded document with parent uuid and null fallbacks', async () => {
    const resolver = new FoundryUuidResolver(async () =>
      makeFoundryDoc({
        uuid: 'Actor.a1.Item.i1',
        pack: null,
        parent: { uuid: 'Actor.a1' },
        name: null,
        type: undefined,
        img: undefined
      })
    );

    const record = await resolver.resolve('Actor.a1.Item.i1');
    expect(record?.parentUuid).toBe('Actor.a1');
    expect(record?.pack).toBeNull();
    expect(record?.name).toBeNull();
    expect(record?.type).toBeNull();
    expect(record?.img).toBeNull();
  });

  it('returns null when fromUuid yields null or a non-document value', async () => {
    expect(await new FoundryUuidResolver(async () => null).resolve('x')).toBeNull();
    expect(
      await new FoundryUuidResolver(async () => ({ uuid: 'u' })).resolve('x')
    ).toBeNull();
    expect(await new FoundryUuidResolver(async () => 'garbage').resolve('x')).toBeNull();
  });

  it('returns null when fromUuid throws (malformed uuid)', async () => {
    const resolver = new FoundryUuidResolver(async () => {
      throw new Error('Invalid UUID');
    });
    expect(await resolver.resolve('!!!')).toBeNull();
  });

  it('returns null when the global fromUuid is unavailable', async () => {
    const resolver = new FoundryUuidResolver();
    expect(await resolver.resolve('Actor.a1')).toBeNull();
  });
});
