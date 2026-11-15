import { parseRequest } from '../../../shared';
import { ValidationError } from '../../../../kernel';
import {
  documentUuidRequestSchema,
  getDocumentFlagsRequestSchema,
  importDocumentRequestSchema,
  searchDocumentsRequestSchema,
  setDocumentFlagRequestSchema,
  setDocumentOwnershipRequestSchema,
  sortDocumentRequestSchema,
  toDocumentSearchQuery,
  toGetFlagsQuery,
  toImportDocumentCommand,
  toSetFlagCommand,
  toSetOwnershipCommand,
  toSortDocumentCommand,
  unsetDocumentFlagRequestSchema
} from '../index';

describe('document request schemas', () => {
  it('requires a non-empty uuid and ignores unknown keys', () => {
    expect(parseRequest(documentUuidRequestSchema, { uuid: 'Actor.a', extra: 1 })).toEqual({ uuid: 'Actor.a' });
    expect(() => parseRequest(documentUuidRequestSchema, { uuid: '' })).toThrow(ValidationError);
    expect(() => parseRequest(documentUuidRequestSchema, {})).toThrow(/^uuid: /);
  });

  describe('set-document-ownership', () => {
    it('maps levels and a user record with null removals', () => {
      const command = toSetOwnershipCommand(
        parseRequest(setDocumentOwnershipRequestSchema, { uuid: 'Actor.a', defaultLevel: 'observer', users: { u1: 'owner', u2: null } })
      );

      expect(command.uuid).toBe('Actor.a');
      expect(command.changes.defaultLevel).toBe('observer');
      expect([...(command.changes.users ?? [])]).toEqual([
        ['u1', 'owner'],
        ['u2', null]
      ]);
    });

    it('leaves absent parts undefined', () => {
      expect(toSetOwnershipCommand(parseRequest(setDocumentOwnershipRequestSchema, { uuid: 'Actor.a' })).changes).toEqual({
        defaultLevel: undefined,
        users: undefined
      });
    });

    it.each([
      [{ uuid: 'Actor.a', defaultLevel: 'gm' }, /^defaultLevel: /],
      [{ uuid: 'Actor.a', defaultLevel: 3 }, /^defaultLevel: /],
      [{ uuid: 'Actor.a', users: { u1: 'default' } }, /^users\.u1: /],
      [{ uuid: 'Actor.a', users: ['u1'] }, /^users: /]
    ])('rejects %j', (params, message) => {
      expect(() => parseRequest(setDocumentOwnershipRequestSchema, params)).toThrow(message);
    });
  });

  describe('flags', () => {
    it('reads an empty or null scope as every scope', () => {
      expect(toGetFlagsQuery(parseRequest(getDocumentFlagsRequestSchema, { uuid: 'Actor.a', scope: '' })).scope).toBeUndefined();
      expect(toGetFlagsQuery(parseRequest(getDocumentFlagsRequestSchema, { uuid: 'Actor.a', scope: null })).scope).toBeUndefined();
      expect(toGetFlagsQuery(parseRequest(getDocumentFlagsRequestSchema, { uuid: 'Actor.a', scope: 'world' })).scope).toBe('world');
    });

    it('requires scope, key and a present value; null and objects are values', () => {
      expect(toSetFlagCommand(parseRequest(setDocumentFlagRequestSchema, { uuid: 'Actor.a', scope: 'world', key: 'k', value: null }))).toEqual({
        uuid: 'Actor.a',
        scope: 'world',
        key: 'k',
        value: null
      });
      expect(parseRequest(setDocumentFlagRequestSchema, { uuid: 'Actor.a', scope: 'world', key: 'k', value: { a: [1] } }).value).toEqual({
        a: [1]
      });
      expect(() => parseRequest(setDocumentFlagRequestSchema, { uuid: 'Actor.a', scope: 'world', key: 'k' })).toThrow('value: is required');
      expect(() => parseRequest(setDocumentFlagRequestSchema, { uuid: 'Actor.a', scope: '', key: 'k', value: 1 })).toThrow(/^scope: /);
      expect(() => parseRequest(unsetDocumentFlagRequestSchema, { uuid: 'Actor.a', scope: 'world' })).toThrow(/^key: /);
    });
  });

  describe('sort-document', () => {
    it('requires a target and a position of before / after', () => {
      expect(toSortDocumentCommand(parseRequest(sortDocumentRequestSchema, { uuid: 'Actor.a', targetUuid: 'Actor.b', position: 'after' }))).toEqual({
        uuid: 'Actor.a',
        targetUuid: 'Actor.b',
        position: 'after'
      });
      expect(() => parseRequest(sortDocumentRequestSchema, { uuid: 'Actor.a', targetUuid: 'Actor.b', position: 'top' })).toThrow(
        /^position: /
      );
      expect(() => parseRequest(sortDocumentRequestSchema, { uuid: 'Actor.a', position: 'before' })).toThrow(/^targetUuid: /);
    });
  });

  describe('search-documents', () => {
    it('applies defaults, trims the query and drops duplicate types', () => {
      expect(toDocumentSearchQuery(parseRequest(searchDocumentsRequestSchema, { query: '  goblin ' }))).toEqual({
        query: 'goblin',
        documentTypes: [],
        source: 'all',
        limit: 10
      });
      expect(
        toDocumentSearchQuery(
          parseRequest(searchDocumentsRequestSchema, { query: 'x', documentTypes: ['Actor', 'Actor', 'Item'], source: 'compendiums', limit: 100 })
        )
      ).toMatchObject({ documentTypes: ['Actor', 'Item'], source: 'compendiums', limit: 100 });
    });

    it.each([
      [{ query: '   ' }, /^query: /],
      [{ query: 'x'.repeat(201) }, /^query: /],
      [{ query: 'x', documentTypes: ['User'] }, /^documentTypes\.0: /],
      [{ query: 'x', source: 'packs' }, /^source: /],
      [{ query: 'x', limit: 0 }, /^limit: /],
      [{ query: 'x', limit: 101 }, /^limit: /],
      [{ query: 'x', limit: 2.5 }, /^limit: /]
    ])('rejects %j', (params, message) => {
      expect(() => parseRequest(searchDocumentsRequestSchema, params)).toThrow(message);
    });
  });

  describe('import-document', () => {
    it('maps the command; an empty or null folder reads as the root', () => {
      expect(
        toImportDocumentCommand(parseRequest(importDocumentRequestSchema, { documentType: 'Actor', data: { name: 'Orc' }, folderId: '' }))
      ).toEqual({ documentType: 'Actor', data: { name: 'Orc' }, folderId: undefined });
      expect(
        toImportDocumentCommand(parseRequest(importDocumentRequestSchema, { documentType: 'Item', data: {}, folderId: 'f1' })).folderId
      ).toBe('f1');
    });

    it.each(['User', 'Setting', 'FogExploration', 'ChatMessage', 'Folder', 'actor'])('rejects the document type %s', (documentType) => {
      expect(() => parseRequest(importDocumentRequestSchema, { documentType, data: {} })).toThrow(/^documentType: /);
    });

    it('requires data to be an object', () => {
      expect(() => parseRequest(importDocumentRequestSchema, { documentType: 'Actor', data: [] })).toThrow(/^data: /);
      expect(() => parseRequest(importDocumentRequestSchema, { documentType: 'Actor', data: '{"name":"x"}' })).toThrow(/^data: /);
      expect(() => parseRequest(importDocumentRequestSchema, { documentType: 'Actor' })).toThrow(/^data: /);
    });
  });
});
