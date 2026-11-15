import { ValidationError } from '../../../../kernel';
import {
  CompendiumDocumentReadOnlyError,
  DOCUMENT_TRANSFER_MAX_BYTES,
  DocumentNotSortableError,
  DocumentTypeNotTransferableError,
  DocumentsNotSiblingsError,
  FLAG_VALUE_MAX_BYTES,
  FlagScopeUnavailableError,
  InheritOwnershipNotAllowedError,
  InvalidFlagKeyError,
  NoOwnershipChangesError,
  PayloadTooLargeError,
  ScriptImportDisabledError,
  SortTargetIsSelfError,
  TRANSFERABLE_DOCUMENT_TYPES,
  applyOwnershipChanges,
  isTransferableDocumentType,
  jsonByteLength,
  readFlag,
  requireActiveFlagScope,
  requireFlagKey,
  requireJsonSize,
  requireOwnershipChanges,
  requireScriptImportAllowed,
  requireSortableSiblings,
  requireTransferableDocumentType,
  requireWorldDocument,
  type DocumentReference,
  type OwnershipLevels,
  type SortableDocument
} from '../index';

function ref(overrides: Partial<DocumentReference> = {}): DocumentReference {
  return {
    uuid: 'Actor.a1',
    documentType: 'Actor',
    id: 'a1',
    name: 'Goblin',
    packId: null,
    parentUuid: null,
    ...overrides
  };
}

const page = ref({ uuid: 'JournalEntry.j1.JournalEntryPage.p1', documentType: 'JournalEntryPage', parentUuid: 'JournalEntry.j1' });

function levels(defaultLevel: OwnershipLevels['defaultLevel'], users: Record<string, OwnershipLevels['defaultLevel']> = {}): OwnershipLevels {
  return { defaultLevel, users: new Map(Object.entries(users)) };
}

describe('requireWorldDocument', () => {
  it('lets a world or embedded world document through', () => {
    expect(() => requireWorldDocument(ref())).not.toThrow();
    expect(() => requireWorldDocument(page)).not.toThrow();
  });

  it('refuses a compendium document', () => {
    const packed = ref({ uuid: 'Compendium.world.monsters.Actor.a1', packId: 'world.monsters' });
    expect(() => requireWorldDocument(packed)).toThrow(CompendiumDocumentReadOnlyError);
    expect(() => requireWorldDocument(packed)).toThrow(
      'Compendium documents are read-only here: Compendium.world.monsters.Actor.a1'
    );
  });
});

describe('ownership rules', () => {
  it('requires a default level or at least one user change', () => {
    expect(() => requireOwnershipChanges({})).toThrow(NoOwnershipChangesError);
    expect(() => requireOwnershipChanges({ users: new Map() })).toThrow(ValidationError);
    expect(() => requireOwnershipChanges({ defaultLevel: 'none' })).not.toThrow();
    expect(() => requireOwnershipChanges({ users: new Map([['u1', null]]) })).not.toThrow();
  });

  it('sets the default, sets and removes user entries, keeps unlisted users', () => {
    const next = applyOwnershipChanges(ref(), levels('none', { u1: 'owner', u2: 'limited', u3: 'observer' }), {
      defaultLevel: 'observer',
      users: new Map<string, 'owner' | 'limited' | null>([
        ['u1', null],
        ['u2', 'owner'],
        ['u4', 'limited']
      ])
    });

    expect(next.defaultLevel).toBe('observer');
    expect([...next.users]).toEqual([
      ['u2', 'owner'],
      ['u3', 'observer'],
      ['u4', 'limited']
    ]);
  });

  it('keeps the default when only users change and never mutates the current levels', () => {
    const current = levels('limited', { u1: 'owner' });
    const next = applyOwnershipChanges(ref(), current, { users: new Map([['u1', null]]) });

    expect(next.defaultLevel).toBe('limited');
    expect(next.users.size).toBe(0);
    expect(current.users.get('u1')).toBe('owner');
  });

  it('allows inherit on an embedded document only', () => {
    expect(applyOwnershipChanges(page, levels('inherit'), { users: new Map([['u1', 'inherit']]) }).users.get('u1')).toBe(
      'inherit'
    );
    expect(() => applyOwnershipChanges(ref(), levels('none'), { defaultLevel: 'inherit' })).toThrow(
      InheritOwnershipNotAllowedError
    );
    expect(() => applyOwnershipChanges(ref(), levels('none'), { users: new Map([['u1', 'inherit']]) })).toThrow(
      "Ownership level 'inherit' applies only to embedded documents (such as journal pages); Actor is a primary document"
    );
  });
});

