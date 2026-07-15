import { WorldDocumentClassUnavailableError } from '../../domain';
import { FoundryWorldImporter } from '../FoundryWorldImporter';
import { makeGame, providerFor } from './fixtures';
import type { FoundryCreatedDocument } from '../foundryPackTypes';

const globals = globalThis as unknown as Record<string, unknown>;

function makeCreated(overrides: Partial<FoundryCreatedDocument> = {}): FoundryCreatedDocument {
  return {
    id: 'w1',
    uuid: 'Actor.w1',
    name: 'Created',
    type: 'npc',
    img: 'c.png',
    folder: null,
    ...overrides
  };
}

describe('FoundryWorldImporter', () => {
  afterEach(() => {
    delete globals['RollTable'];
    delete globals['BrokenClass'];
  });

  describe('createByDocumentType', () => {
    it('creates via the matching global document class', async () => {
      const create = jest.fn(async () => ({ id: 'r1', uuid: 'RollTable.r1', name: 'Loot' }));
      globals['RollTable'] = { create };
      const importer = new FoundryWorldImporter(providerFor(makeGame()));

      const result = await importer.createByDocumentType('RollTable', { name: 'Loot' });
      expect(create).toHaveBeenCalledWith({ name: 'Loot' });
      expect(result).toEqual({ id: 'r1', uuid: 'RollTable.r1', name: 'Loot' });
    });

    it('throws WorldDocumentClassUnavailableError when the class is missing', async () => {
      const importer = new FoundryWorldImporter(providerFor(makeGame()));
      await expect(importer.createByDocumentType('Nonexistent', {})).rejects.toThrow(
        'Document class not available for type: Nonexistent'
      );
      await expect(importer.createByDocumentType('Nonexistent', {})).rejects.toThrow(
        WorldDocumentClassUnavailableError
      );
    });

    it('throws when the global exists but has no create function', async () => {
      globals['BrokenClass'] = { notCreate: true };
      const importer = new FoundryWorldImporter(providerFor(makeGame()));
      await expect(importer.createByDocumentType('BrokenClass', {})).rejects.toThrow(
        WorldDocumentClassUnavailableError
      );
    });

    it('returns null when create resolves to nothing', async () => {
      globals['RollTable'] = { create: jest.fn(async () => null) };
      const importer = new FoundryWorldImporter(providerFor(makeGame()));
      expect(await importer.createByDocumentType('RollTable', {})).toBeNull();
    });
  });

  describe('createActor / createItem', () => {
    it('creates an actor through game.actors.documentClass and maps folder name', async () => {
      const create = jest.fn(async () => makeCreated({ folder: { name: 'Monsters' } }));
      const game = makeGame();
      game.actors.documentClass.create = create;
      const importer = new FoundryWorldImporter(providerFor(game));

      const view = await importer.createActor({ name: 'Created' });
      expect(create).toHaveBeenCalledWith({ name: 'Created' });
      expect(view).toEqual({
        id: 'w1',
        uuid: 'Actor.w1',
        name: 'Created',
        type: 'npc',
        img: 'c.png',
        folderName: 'Monsters'
      });
    });

    it('creates an item through game.items.documentClass with null folder', async () => {
      const create = jest.fn(async () => makeCreated({ uuid: 'Item.w1', type: 'weapon' }));
      const game = makeGame();
      game.items.documentClass.create = create;
      const importer = new FoundryWorldImporter(providerFor(game));

      const view = await importer.createItem({ name: 'Created' });
      expect(view.folderName).toBeNull();
      expect(view.type).toBe('weapon');
    });
  });
});
