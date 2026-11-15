import type {
  FoundryDocument,
  FoundryDocumentClass,
  FoundryDocumentGlobals,
  FoundryDocumentIndex,
  FoundrySortRelativeOptions,
  FoundryWorldCollection
} from '../foundryDocumentTypes';

/**
 * A client document reduced to what the gateways touch. `update` applies a non-recursive replacement of the given
 * top-level keys and `setFlag` merges objects, as the Node probe of `updateSource` showed on Foundry 13.351 and 14.368.
 */
export interface FakeDocument extends FoundryDocument {
  _source: Record<string, unknown>;
  update: jest.Mock<Promise<unknown>, [Record<string, unknown>, Record<string, unknown>?]>;
  setFlag: jest.Mock<Promise<unknown>, [string, string, unknown]>;
  unsetFlag: jest.Mock<Promise<unknown>, [string, string]>;
  sortRelative: jest.Mock<Promise<unknown>, [FoundrySortRelativeOptions]>;
  toCompendium: jest.Mock<Record<string, unknown>, [null, (Record<string, boolean> | undefined)?]>;
  embedded: Map<string, FakeDocument[]>;
}

export interface FakeDocumentOptions {
  uuid: string;
  documentName: string;
  name?: string | null;
  pack?: string | null;
  parent?: FakeDocument | null;
  fields?: readonly string[];
  source?: Record<string, unknown>;
}

const PRIMARY_FIELDS = ['ownership', 'sort', 'flags', 'folder', 'name'];

function mergeInto(target: Record<string, unknown>, path: string[], value: unknown): void {
  const [head, ...rest] = path;
  if (head === undefined) {
    return;
  }
  if (rest.length === 0) {
    const existing = target[head];
    target[head] =
      value !== null && typeof value === 'object' && !Array.isArray(value) && existing !== null && typeof existing === 'object'
        ? { ...(existing as Record<string, unknown>), ...(value as Record<string, unknown>) }
        : value;
    return;
  }
  const next = target[head];
  const child = next !== null && typeof next === 'object' ? (next as Record<string, unknown>) : {};
  target[head] = child;
  mergeInto(child, rest, value);
}

function deleteAt(target: Record<string, unknown>, path: string[]): void {
  const [head, ...rest] = path;
  if (head === undefined) {
    return;
  }
  if (rest.length === 0) {
    delete target[head];
    return;
  }
  const next = target[head];
  if (next !== null && typeof next === 'object') {
    deleteAt(next as Record<string, unknown>, rest);
  }
}

export function fakeDocument(options: FakeDocumentOptions): FakeDocument {
  const fields = options.fields ?? PRIMARY_FIELDS;
  const id = options.uuid.split('.').pop() ?? '';
  const embedded = new Map<string, FakeDocument[]>();
  const document: FakeDocument = {
    id,
    uuid: options.uuid,
    documentName: options.documentName,
    name: options.name === undefined ? `Name of ${id}` : options.name,
    pack: options.pack ?? null,
    parent: options.parent ?? null,
    schema: { has: (field: string) => fields.includes(field) },
    _source: { _id: id, ...(options.source ?? {}) },
    embedded,
    update: jest.fn((data: Record<string, unknown>) => {
      Object.assign(document._source, JSON.parse(JSON.stringify(data)) as Record<string, unknown>);
      return Promise.resolve(document);
    }),
    setFlag: jest.fn((scope: string, key: string, value: unknown) => {
      const flags = (document._source['flags'] ?? {}) as Record<string, unknown>;
      mergeInto(flags, [scope, ...key.split('.')], JSON.parse(JSON.stringify(value)) as unknown);
      document._source['flags'] = flags;
      return Promise.resolve(document);
    }),
    unsetFlag: jest.fn((scope: string, key: string) => {
      deleteAt((document._source['flags'] ?? {}) as Record<string, unknown>, [scope, ...key.split('.')]);
      return Promise.resolve(document);
    }),
    sortRelative: jest.fn((_options: FoundrySortRelativeOptions) => {
      document._source['sort'] = 150000;
      return Promise.resolve<unknown>(document);
    }),
    toCompendium: jest.fn((_pack: null, _options?: Record<string, boolean>) => {
      const data = JSON.parse(JSON.stringify(document._source)) as Record<string, unknown>;
      delete data['_id'];
      delete data['sort'];
      return data;
    }),
    getEmbeddedCollection: (embeddedName: string) => ({ contents: embedded.get(embeddedName) ?? [] })
  };
  return document;
}

export function embed(parent: FakeDocument, children: FakeDocument[]): void {
  for (const child of children) {
    const list = parent.embedded.get(child.documentName) ?? [];
    list.push(child);
    parent.embedded.set(child.documentName, list);
  }
}

export interface FakeWorld {
  documents?: FakeDocument[];
  users?: Record<string, string>;
  folders?: FakeDocument[];
  collections?: Record<string, FakeDocument[]>;
  flagScopes?: string[];
  documentIndex?: FoundryDocumentIndex;
  documentClasses?: Record<string, FoundryDocumentClass>;
  fromCompendium?: FoundryWorldCollection['fromCompendium'];
  /** Foundry 11 / 12 install only the global `fromUuid`. */
  globalFromUuidOnly?: boolean;
  fromUuidThrows?: boolean;
}

export function fakeGlobals(world: FakeWorld = {}): FoundryDocumentGlobals {
  const documents = [...(world.documents ?? []), ...(world.folders ?? [])];
  const fromUuid = (uuid: string): Promise<unknown> => {
    if (world.fromUuidThrows === true) {
      return Promise.reject(new Error(`Invalid UUID: ${uuid}`));
    }
    return Promise.resolve(documents.find((document) => document.uuid === uuid) ?? null);
  };
  const folders = world.folders ?? [];
  const CONFIG: Record<string, unknown> = {
    DatabaseBackend: { getFlagScopes: () => world.flagScopes ?? ['core', 'world', 'dnd5e'] }
  };
  for (const [documentName, documentClass] of Object.entries(world.documentClasses ?? {})) {
    CONFIG[documentName] = { documentClass };
  }
  return {
    game: {
      version: '13.351',
      system: { id: 'dnd5e', version: '5.1.0' },
      world: { id: 'my-world' },
      users: {
        get: (userId: string) => (world.users?.[userId] !== undefined ? { name: world.users[userId] } : undefined)
      },
      folders: { contents: folders, get: (folderId: string) => folders.find((folder) => folder.id === folderId) },
      collections: {
        get: (documentName: string) => {
          const contents = world.collections?.[documentName];
          return contents === undefined
            ? undefined
            : { contents, fromCompendium: world.fromCompendium ?? ((document) => ({ ...document._source })) };
        }
      },
      ...(world.documentIndex !== undefined ? { documentIndex: world.documentIndex } : {})
    },
    CONFIG,
    ...(world.globalFromUuidOnly === true ? { fromUuid } : { foundry: { utils: { fromUuid } } })
  };
}
