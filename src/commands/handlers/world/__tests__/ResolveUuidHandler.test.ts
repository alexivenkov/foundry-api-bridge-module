import { createResolveUuidHandler, resolveUuidHandler } from '../ResolveUuidHandler';

const globals = globalThis as Record<string, unknown>;

function makeFoundryDoc(): Record<string, unknown> {
  return {
    uuid: 'Compendium.dnd5e.spells.Item.s1',
    documentName: 'Item',
    id: 's1',
    name: 'Fireball',
    type: 'spell',
    img: 'f.png',
    pack: 'dnd5e.spells',
    parent: null,
    toObject: () => ({ name: 'Fireball', system: { level: 3 } })
  };
}

describe('resolveUuidHandler', () => {
  afterEach(() => {
    delete globals['fromUuid'];
  });

  it('resolves via the global fromUuid', async () => {
    globals['fromUuid'] = jest.fn(async () => makeFoundryDoc());

    const result = await resolveUuidHandler({ uuid: 'Compendium.dnd5e.spells.Item.s1' });

    expect(globals['fromUuid']).toHaveBeenCalledWith('Compendium.dnd5e.spells.Item.s1');
    expect(result).toEqual({
      uuid: 'Compendium.dnd5e.spells.Item.s1',
      documentName: 'Item',
      id: 's1',
      name: 'Fireball',
      type: 'spell',
      img: 'f.png',
      pack: 'dnd5e.spells',
      parentUuid: null,
      data: { name: 'Fireball', system: { level: 3 } }
    });
  });

  it('throws the canonical error when the uuid does not resolve', async () => {
    globals['fromUuid'] = jest.fn(async () => null);

    await expect(resolveUuidHandler({ uuid: 'Actor.ghost' })).rejects.toThrow(
      'Document not found for UUID: Actor.ghost'
    );
  });

  it('throws a formatted validation error for a missing uuid', async () => {
    await expect(
      resolveUuidHandler({} as { uuid: string })
    ).rejects.toThrow(/uuid/);
  });

  it('supports an injected fromUuid for tests', async () => {
    const handler = createResolveUuidHandler({ fromUuid: async () => makeFoundryDoc() });
    const result = await handler({ uuid: 'anything' });
    expect(result.id).toBe('s1');
  });
});
