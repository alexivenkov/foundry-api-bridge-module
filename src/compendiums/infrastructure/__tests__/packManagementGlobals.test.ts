import { createPackManagementGlobals } from '../packManagementGlobals';
import { fromCoreOwnership, toCoreOwnership } from '../packOwnershipCodes';

describe('createPackManagementGlobals', () => {
  const modern = { createCompendium: jest.fn() };
  const legacy = { createCompendium: jest.fn() };
  const folderClass = { createDocuments: jest.fn() };
  const adventureClass = { contentFields: {}, prototype: {} };

  beforeEach(() => {
    Object.assign(globalThis, {
      foundry: { documents: { collections: { CompendiumCollection: modern } } },
      CompendiumCollection: legacy,
      CONST: { COMPENDIUM_DOCUMENT_TYPES: ['Actor', 'Item'] },
      CONFIG: { Adventure: { documentClass: adventureClass }, Folder: { documentClass: folderClass } }
    });
  });

  afterEach(() => {
    const scope = globalThis as Record<string, unknown>;
    delete scope['foundry'];
    delete scope['CompendiumCollection'];
    delete scope['CONST'];
    delete scope['CONFIG'];
  });

  it('takes CompendiumCollection from the v13+ namespace and from the global before', () => {
    expect(createPackManagementGlobals(() => 13).compendiumCollectionClass()).toBe(modern);
    expect(createPackManagementGlobals(() => 12).compendiumCollectionClass()).toBe(legacy);
  });

  it('reads the pack types and the document classes lazily', () => {
    const globals = createPackManagementGlobals(() => 14);
    expect(globals.compendiumDocumentTypes()).toEqual(['Actor', 'Item']);
    expect(globals.folderClass()).toBe(folderClass);
    expect(globals.adventureClass()).toBe(adventureClass);
  });

  it('slugifies through String#slugify when Foundry installed it', () => {
    const globals = createPackManagementGlobals(() => 14);
    expect(globals.slugify('Monsters')).toBe('Monsters');
    const prototype = String.prototype as unknown as { slugify?: (options: { strict: boolean }) => string };
    prototype.slugify = function slugify(this: string): string {
      return this.toLowerCase();
    };
    try {
      expect(globals.slugify('Monsters')).toBe('monsters');
    } finally {
      delete prototype.slugify;
    }
  });
});

describe('pack ownership codes', () => {
  it('maps core role and level names both ways', () => {
    expect(fromCoreOwnership({ PLAYER: 'LIMITED', TRUSTED: 'OWNER', ASSISTANT: 'NONE', GAMEMASTER: 'OWNER' })).toEqual({
      player: 'limited',
      trusted: 'owner',
      assistant: 'none'
    });
    expect(fromCoreOwnership({})).toEqual({ player: 'inherit', trusted: 'inherit', assistant: 'inherit' });
    expect(toCoreOwnership({ player: 'inherit', trusted: 'limited', assistant: 'observer' })).toEqual({
      GAMEMASTER: 'OWNER',
      ASSISTANT: 'OBSERVER',
      TRUSTED: 'LIMITED',
      PLAYER: 'INHERIT'
    });
  });
});
