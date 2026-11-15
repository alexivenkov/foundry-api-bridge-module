import { FoundryDocumentFlagStore } from '../FoundryDocumentFlagStore';
import { FoundryDocumentOwnershipStore } from '../FoundryDocumentOwnershipStore';
import { FoundryDocumentResolver } from '../FoundryDocumentResolver';
import { ownershipLevelFromCode, readOwnership, toFoundryOwnership } from '../ownershipCodes';
import { fakeDocument, fakeGlobals } from './fakeFoundry';

const U1 = 'bbbbbbbbbbbbbbbb';
const U2 = 'cccccccccccccccc';

describe('ownership codes (CONST.DOCUMENT_OWNERSHIP_LEVELS, Foundry 13 / 14)', () => {
  it.each([
    [-1, 'inherit'],
    [0, 'none'],
    [1, 'limited'],
    [2, 'observer'],
    [3, 'owner']
  ] as const)('maps %i to %s', (code, level) => {
    expect(ownershipLevelFromCode(code)).toBe(level);
    expect(toFoundryOwnership({ defaultLevel: level, users: new Map() })).toEqual({ default: code });
  });

  it('ignores meta levels and junk', () => {
    expect(ownershipLevelFromCode(-20)).toBeNull();
    expect(ownershipLevelFromCode('3')).toBeNull();
  });

  it('reads a stored ownership object; a missing default is none', () => {
    const read = readOwnership({ default: 2, [U1]: 3, [U2]: -1 });
    expect(read?.defaultLevel).toBe('observer');
    expect([...(read?.users ?? [])]).toEqual([
      [U1, 'owner'],
      [U2, 'inherit']
    ]);
    expect(readOwnership({ [U1]: 1 })?.defaultLevel).toBe('none');
    expect(readOwnership(null)).toBeNull();
  });
});

describe('FoundryDocumentResolver', () => {
  it('resolves through foundry.utils.fromUuid, or the global fromUuid of older cores', async () => {
    const actor = fakeDocument({ uuid: 'Actor.a1', documentName: 'Actor' });

    await expect(new FoundryDocumentResolver(() => fakeGlobals({ documents: [actor] })).resolve('Actor.a1')).resolves.toBe(actor);
    await expect(
      new FoundryDocumentResolver(() => fakeGlobals({ documents: [actor], globalFromUuidOnly: true })).resolve('Actor.a1')
    ).resolves.toBe(actor);
  });

  it('reads a throwing lookup and a non-document (a compendium index entry) as not found', async () => {
    const throwing = new FoundryDocumentResolver(() => fakeGlobals({ fromUuidThrows: true }));
    await expect(throwing.resolve('garbage')).resolves.toBeNull();

    const indexEntry = { _id: 'x', name: 'Index entry', uuid: 'Compendium.p.Actor.x' };
    const globals = fakeGlobals();
    globals.foundry = { utils: { fromUuid: () => Promise.resolve(indexEntry) } };
    await expect(new FoundryDocumentResolver(() => globals).resolve('Compendium.p.Actor.x')).resolves.toBeNull();
  });
});

