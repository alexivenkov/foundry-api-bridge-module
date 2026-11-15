import {
  CompendiumDocumentReadOnlyError,
  DocumentHasNoOwnershipError,
  DocumentNotFoundError,
  InheritOwnershipNotAllowedError,
  NoOwnershipChangesError,
  OwnershipUserNotFoundError,
  type OwnedDocument,
  type OwnershipLevel
} from '../../domain';
import { DocumentOwnershipService } from '../DocumentOwnershipService';
import { FakeOwnershipStore, ref } from './fakePorts';

function owned(uuid: string, defaultLevel: OwnershipLevel, users: Record<string, OwnershipLevel> = {}): OwnedDocument {
  return { document: ref({ uuid }), ownership: { defaultLevel, users: new Map(Object.entries(users)) } };
}

const USERS = { u1: 'Alice', u2: 'Bob', gm: 'Gamemaster' };

function setup(documents: OwnedDocument[] = [owned('Actor.a1', 'none', { u1: 'owner', ghost: 'limited' })]): {
  store: FakeOwnershipStore;
  service: DocumentOwnershipService;
} {
  const store = new FakeOwnershipStore(documents, USERS);
  return { store, service: new DocumentOwnershipService({ documents: store }) };
}

describe('DocumentOwnershipService', () => {
  describe('getOwnership', () => {
    it('returns the default level and the explicit entries with user names', async () => {
      const { service } = setup();

      const result = await service.getOwnership({ uuid: 'Actor.a1' });

      expect(result).toEqual({
        document: ref({ uuid: 'Actor.a1' }),
        defaultLevel: 'none',
        users: [
          { userId: 'u1', userName: 'Alice', level: 'owner' },
          { userId: 'ghost', userName: null, level: 'limited' }
        ]
      });
    });

    it('reads a compendium document', async () => {
      const packed: OwnedDocument = {
        document: ref({ uuid: 'Compendium.p.Actor.a', packId: 'p' }),
        ownership: { defaultLevel: 'observer', users: new Map() }
      };
      const { service } = setup([packed]);

      await expect(service.getOwnership({ uuid: 'Compendium.p.Actor.a' })).resolves.toMatchObject({ defaultLevel: 'observer' });
    });

    it('refuses an unknown uuid and a type without ownership', async () => {
      const { service } = setup([{ document: ref({ uuid: 'Folder.f1', documentType: 'Folder' }), ownership: null }]);

      await expect(service.getOwnership({ uuid: 'Actor.nope' })).rejects.toThrow(DocumentNotFoundError);
      await expect(service.getOwnership({ uuid: 'Actor.nope' })).rejects.toThrow('Document not found: Actor.nope');
      await expect(service.getOwnership({ uuid: 'Folder.f1' })).rejects.toThrow(DocumentHasNoOwnershipError);
      await expect(service.getOwnership({ uuid: 'Folder.f1' })).rejects.toThrow('Folder documents have no ownership: Folder.f1');
    });
  });

  describe('setOwnership', () => {
    it('replaces the stored ownership with the changed levels and returns them', async () => {
      const { store, service } = setup();

      const result = await service.setOwnership({
        uuid: 'Actor.a1',
        changes: {
          defaultLevel: 'limited',
          users: new Map<string, OwnershipLevel | null>([
            ['u2', 'observer'],
            ['ghost', null]
          ])
        }
      });

      expect(store.replaced).toHaveLength(1);
      expect(store.replaced[0]?.ownership.defaultLevel).toBe('limited');
      expect([...(store.replaced[0]?.ownership.users ?? [])]).toEqual([
        ['u1', 'owner'],
        ['u2', 'observer']
      ]);
      expect(result.users).toEqual([
        { userId: 'u1', userName: 'Alice', level: 'owner' },
        { userId: 'u2', userName: 'Bob', level: 'observer' }
      ]);
    });

    it('refuses a level for a user the world does not have, but lets a dead entry be removed', async () => {
      const { store, service } = setup();

      await expect(
        service.setOwnership({ uuid: 'Actor.a1', changes: { users: new Map([['stranger', 'owner']]) } })
      ).rejects.toThrow(OwnershipUserNotFoundError);
      await expect(
        service.setOwnership({ uuid: 'Actor.a1', changes: { users: new Map([['stranger', 'owner']]) } })
      ).rejects.toThrow('User not found: stranger');
      expect(store.replaced).toHaveLength(0);

      await expect(
        service.setOwnership({ uuid: 'Actor.a1', changes: { users: new Map([['ghost', null]]) } })
      ).resolves.toMatchObject({ users: [{ userId: 'u1' }] });
    });

    it('refuses an empty change before looking anything up', async () => {
      const { service } = setup([]);

      await expect(service.setOwnership({ uuid: 'Actor.nope', changes: {} })).rejects.toThrow(NoOwnershipChangesError);
    });

    it('refuses a compendium document', async () => {
      const packed: OwnedDocument = {
        document: ref({ uuid: 'Compendium.p.Actor.a', packId: 'p' }),
        ownership: { defaultLevel: 'none', users: new Map() }
      };
      const { store, service } = setup([packed]);

      await expect(
        service.setOwnership({ uuid: 'Compendium.p.Actor.a', changes: { defaultLevel: 'observer' } })
      ).rejects.toThrow(CompendiumDocumentReadOnlyError);
      expect(store.replaced).toHaveLength(0);
    });

    it('refuses inherit on a primary document and accepts it on a page', async () => {
      const pageDoc: OwnedDocument = {
        document: ref({ uuid: 'JournalEntry.j.JournalEntryPage.p', documentType: 'JournalEntryPage', parentUuid: 'JournalEntry.j' }),
        ownership: { defaultLevel: 'inherit', users: new Map() }
      };
      const { service } = setup([owned('Actor.a1', 'none'), pageDoc]);

      await expect(service.setOwnership({ uuid: 'Actor.a1', changes: { defaultLevel: 'inherit' } })).rejects.toThrow(
        InheritOwnershipNotAllowedError
      );
      await expect(
        service.setOwnership({
          uuid: 'JournalEntry.j.JournalEntryPage.p',
          changes: { users: new Map([['u1', 'inherit']]) }
        })
      ).resolves.toMatchObject({ users: [{ userId: 'u1', level: 'inherit' }] });
    });

    it('reports a document that vanished during the write as not found', async () => {
      const { store, service } = setup();
      store.losesDocumentOnWrite = true;

      await expect(service.setOwnership({ uuid: 'Actor.a1', changes: { defaultLevel: 'owner' } })).rejects.toThrow(
        'Document not found: Actor.a1'
      );
    });
  });
});
