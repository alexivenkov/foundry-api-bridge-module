/** Where a table result's `documentUuid` leads. */
export interface DocumentReference {
  /** The pack id (`dnd5e.items`) of a compendium entry, the document name (`Actor`) of a world document. */
  readonly collection: string;
  readonly id: string;
  readonly inCompendium: boolean;
}

/**
 * Reads a document UUID without resolving it, so a pack that is not installed
 * still reads as a pack. A compendium entry is
 * `Compendium.<scope>.<pack>.<DocType>.<id>` or, in the older form,
 * `Compendium.<scope>.<pack>.<id>`; a world document is `<DocType>.<id>`. An
 * embedded document appends `.<DocType>.<id>` pairs, and the last one names it.
 */
export function parseDocumentReference(uuid: string | null | undefined): DocumentReference | null {
  if (typeof uuid !== 'string' || uuid === '') {
    return null;
  }

  const parts = uuid.split('.');
  if (parts[0] === 'Compendium') {
    const [, scope, pack, ...path] = parts;
    const id = path[path.length - 1];
    return scope && pack && id ? { collection: `${scope}.${pack}`, id, inCompendium: true } : null;
  }

  if (parts.length % 2 !== 0) {
    return null;
  }
  const documentName = parts[parts.length - 2];
  const id = parts[parts.length - 1];
  return documentName && id ? { collection: documentName, id, inCompendium: false } : null;
}