describe('FoundryDocumentOwnershipStore', () => {
  it('reads the stored ownership and the document reference', async () => {
    const actor = fakeDocument({ uuid: 'Actor.a1', documentName: 'Actor', name: 'Goblin', source: { ownership: { default: 0, [U1]: 3 } } });
    const store = new FoundryDocumentOwnershipStore(() => fakeGlobals({ documents: [actor], users: { [U1]: 'Alice' } }));

    const found = await store.findDocument('Actor.a1');

    expect(found?.document).toEqual({
      uuid: 'Actor.a1',
      documentType: 'Actor',
      id: 'a1',
      name: 'Goblin',
      packId: null,
      parentUuid: null
    });
    expect(found?.ownership?.defaultLevel).toBe('none');
    expect(store.userName(U1)).toBe('Alice');
    expect(store.userName('nobody')).toBeNull();
  });

  it('reports no ownership for a type whose schema has none', async () => {
    const folder = fakeDocument({ uuid: 'Folder.f1', documentName: 'Folder', fields: ['sort', 'flags', 'folder', 'name'] });
    const store = new FoundryDocumentOwnershipStore(() => fakeGlobals({ documents: [folder] }));

    await expect(store.findDocument('Folder.f1')).resolves.toMatchObject({ ownership: null });
    await expect(store.findDocument('Folder.zz')).resolves.toBeNull();
  });

  it('writes the whole ownership object non-recursively, so a removed user entry disappears', async () => {
    const actor = fakeDocument({ uuid: 'Actor.a1', documentName: 'Actor', source: { name: 'Goblin', ownership: { default: 0, [U1]: 3 } } });
    const store = new FoundryDocumentOwnershipStore(() => fakeGlobals({ documents: [actor] }));

    const updated = await store.replaceOwnership('Actor.a1', { defaultLevel: 'observer', users: new Map([[U2, 'limited']]) });

    expect(actor.update).toHaveBeenCalledWith({ ownership: { default: 2, [U2]: 1 } }, { diff: false, recursive: false });
    expect(actor._source['ownership']).toEqual({ default: 2, [U2]: 1 });
    expect(actor._source['name']).toBe('Goblin');
    expect([...(updated?.ownership?.users ?? [])]).toEqual([[U2, 'limited']]);
  });

  it('reports a page parent and resolves to null when the document is gone', async () => {
    const entry = fakeDocument({ uuid: 'JournalEntry.j1', documentName: 'JournalEntry' });
    const page = fakeDocument({
      uuid: 'JournalEntry.j1.JournalEntryPage.p1',
      documentName: 'JournalEntryPage',
      parent: entry,
      source: { ownership: { default: -1 } }
    });
    const store = new FoundryDocumentOwnershipStore(() => fakeGlobals({ documents: [entry, page] }));

    await expect(store.findDocument(page.uuid)).resolves.toMatchObject({
      document: { parentUuid: 'JournalEntry.j1' },
      ownership: { defaultLevel: 'inherit' }
    });
    await expect(store.replaceOwnership('Actor.gone', { defaultLevel: 'none', users: new Map() })).resolves.toBeNull();
  });
});

describe('FoundryDocumentFlagStore', () => {
  function setup(): { actor: ReturnType<typeof fakeDocument>; store: FoundryDocumentFlagStore } {
    const actor = fakeDocument({
      uuid: 'Actor.a1',
      documentName: 'Actor',
      source: { flags: { world: { quest: { stage: 1, mood: 'grim' } } } }
    });
    return {
      actor,
      store: new FoundryDocumentFlagStore(() => fakeGlobals({ documents: [actor], flagScopes: ['core', 'world', 'dnd5e', 'my-module'] }))
    };
  }

  it('reads a detached copy of every flag scope', async () => {
    const { actor, store } = setup();

    const found = await store.findDocument('Actor.a1');
    (found?.flags?.['world'] as Record<string, unknown>)['quest'] = 'mutated';

    expect(actor._source['flags']).toEqual({ world: { quest: { stage: 1, mood: 'grim' } } });
  });

  it('takes the writable scopes from the core database backend', () => {
    expect(setup().store.activeScopes()).toEqual(['core', 'world', 'dnd5e', 'my-module']);
  });

  it('writes through Document#setFlag and reads the merged result back', async () => {
    const { actor, store } = setup();

    const updated = await store.setFlag('Actor.a1', 'world', 'quest', { stage: 2 });

    expect(actor.setFlag).toHaveBeenCalledWith('world', 'quest', { stage: 2 });
    expect(updated?.flags).toEqual({ world: { quest: { stage: 2, mood: 'grim' } } });
  });

  it('removes through Document#unsetFlag', async () => {
    const { actor, store } = setup();

    const updated = await store.unsetFlag('Actor.a1', 'world', 'quest.mood');

    expect(actor.unsetFlag).toHaveBeenCalledWith('world', 'quest.mood');
    expect(updated?.flags).toEqual({ world: { quest: { stage: 1 } } });
  });

  it('reports no flags for a type without them and null for a missing document', async () => {
    const setting = fakeDocument({ uuid: 'Setting.s1', documentName: 'Setting', fields: [] });
    const store = new FoundryDocumentFlagStore(() => fakeGlobals({ documents: [setting] }));

    await expect(store.findDocument('Setting.s1')).resolves.toMatchObject({ flags: null });
    await expect(store.setFlag('Actor.gone', 'world', 'k', 1)).resolves.toBeNull();
    await expect(store.unsetFlag('Actor.gone', 'world', 'k')).resolves.toBeNull();
  });
});
