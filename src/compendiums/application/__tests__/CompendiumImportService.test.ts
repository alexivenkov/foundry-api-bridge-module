import {
  AdventureImportUnsupportedError,
  EmbeddedItemCreationFailedError,
  ImportCreationFailedError,
  PackNotFoundError,
  PackTypeMismatchError,
  WorldActorNotFoundError
} from '../../domain';
import { CompendiumImportService } from '../CompendiumImportService';
import {
  FakeActorInventory,
  FakeCatalog,
  FakeDocumentReader,
  FakeWorldImporter,
  descriptor
} from './fakePorts';

interface Setup {
  service: CompendiumImportService;
  documentReader: FakeDocumentReader;
  worldImporter: FakeWorldImporter;
  actorInventory: FakeActorInventory;
}

function setup(packs = [descriptor({ id: 'p1', type: 'Item' })]): Setup {
  const documentReader = new FakeDocumentReader();
  documentReader.source = { _id: 'src1', name: 'Source', system: { quantity: 1 } };
  const worldImporter = new FakeWorldImporter();
  const actorInventory = new FakeActorInventory();
  const service = new CompendiumImportService({
    catalog: new FakeCatalog(packs),
    documentReader,
    worldImporter,
    actorInventory
  });
  return { service, documentReader, worldImporter, actorInventory };
}

describe('CompendiumImportService', () => {
  describe('importDocument', () => {
    it('strips _id, applies overrides, and creates via the pack document type', async () => {
      const { service, worldImporter } = setup([
        descriptor({ id: 'p1', type: 'RollTable' })
      ]);

      const result = await service.importDocument({
        packId: 'p1',
        documentId: 'src1',
        name: 'Renamed',
        folder: 'f1'
      });

      expect(worldImporter.importedType).toBe('RollTable');
      expect(worldImporter.importedData).toEqual({
        name: 'Renamed',
        folder: 'f1',
        system: { quantity: 1 }
      });
      expect(result).toEqual({
        worldId: 'w1',
        uuid: 'Actor.w1',
        name: 'Imported',
        documentType: 'RollTable'
      });
    });

    it('rejects Adventure packs before reading any document', async () => {
      const { service, documentReader } = setup([
        descriptor({ id: 'adv', type: 'Adventure' })
      ]);
      documentReader.source = null;

      await expect(
        service.importDocument({ packId: 'adv', documentId: 'x' })
      ).rejects.toThrow(AdventureImportUnsupportedError);
    });

    it('throws ImportCreationFailedError when create yields nothing', async () => {
      const { service, worldImporter } = setup();
      worldImporter.importResult = null;

      await expect(
        service.importDocument({ packId: 'p1', documentId: 'doc9' })
      ).rejects.toThrow(ImportCreationFailedError);
      await expect(
        service.importDocument({ packId: 'p1', documentId: 'doc9' })
      ).rejects.toThrow('Failed to import document: doc9');
    });

    it('throws PackNotFoundError for unknown pack', async () => {
      const { service } = setup();
      await expect(
        service.importDocument({ packId: 'ghost', documentId: 'x' })
      ).rejects.toThrow(PackNotFoundError);
    });
  });

  describe('importActor', () => {
    it('requires an Actor pack', async () => {
      const { service } = setup([descriptor({ id: 'p1', type: 'Item' })]);
      await expect(
        service.importActor({ packId: 'p1', actorId: 'a1' })
      ).rejects.toThrow('Compendium pack is not an Actor pack: p1');
      await expect(
        service.importActor({ packId: 'p1', actorId: 'a1' })
      ).rejects.toThrow(PackTypeMismatchError);
    });

    it('strips _id, applies overrides, and creates a world actor', async () => {
      const { service, worldImporter } = setup([descriptor({ id: 'p1', type: 'Actor' })]);

      const view = await service.importActor({
        packId: 'p1',
        actorId: 'a1',
        name: 'Renamed',
        folder: 'f2'
      });

      expect(worldImporter.actorData).toEqual({
        name: 'Renamed',
        folder: 'f2',
        system: { quantity: 1 }
      });
      expect(view.id).toBe('a1');
    });
  });

  describe('importItem', () => {
    it('requires an Item pack and creates a world item', async () => {
      const { service, worldImporter } = setup([descriptor({ id: 'p1', type: 'Item' })]);

      const view = await service.importItem({ packId: 'p1', itemId: 'i1' });
      expect(worldImporter.itemData).toEqual({ name: 'Source', system: { quantity: 1 } });
      expect(view.type).toBe('weapon');

      const actorPack = setup([descriptor({ id: 'ap', type: 'Actor' })]);
      await expect(
        actorPack.service.importItem({ packId: 'ap', itemId: 'i1' })
      ).rejects.toThrow('Compendium pack is not an Item pack: ap');
    });
  });

  describe('addItemToActor', () => {
    it('checks the target actor before the pack', async () => {
      const { service, actorInventory } = setup();
      actorInventory.actor = null;

      await expect(
        service.addItemToActor({ actorId: 'ghost', packId: 'missing-too', itemId: 'i1' })
      ).rejects.toThrow(WorldActorNotFoundError);
      await expect(
        service.addItemToActor({ actorId: 'ghost', packId: 'missing-too', itemId: 'i1' })
      ).rejects.toThrow('Actor not found: ghost');
    });

    it('applies name and quantity overrides onto the item data', async () => {
      const { service, actorInventory } = setup();

      const result = await service.addItemToActor({
        actorId: 'actor1',
        packId: 'p1',
        itemId: 'i1',
        name: 'Renamed',
        quantity: 5
      });

      expect(actorInventory.lastItemData).toEqual({
        name: 'Renamed',
        system: { quantity: 5 }
      });
      expect(result.actor).toEqual({ id: 'actor1', name: 'Hero' });
      expect(result.item.id).toBe('emb1');
    });

    it('creates a system object when the source item has none', async () => {
      const { service, documentReader, actorInventory } = setup();
      documentReader.source = { _id: 'x', name: 'Bare' };

      await service.addItemToActor({
        actorId: 'actor1',
        packId: 'p1',
        itemId: 'i1',
        quantity: 2
      });

      expect(actorInventory.lastItemData).toEqual({
        name: 'Bare',
        system: { quantity: 2 }
      });
    });

    it('throws EmbeddedItemCreationFailedError when nothing is created', async () => {
      const { service, actorInventory } = setup();
      actorInventory.created = null;

      await expect(
        service.addItemToActor({ actorId: 'actor1', packId: 'p1', itemId: 'i1' })
      ).rejects.toThrow(EmbeddedItemCreationFailedError);
      await expect(
        service.addItemToActor({ actorId: 'actor1', packId: 'p1', itemId: 'i1' })
      ).rejects.toThrow('Failed to create item from compendium');
    });

    it('requires an Item pack', async () => {
      const { service } = setup([descriptor({ id: 'p1', type: 'Actor' })]);
      await expect(
        service.addItemToActor({ actorId: 'actor1', packId: 'p1', itemId: 'i1' })
      ).rejects.toThrow(PackTypeMismatchError);
    });
  });
});
