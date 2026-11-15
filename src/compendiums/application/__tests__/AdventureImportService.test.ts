import {
  AdventureContentTypeUnavailableError,
  AdventureImportPreventedError,
  AdventureOverwriteRefusedError,
  CompendiumFeatureUnavailableError,
  PackDocumentNotFoundError,
  PackTypeMismatchError
} from '../../domain';
import { AdventureImportService } from '../AdventureImportService';
import { FakeAdventureGateway, FakePackManager, packInfo } from './managementFakes';

function setup(): { service: AdventureImportService; adventures: FakeAdventureGateway } {
  const packs = new FakePackManager(packInfo({ id: 'world.adventures', type: 'Adventure' }), packInfo());
  const adventures = new FakeAdventureGateway();
  return { service: new AdventureImportService({ packs, adventures }), adventures };
}

const replaced = { documentType: 'Scene', documents: [{ id: 's1', name: 'Cave' }] };

describe('AdventureImportService', () => {
  describe('getAdventure', () => {
    it('describes the content with what an import would overwrite', async () => {
      const { service, adventures } = setup();
      adventures.plan = { ...adventures.plan, toUpdate: [replaced] };
      const details = await service.getAdventure({ packId: 'world.adventures', adventureId: 'adv1' });
      expect(details).toMatchObject({ packId: 'world.adventures', name: 'Lost Mine', totalCount: 2, existingCount: 1 });
      expect(details.contents.map(content => content.documentType)).toEqual(['Actor', 'Scene']);
      expect(adventures.plans).toEqual([undefined]);
    });

    it('refuses a pack of another type, a missing adventure and a core without the API', async () => {
      const { service, adventures } = setup();
      await expect(service.getAdventure({ packId: 'world.monsters', adventureId: 'adv1' })).rejects.toThrow(PackTypeMismatchError);
      adventures.header = null;
      await expect(service.getAdventure({ packId: 'world.adventures', adventureId: 'gone' })).rejects.toThrow(
        PackDocumentNotFoundError
      );
      adventures.available = false;
      await expect(service.getAdventure({ packId: 'world.adventures', adventureId: 'adv1' })).rejects.toThrow(
        CompendiumFeatureUnavailableError
      );
    });
  });

  describe('importAdventure', () => {
    const command = { packId: 'world.adventures', adventureId: 'adv1', overwrite: false };

    it('imports when nothing would be overwritten', async () => {
      const { service, adventures } = setup();
      const imported = await service.importAdventure({ ...command, documentTypes: ['Actor'] });
      expect(adventures.plans).toEqual([['Actor']]);
      expect(adventures.imports).toEqual([{ documentTypes: ['Actor'], allowOverwrite: false }]);
      expect(imported).toMatchObject({ adventureId: 'adv1', name: 'Lost Mine', updated: [] });
    });

    it('refuses to overwrite world documents without overwrite: true, before writing', async () => {
      const { service, adventures } = setup();
      adventures.plan = { toCreate: [], toUpdate: [replaced] };
      await expect(service.importAdventure(command)).rejects.toThrow(
        new AdventureOverwriteRefusedError('Lost Mine', 1, 'Scene 1')
      );
      expect(adventures.imports).toEqual([]);
    });

    it('overwrites with overwrite: true', async () => {
      const { service, adventures } = setup();
      adventures.plan = { toCreate: [], toUpdate: [replaced] };
      adventures.outcome = { created: [], updated: [replaced] };
      const imported = await service.importAdventure({ ...command, overwrite: true });
      expect(adventures.imports).toEqual([{ documentTypes: undefined, allowOverwrite: true }]);
      expect(imported.updated).toEqual([replaced]);
    });

    it('reports a hook-cancelled import and refuses types the version lacks', async () => {
      const { service, adventures } = setup();
      adventures.outcome = null;
      await expect(service.importAdventure(command)).rejects.toThrow(AdventureImportPreventedError);
      adventures.types = ['Actor', 'Folder'];
      await expect(service.importAdventure({ ...command, documentTypes: ['Combat'] })).rejects.toThrow(
        AdventureContentTypeUnavailableError
      );
    });
  });
});
