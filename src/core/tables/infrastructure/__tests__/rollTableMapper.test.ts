import { toFoundryRollTableChanges, toRollTable } from '../rollTableMapper';
import type { FoundryRollTableDocument } from '../foundryRollTableTypes';

function tableDocument(folder: FoundryRollTableDocument['folder']): FoundryRollTableDocument {
  return {
    id: 't1',
    name: 'Loot',
    img: undefined,
    description: undefined,
    formula: '1d6',
    replacement: true,
    displayRoll: true,
    results: { contents: [] },
    folder,
    roll: jest.fn(),
    draw: jest.fn(),
    resetResults: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
}

describe('roll table folder', () => {
  it('reads the folder id, null at the root', () => {
    expect(toRollTable(tableDocument({ id: 'f1' })).folderId).toBe('f1');
    expect(toRollTable(tableDocument(null)).folderId).toBeNull();
  });

  it('leaves the folder unknown when the document reports none at all', () => {
    expect(toRollTable(tableDocument(undefined)).folderId).toBeUndefined();
  });

  it('writes a folder change, null moving the table to the root', () => {
    expect(toFoundryRollTableChanges({ folderId: 'f1' })).toEqual({ folder: 'f1' });
    expect(toFoundryRollTableChanges({ folderId: null, name: 'Loot' })).toEqual({ name: 'Loot', folder: null });
    expect(toFoundryRollTableChanges({ name: 'Loot' })).toEqual({ name: 'Loot' });
  });
});
