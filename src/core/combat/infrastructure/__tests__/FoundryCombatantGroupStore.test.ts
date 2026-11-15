import { CombatNotFoundError } from '../../domain';
import { FoundryCombatantGroupStore } from '../FoundryCombatantGroupStore';
import type { FoundryEncounterDocument } from '../foundryEncounterTypes';
import { clearFoundryGeneration, setFoundryGeneration } from './fakeDocuments';
import { encounterCombatant, encounterDocument, groupDocument, worldWith } from './fakeWorld';

function storeFor(...combats: FoundryEncounterDocument[]): FoundryCombatantGroupStore {
  const { game } = worldWith(combats);
  return new FoundryCombatantGroupStore({ getGame: () => game });
}

describe('FoundryCombatantGroupStore', () => {
  afterEach(() => {
    clearFoundryGeneration();
  });

  it.each([
    [13, true],
    [14, true],
    [12, false],
    [11, false]
  ])('knows groups on Foundry %i: %s', (generation, available) => {
    setFoundryGeneration(generation);

    expect(storeFor().groupsAvailable()).toBe(available);
  });

  describe('reading', () => {
    it('reads a group with what the core prepared: members, defeated and hidden', () => {
      const alpha = encounterCombatant({ id: 'alpha', defeated: true, hidden: false });
      const beta = encounterCombatant({ id: 'beta', defeated: true, hidden: true });
      const wolves = groupDocument({ id: 'wolves', img: 'icons/wolf.webp', initiative: 14, members: [alpha, beta] });
      const { document } = encounterDocument({ groups: [wolves] }, [alpha, beta]);

      expect(storeFor(document).listGroups('fight')).toEqual([
        {
          id: 'wolves',
          name: 'Wolves',
          img: 'icons/wolf.webp',
          initiative: 14,
          defeated: true,
          hidden: false,
          memberIds: ['alpha', 'beta']
        }
      ]);
    });

    it('reads a blank or unset name and an unset image as none', () => {
      const blank = groupDocument({ id: 'blank', name: '' });
      const unset = groupDocument({ id: 'unset', name: undefined });
      const { document } = encounterDocument({ groups: [blank, unset] });

      expect(storeFor(document).listGroups('fight').map((group) => [group.name, group.img])).toEqual([
        [null, null],
        [null, null]
      ]);
    });

    it('finds a group by id, and nothing for an unknown one or a core without groups', () => {
      const { document } = encounterDocument({ groups: [groupDocument({ id: 'wolves' })] });
      const { document: old } = encounterDocument({ id: 'old', groups: undefined });
      const store = storeFor(document, old);

      expect(store.findGroup('fight', 'wolves')?.id).toBe('wolves');
      expect(store.findGroup('fight', 'bears')).toBeNull();
      expect(store.findGroup('old', 'wolves')).toBeNull();
      expect(store.listGroups('old')).toEqual([]);
    });

    it('rejects an unknown combat', () => {
      expect(() => storeFor().listGroups('gone')).toThrow(new CombatNotFoundError('gone'));
    });
  });

  describe('writing', () => {
    it('creates a group as an embedded CombatantGroup with the fields given', async () => {
      const { document, createEmbedded } = encounterDocument();
      createEmbedded.mockResolvedValue([groupDocument({ id: 'bandits', name: 'Bandits', initiative: 9 })]);

      const created = await storeFor(document).createGroup('fight', { name: 'Bandits', initiative: 9 });

      expect(createEmbedded).toHaveBeenCalledWith('CombatantGroup', [{ name: 'Bandits', initiative: 9 }]);
      expect(created).toMatchObject({ id: 'bandits', name: 'Bandits', memberIds: [], defeated: true, hidden: true });
    });

    it('creates nothing for an empty draft but an empty group, and reports a veto as null', async () => {
      const { document, createEmbedded } = encounterDocument();
      createEmbedded.mockResolvedValue([]);

      expect(await storeFor(document).createGroup('fight', {})).toBeNull();
      expect(createEmbedded).toHaveBeenCalledWith('CombatantGroup', [{}]);
    });

    it('updates the group document, storing a cleared name as blank', async () => {
      const wolves = groupDocument({ id: 'wolves', img: 'icons/wolf.webp', initiative: 3 });
      const { document } = encounterDocument({ groups: [wolves] });

      const updated = await storeFor(document).updateGroup('fight', 'wolves', { name: null, img: null, initiative: null });

      expect(wolves.update).toHaveBeenCalledWith({ name: '', img: null, initiative: null });
      expect(updated).toMatchObject({ name: null, img: null, initiative: null });
    });

    it('sends only the fields that change', async () => {
      const wolves = groupDocument({ id: 'wolves' });
      const { document } = encounterDocument({ groups: [wolves] });

      await storeFor(document).updateGroup('fight', 'wolves', { initiative: 12 });

      expect(Object.keys(wolves.update.mock.calls[0]?.[0] as object)).toEqual(['initiative']);
    });

    it('reports an update of a group that is gone as null', async () => {
      const { document } = encounterDocument();

      expect(await storeFor(document).updateGroup('fight', 'wolves', { name: 'x' })).toBeNull();
    });

    it('deletes the group document', async () => {
      const wolves = groupDocument({ id: 'wolves' });
      const { document } = encounterDocument({ groups: [wolves] });

      await storeFor(document).deleteGroup('fight', 'wolves');

      expect(wolves.delete).toHaveBeenCalledWith();
    });
  });
});