describe('flag rules', () => {
  it.each(['visited', 'quest.stage', 'a.b.c', 'snake_case-key'])('accepts the key %s', (key) => {
    expect(() => requireFlagKey(key)).not.toThrow();
  });

  it.each([
    ['', 'it is empty'],
    ['a..b', 'it has an empty segment'],
    ['.a', 'it has an empty segment'],
    ['a.-=b', 'segment "-=b" starts with an update operator'],
    ['==a', 'segment "==a" starts with an update operator'],
    ['__proto__.polluted', 'segment "__proto__" is reserved'],
    ['a.constructor', 'segment "constructor" is reserved'],
    ['prototype', 'segment "prototype" is reserved']
  ])('refuses the key "%s" (%s)', (key, reason) => {
    expect(() => requireFlagKey(key)).toThrow(InvalidFlagKeyError);
    expect(() => requireFlagKey(key)).toThrow(`Invalid flag key "${key}": ${reason}`);
  });

  it('accepts only an active scope and lists the valid ones', () => {
    const scopes = ['core', 'world', 'dnd5e', 'foundry-api-bridge'];
    expect(() => requireActiveFlagScope('dnd5e', scopes)).not.toThrow();
    expect(() => requireActiveFlagScope('pf2e', scopes)).toThrow(FlagScopeUnavailableError);
    expect(() => requireActiveFlagScope('pf2e', scopes)).toThrow(
      'Flag scope "pf2e" is not valid or not currently active (valid scopes: core, world, dnd5e, foundry-api-bridge)'
    );
  });

  it('reads a nested flag and tells a missing one from a null one', () => {
    const flags = { world: { quest: { stage: 3, done: null } }, core: { sheetClass: 'x' } };

    expect(readFlag(flags, 'world', 'quest.stage')).toEqual({ found: true, value: 3 });
    expect(readFlag(flags, 'world', 'quest')).toEqual({ found: true, value: { stage: 3, done: null } });
    expect(readFlag(flags, 'world', 'quest.done')).toEqual({ found: true, value: null });
    expect(readFlag(flags, 'world', 'quest.stage.deeper')).toEqual({ found: false, value: null });
    expect(readFlag(flags, 'world', 'missing')).toEqual({ found: false, value: null });
    expect(readFlag(flags, 'dnd5e', 'anything')).toEqual({ found: false, value: null });
  });

  it('does not follow inherited properties', () => {
    expect(readFlag({ world: {} }, 'world', 'toString')).toEqual({ found: false, value: null });
  });
});

describe('payload size', () => {
  it('measures UTF-8 bytes of the JSON text', () => {
    expect(jsonByteLength({ a: 1 })).toBe(7);
    expect(jsonByteLength('é')).toBe(4);
    expect(jsonByteLength(undefined)).toBe(0);
  });

  it('refuses a value over the limit with its size', () => {
    expect(() => requireJsonSize('The flag value', 'x'.repeat(10), 12)).not.toThrow();
    expect(() => requireJsonSize('The flag value', 'x'.repeat(11), 12)).toThrow(PayloadTooLargeError);
    expect(() => requireJsonSize('The flag value', 'x'.repeat(11), 12)).toThrow(
      'The flag value is 13 bytes as JSON, over the limit of 12 bytes'
    );
  });

  it('caps flags at 64 KiB and transfers at 8 MiB', () => {
    expect(FLAG_VALUE_MAX_BYTES).toBe(65536);
    expect(DOCUMENT_TRANSFER_MAX_BYTES).toBe(8 * 1024 * 1024);
  });
});

