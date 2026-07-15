import { DomainError } from '@/kernel';
import { AdventureImportUnsupportedError } from '../AdventureImportUnsupportedError';
import { EmbeddedItemCreationFailedError } from '../EmbeddedItemCreationFailedError';
import { ImportCreationFailedError } from '../ImportCreationFailedError';
import { PackDocumentNotFoundError } from '../PackDocumentNotFoundError';
import { PackNotFoundError } from '../PackNotFoundError';
import { PackTypeMismatchError } from '../PackTypeMismatchError';
import { WorldActorNotFoundError } from '../WorldActorNotFoundError';
import { WorldDocumentClassUnavailableError } from '../WorldDocumentClassUnavailableError';

describe('compendium domain errors', () => {
  it('PackNotFoundError carries packId and the canonical wire text', () => {
    const error = new PackNotFoundError('dnd5e.spells');
    expect(error.message).toBe('Pack not found: dnd5e.spells');
    expect(error.packId).toBe('dnd5e.spells');
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(PackNotFoundError);
    expect(error.name).toBe('PackNotFoundError');
  });

  it('PackDocumentNotFoundError carries packId and documentId', () => {
    const error = new PackDocumentNotFoundError('dnd5e.spells', 'abc123');
    expect(error.message).toBe('Document not found in pack dnd5e.spells: abc123');
    expect(error.packId).toBe('dnd5e.spells');
    expect(error.documentId).toBe('abc123');
    expect(error).toBeInstanceOf(DomainError);
  });

  it('PackTypeMismatchError uses the legacy actor/item wording', () => {
    const actorFlavor = new PackTypeMismatchError('p1', 'Actor', 'Item');
    expect(actorFlavor.message).toBe('Compendium pack is not an Actor pack: p1');
    const itemFlavor = new PackTypeMismatchError('p2', 'Item', 'Actor');
    expect(itemFlavor.message).toBe('Compendium pack is not an Item pack: p2');
    expect(actorFlavor.expectedType).toBe('Actor');
    expect(actorFlavor.actualType).toBe('Item');
  });

  it('AdventureImportUnsupportedError keeps the exact wire text', () => {
    const error = new AdventureImportUnsupportedError('world.adv');
    expect(error.message).toBe(
      'Adventure import not supported via this command — use Foundry UI for Adventures'
    );
    expect(error.packId).toBe('world.adv');
  });

  it('WorldDocumentClassUnavailableError keeps the exact wire text', () => {
    const error = new WorldDocumentClassUnavailableError('RollTable');
    expect(error.message).toBe('Document class not available for type: RollTable');
    expect(error.documentType).toBe('RollTable');
  });

  it('ImportCreationFailedError keeps the exact wire text', () => {
    const error = new ImportCreationFailedError('doc9');
    expect(error.message).toBe('Failed to import document: doc9');
    expect(error.documentId).toBe('doc9');
  });

  it('EmbeddedItemCreationFailedError keeps the exact wire text', () => {
    expect(new EmbeddedItemCreationFailedError().message).toBe(
      'Failed to create item from compendium'
    );
  });

  it('WorldActorNotFoundError keeps the exact wire text', () => {
    const error = new WorldActorNotFoundError('actor7');
    expect(error.message).toBe('Actor not found: actor7');
    expect(error.actorId).toBe('actor7');
  });

  it('all errors survive instanceof after cross-realm-style prototype checks', () => {
    const errors: DomainError[] = [
      new PackNotFoundError('a'),
      new PackDocumentNotFoundError('a', 'b'),
      new PackTypeMismatchError('a', 'Actor', 'Item'),
      new AdventureImportUnsupportedError('a'),
      new WorldDocumentClassUnavailableError('a'),
      new ImportCreationFailedError('a'),
      new EmbeddedItemCreationFailedError(),
      new WorldActorNotFoundError('a')
    ];
    for (const error of errors) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
    }
  });
});
