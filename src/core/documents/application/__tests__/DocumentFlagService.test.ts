import {
  CompendiumDocumentReadOnlyError,
  DocumentHasNoFlagsError,
  DocumentNotFoundError,
  FlagScopeUnavailableError,
  InvalidFlagKeyError,
  PayloadTooLargeError,
  type FlaggedDocument
} from '../../domain';
import { DocumentFlagService } from '../DocumentFlagService';
import { FakeFlagStore, ref } from './fakePorts';

const actor: FlaggedDocument = {
  document: ref(),
  flags: { world: { quest: 'started', notes: { mood: 'grim' } }, dnd5e: { favorite: true } }
};

function setup(documents: FlaggedDocument[] = [actor]): { store: FakeFlagStore; service: DocumentFlagService } {
  const store = new FakeFlagStore(documents);
  return { store, service: new DocumentFlagService({ documents: store }) };
}

describe('DocumentFlagService', () => {
  describe('getFlags', () => {
    it('returns every scope without a scope filter', async () => {
      const { service } = setup();

      await expect(service.getFlags({ uuid: 'Actor.a1', scope: undefined })).resolves.toEqual({
        document: ref(),
        scope: null,
        flags: actor.flags
      });
    });

    it('returns one scope, or {} when the document has none in it', async () => {
      const { service } = setup();

      await expect(service.getFlags({ uuid: 'Actor.a1', scope: 'dnd5e' })).resolves.toMatchObject({
        scope: 'dnd5e',
        flags: { favorite: true }
      });
      await expect(service.getFlags({ uuid: 'Actor.a1', scope: 'inactive-module' })).resolves.toMatchObject({
        scope: 'inactive-module',
        flags: {}
      });
    });

    it('refuses an unknown uuid and a type without flags', async () => {
      const { service } = setup([{ document: ref({ uuid: 'Setting.s1', documentType: 'Setting' }), flags: null }]);

      await expect(service.getFlags({ uuid: 'Actor.x', scope: undefined })).rejects.toThrow(DocumentNotFoundError);
      await expect(service.getFlags({ uuid: 'Setting.s1', scope: undefined })).rejects.toThrow(DocumentHasNoFlagsError);
      await expect(service.getFlags({ uuid: 'Setting.s1', scope: undefined })).rejects.toThrow(
        'Setting documents have no flags: Setting.s1'
      );
    });
  });

  describe('setFlag', () => {
    it('writes the flag and returns the stored value', async () => {
      const { store, service } = setup();

      const result = await service.setFlag({ uuid: 'Actor.a1', scope: 'world', key: 'visited', value: [1, 2] });

      expect(store.setCalls).toEqual([{ uuid: 'Actor.a1', scope: 'world', key: 'visited', value: [1, 2] }]);
      expect(result).toEqual({ document: ref(), scope: 'world', key: 'visited', value: [1, 2] });
    });

    it('stores null as a value', async () => {
      const { service } = setup();

      await expect(service.setFlag({ uuid: 'Actor.a1', scope: 'world', key: 'cleared', value: null })).resolves.toMatchObject({
        value: null
      });
    });

    it('refuses an inactive scope with the valid ones, before writing', async () => {
      const { store, service } = setup();

      await expect(service.setFlag({ uuid: 'Actor.a1', scope: 'pf2e', key: 'x', value: 1 })).rejects.toThrow(
        FlagScopeUnavailableError
      );
      await expect(service.setFlag({ uuid: 'Actor.a1', scope: 'pf2e', key: 'x', value: 1 })).rejects.toThrow(
        'valid scopes: core, world, dnd5e'
      );
      expect(store.setCalls).toHaveLength(0);
    });

    it('refuses a bad key and an oversized value before any lookup', async () => {
      const { service } = setup([]);

      await expect(service.setFlag({ uuid: 'Actor.x', scope: 'world', key: 'a.-=b', value: 1 })).rejects.toThrow(
        InvalidFlagKeyError
      );
      await expect(
        service.setFlag({ uuid: 'Actor.x', scope: 'world', key: 'big', value: 'x'.repeat(70000) })
      ).rejects.toThrow(PayloadTooLargeError);
    });

    it('refuses a compendium document', async () => {
      const { store, service } = setup([{ document: ref({ uuid: 'Compendium.p.Actor.a', packId: 'p' }), flags: {} }]);

      await expect(service.setFlag({ uuid: 'Compendium.p.Actor.a', scope: 'world', key: 'k', value: 1 })).rejects.toThrow(
        CompendiumDocumentReadOnlyError
      );
      expect(store.setCalls).toHaveLength(0);
    });

    it('reports a document that vanished during the write as not found', async () => {
      const { store, service } = setup();
      store.losesDocumentOnWrite = true;

      await expect(service.setFlag({ uuid: 'Actor.a1', scope: 'world', key: 'k', value: 1 })).rejects.toThrow(
        'Document not found: Actor.a1'
      );
    });
  });

  describe('unsetFlag', () => {
    it('removes an existing flag', async () => {
      const { store, service } = setup();

      const result = await service.unsetFlag({ uuid: 'Actor.a1', scope: 'world', key: 'notes.mood' });

      expect(store.unsetCalls).toEqual([{ uuid: 'Actor.a1', scope: 'world', key: 'notes.mood' }]);
      expect(result).toEqual({ document: ref(), scope: 'world', key: 'notes.mood', existed: true });
    });

    it('does not write when there is no such flag', async () => {
      const { store, service } = setup();

      await expect(service.unsetFlag({ uuid: 'Actor.a1', scope: 'world', key: 'missing' })).resolves.toMatchObject({
        existed: false
      });
      expect(store.unsetCalls).toHaveLength(0);
    });

    it('refuses an inactive scope and a compendium document', async () => {
      const { service } = setup([actor, { document: ref({ uuid: 'Compendium.p.Actor.a', packId: 'p' }), flags: {} }]);

      await expect(service.unsetFlag({ uuid: 'Actor.a1', scope: 'gone-module', key: 'k' })).rejects.toThrow(
        FlagScopeUnavailableError
      );
      await expect(service.unsetFlag({ uuid: 'Compendium.p.Actor.a', scope: 'world', key: 'k' })).rejects.toThrow(
        CompendiumDocumentReadOnlyError
      );
    });
  });
});