describe('sort rules', () => {
  function sortable(uuid: string, container: string | null, documentType = 'Actor'): SortableDocument {
    return { document: ref({ uuid, documentType }), sort: 0, container };
  }

  it('accepts siblings of the same type and container', () => {
    expect(() => requireSortableSiblings(sortable('Actor.a', 'world:Actor:f1'), sortable('Actor.b', 'world:Actor:f1'))).not.toThrow();
  });

  it('refuses sorting a document relative to itself', () => {
    expect(() => requireSortableSiblings(sortable('Actor.a', 'c'), sortable('Actor.a', 'c'))).toThrow(SortTargetIsSelfError);
  });

  it('refuses a type without a sort order, naming the document', () => {
    expect(() => requireSortableSiblings(sortable('Scene.s.Wall.w', null, 'Wall'), sortable('Scene.s.Wall.v', null, 'Wall'))).toThrow(
      'Wall documents have no sort order: Scene.s.Wall.w'
    );
    expect(() => requireSortableSiblings(sortable('Actor.a', 'c'), sortable('Setting.s', null, 'Setting'))).toThrow(
      DocumentNotSortableError
    );
  });

  it('refuses documents in different containers or of different types', () => {
    expect(() => requireSortableSiblings(sortable('Actor.a', 'world:Actor:f1'), sortable('Actor.b', 'world:Actor:'))).toThrow(
      DocumentsNotSiblingsError
    );
    expect(() => requireSortableSiblings(sortable('Actor.a', 'x'), sortable('Item.b', 'x', 'Item'))).toThrow(
      'Actor.a and Item.b are not siblings: sort relative to a document of the same type in the same folder or parent'
    );
  });
});

describe('transfer rules', () => {
  it('allows exactly the eight transferable types', () => {
    expect([...TRANSFERABLE_DOCUMENT_TYPES].sort()).toEqual([
      'Actor',
      'Cards',
      'Item',
      'JournalEntry',
      'Macro',
      'Playlist',
      'RollTable',
      'Scene'
    ]);
    for (const type of TRANSFERABLE_DOCUMENT_TYPES) {
      expect(requireTransferableDocumentType(type)).toBe(type);
    }
  });

  it.each(['User', 'Setting', 'FogExploration', 'ChatMessage', 'Combat', 'Folder', 'Adventure', 'JournalEntryPage'])(
    'refuses %s',
    (type) => {
      expect(isTransferableDocumentType(type)).toBe(false);
      expect(() => requireTransferableDocumentType(type)).toThrow(DocumentTypeNotTransferableError);
      expect(() => requireTransferableDocumentType(type)).toThrow(
        `${type} documents cannot be exported or imported (allowed: Actor, Cards, Item, JournalEntry, Macro, Playlist, RollTable, Scene)`
      );
    }
  );

  it('lets script content through only with the opt-in', () => {
    const disabled = { allowsScripts: jest.fn(() => false) };
    const enabled = { allowsScripts: (): boolean => true };

    expect(() => requireScriptImportAllowed([], disabled)).not.toThrow();
    expect(disabled.allowsScripts).not.toHaveBeenCalled();
    expect(() => requireScriptImportAllowed(['script macro'], enabled)).not.toThrow();
    expect(() => requireScriptImportAllowed(['script macro'], disabled)).toThrow(ScriptImportDisabledError);
  });

  it('names each kind of script content once', () => {
    const disabled = { allowsScripts: (): boolean => false };
    expect(() =>
      requireScriptImportAllowed(
        ['executeScript region behavior', 'executeScript region behavior', 'executeMacro region behavior aimed at a script macro'],
        disabled
      )
    ).toThrow(
      'Script macros are disabled. Enable "Allow Script Macros" in module settings to import documents that run scripts (found: executeScript region behavior, executeMacro region behavior aimed at a script macro).'
    );
  });
});
