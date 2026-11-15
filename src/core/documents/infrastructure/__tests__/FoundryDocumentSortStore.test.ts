import { FoundryDocumentSortStore } from '../FoundryDocumentSortStore';
import { embed, fakeDocument, fakeGlobals, type FakeDocument } from './fakeFoundry';

function actor(id: string, folder: string | null, sort: number): FakeDocument {
  return fakeDocument({ uuid: `Actor.${id}`, documentName: 'Actor', source: { folder, sort } });
}

function folder(id: string, type: string, parent: string | null): FakeDocument {
  return fakeDocument({
    uuid: `Folder.${id}`,
    documentName: 'Folder',
    fields: ['sort', 'flags', 'folder', 'name'],
    source: { type, folder: parent, sort: 0 }
  });
}

describe('FoundryDocumentSortStore', () => {
  it('sorts a sidebar document among the documents of its folder only', async () => {
    const a = actor('a', 'f1', 100000);
    const b = actor('b', 'f1', 200000);
    const c = actor('c', 'f1', 300000);
    const elsewhere = actor('d', null, 50000);
    const store = new FoundryDocumentSortStore(() =>
      fakeGlobals({ documents: [a, b, c, elsewhere], collections: { Actor: [a, b, c, elsewhere] } })
    );

    const result = await store.sortRelative('Actor.c', 'Actor.a', 'before');

    const options = c.sortRelative.mock.calls[0]?.[0];
    expect(options?.siblings).toEqual([a, b]);
    expect(options?.target).toBe(a);
    expect(options?.sortBefore).toBe(true);
    expect(options?.sortKey).toBe('sort');
    expect(result).toMatchObject({ document: { uuid: 'Actor.c' }, sort: 150000 });
  });

  it('passes sortBefore false for after', async () => {
    const a = actor('a', null, 1);
    const b = actor('b', null, 2);
    const store = new FoundryDocumentSortStore(() => fakeGlobals({ documents: [a, b], collections: { Actor: [a, b] } }));

    await store.sortRelative('Actor.a', 'Actor.b', 'after');

    expect(a.sortRelative.mock.calls[0]?.[0].sortBefore).toBe(false);
  });

  it('gives siblings in different folders different containers', async () => {
    const store = new FoundryDocumentSortStore(() =>
      fakeGlobals({ documents: [actor('a', 'f1', 1), actor('b', 'f2', 1), actor('c', 'f1', 1)] })
    );

    const [a, b, c] = await Promise.all(['Actor.a', 'Actor.b', 'Actor.c'].map((uuid) => store.findDocument(uuid)));

    expect(a?.container).toBe(c?.container);
    expect(a?.container).not.toBe(b?.container);
  });

  it('sorts a folder among folders of the same type under the same parent', async () => {
    const f1 = folder('f1', 'Actor', null);
    const f2 = folder('f2', 'Actor', null);
    const otherType = folder('f3', 'Item', null);
    const nested = folder('f4', 'Actor', 'f1');
    const store = new FoundryDocumentSortStore(() => fakeGlobals({ folders: [f1, f2, otherType, nested] }));

    await store.sortRelative('Folder.f1', 'Folder.f2', 'after');

    expect(f1.sortRelative.mock.calls[0]?.[0].siblings).toEqual([f2]);
    const [sorted, item] = await Promise.all([store.findDocument('Folder.f1'), store.findDocument('Folder.f3')]);
    expect(sorted?.container).not.toBe(item?.container);
  });

  it('sorts an embedded document among the same parent and type', async () => {
    const parent = fakeDocument({ uuid: 'Actor.hero', documentName: 'Actor' });
    const sword = fakeDocument({ uuid: 'Actor.hero.Item.sword', documentName: 'Item', parent, source: { sort: 1 } });
    const shield = fakeDocument({ uuid: 'Actor.hero.Item.shield', documentName: 'Item', parent, source: { sort: 2 } });
    const effect = fakeDocument({ uuid: 'Actor.hero.ActiveEffect.e', documentName: 'ActiveEffect', parent, source: { sort: 3 } });
    embed(parent, [sword, shield, effect]);
    const store = new FoundryDocumentSortStore(() => fakeGlobals({ documents: [parent, sword, shield, effect] }));

    await store.sortRelative(sword.uuid, shield.uuid, 'after');

    expect(sword.sortRelative.mock.calls[0]?.[0].siblings).toEqual([shield]);
    const [s, e] = await Promise.all([store.findDocument(sword.uuid), store.findDocument(effect.uuid)]);
    expect(s?.container).not.toBe(e?.container);
  });

  it('reports no container for a type without sort, and null when a document is gone', async () => {
    const wall = fakeDocument({ uuid: 'Scene.s.Wall.w', documentName: 'Wall', fields: ['flags'] });
    const a = actor('a', null, 1);
    const store = new FoundryDocumentSortStore(() => fakeGlobals({ documents: [wall, a], collections: { Actor: [a] } }));

    await expect(store.findDocument('Scene.s.Wall.w')).resolves.toMatchObject({ container: null, sort: 0 });
    await expect(store.sortRelative('Actor.a', 'Actor.gone', 'before')).resolves.toBeNull();
    expect(a.sortRelative).not.toHaveBeenCalled();
  });
});
