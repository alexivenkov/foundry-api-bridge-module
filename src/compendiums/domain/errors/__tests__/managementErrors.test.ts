import { DomainError } from '../../../../kernel';
import {
  AdventureContentTypeUnavailableError,
  AdventureImportPreventedError,
  AdventureOverwriteRefusedError,
  CompendiumFeatureUnavailableError,
  FolderExportFailedError,
  PackAlreadyExistsError,
  PackCreationFailedError,
  PackDocumentExportFailedError,
  PackFolderNotFoundError,
  PackLockedError,
  PackNotDeletableError,
  PackNotWorldDocumentTypeError,
  PackTypeUnsupportedError,
  WorldDocumentNotFoundError,
  WorldFolderNotFoundError,
  WorldFolderTypeMismatchError,
  WorldIdCollisionError
} from '..';

describe('compendium management errors', () => {
  it.each([
    [new PackLockedError('dnd5e.monsters'), 'Compendium pack is locked: dnd5e.monsters; unlock it with configure-compendium first'],
    [new PackNotDeletableError('dnd5e.monsters', 'system', 'dnd5e'), 'Only world compendium packs can be deleted; dnd5e.monsters belongs to the system dnd5e'],
    [new PackTypeUnsupportedError('ActiveEffect'), 'ActiveEffect compendium packs are not supported by this Foundry version'],
    [new PackAlreadyExistsError('world.monsters'), 'Compendium pack already exists: world.monsters'],
    [new PackCreationFailedError('Monsters'), 'Failed to create compendium pack: Monsters'],
    [new PackFolderNotFoundError('world.monsters', 'f1'), 'Folder not found in pack world.monsters: f1'],
    [new PackNotWorldDocumentTypeError('world.adv', 'Adventure'), 'Compendium pack world.adv holds Adventure documents, which are not world documents; use import-adventure'],
    [new PackNotWorldDocumentTypeError('world.fx', 'ActiveEffect'), 'Compendium pack world.fx holds ActiveEffect documents, which are not world documents'],
    [new WorldFolderNotFoundError('f1'), 'Folder not found: f1'],
    [new WorldFolderTypeMismatchError('f1', 'Item', 'Actor'), 'Folder f1 is of type Item; expected Actor'],
    [new WorldDocumentNotFoundError('Actor', 'a1'), 'Actor not found: a1'],
    [new WorldIdCollisionError('world.monsters', 3), '3 document(s) of world.monsters already exist in the world with the same id; import without keepId or delete them first'],
    [new PackDocumentExportFailedError('world.monsters', 'a1'), 'Failed to export document a1 to compendium world.monsters'],
    [new FolderExportFailedError('world.monsters', 'f1'), 'Failed to export folder f1 to compendium world.monsters'],
    [new AdventureImportPreventedError('Lost Mine'), 'Adventure import was cancelled by a preImportAdventure hook: Lost Mine'],
    [new AdventureContentTypeUnavailableError('Combat'), 'Adventure content type Combat is not available in this Foundry version'],
    [new AdventureOverwriteRefusedError('Lost Mine', 3, 'Actor 2, Scene 1'), 'Importing adventure Lost Mine would overwrite 3 existing world document(s) (Actor 2, Scene 1); pass overwrite: true to replace them'],
    [new CompendiumFeatureUnavailableError('Adventure import is not available in this Foundry version'), 'Adventure import is not available in this Foundry version']
  ])('%s carries its wire text', (error, text) => {
    expect(error).toBeInstanceOf(DomainError);
    expect(error.message).toBe(text);
  });
});
