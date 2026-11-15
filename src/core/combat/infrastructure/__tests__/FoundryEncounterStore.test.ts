import { CombatNotFoundError } from '../../domain';
import { FoundryEncounterStore } from '../FoundryEncounterStore';
import type { FoundryEncounterDocument } from '../foundryEncounterTypes';
import { clearFoundryGeneration, setFoundryGeneration } from './fakeDocuments';
import { encounterCombatant, encounterDocument, worldWith, type WorldOptions } from './fakeWorld';

function storeFor(combats: FoundryEncounterDocument[], options: WorldOptions = {}): FoundryEncounterStore {
  const { game } = worldWith(combats, options);
  return new FoundryEncounterStore({ getGame: () => game });
}

describe('FoundryEncounterStore', () => {
  afterEach(() => {
    clearFoundryGeneration();
  });

  describe('locating', () => {
    it('finds an encounter by id and the one the tracker shows', () => {
      const fight = encounterDocument({ id: 'fight' }).document;
      const ambush = encounterDocument({ id: 'ambush' }).document;
      const store = storeFor([fight, ambush], { viewed: fight });

      expect(store.findCombat('ambush')).toEqual({ id: 'ambush' });
      expect(store.findCombat('gone')).toBeNull();
      expect(store.findActiveCombat()).toEqual({ id: 'fight' });
      expect(storeFor([fight]).findActiveCombat()).toBeNull();
    });
  });

  describe('listing', () => {
    it('reads every encounter as a summary, marking the one commands default to', () => {
      setFoundryGeneration(13);
      const fight = encounterDocument(
        { id: 'fight', scene: { id: 'crypt' }, active: true, round: 2, turn: 1 },
        [
          encounterCombatant({ id: 'c1', sceneId: 'crypt' }),
          encounterCombatant({ id: 'c2', sceneId: null }),
          encounterCombatant({ id: 'c3', sceneId: 'crypt' })
        ]
      ).document;
      const prep = encounterDocument({ id: 'prep', round: 0, started: false }).document;

      expect(storeFor([fight, prep], { viewed: fight }).listEncounters()).toEqual([
        {
          id: 'fight',
          sceneId: 'crypt',
          active: true,
          isDefault: true,
          started: true,
          round: 2,
          turn: 1,
          combatantCount: 3,
          combatantSceneIds: ['crypt']
        },
        {
          id: 'prep',
          sceneId: null,
          active: false,
          isDefault: false,
          started: false,
          round: 0,
          turn: 0,
          combatantCount: 0,
          combatantSceneIds: []
        }
      ]);
    });

    it('reads the name of an encounter from Foundry 14 on, a blank one as none', () => {
      setFoundryGeneration(14);
      const named = encounterDocument({ id: 'named', name: 'Bridge Ambush' }).document;
      const blank = encounterDocument({ id: 'blank', name: '' }).document;

      expect(storeFor([named, blank]).listEncounters().map((entry) => entry.name)).toEqual(['Bridge Ambush', null]);
    });

    it('leaves the name out on Foundry 13', () => {
      setFoundryGeneration(13);

      expect('name' in (storeFor([encounterDocument().document]).listEncounters()[0] ?? {})).toBe(false);
    });

    it('reads a turn of null as it is', () => {
      const { document } = encounterDocument();
      (document as { turn: number | null }).turn = null;

      expect(storeFor([document]).readEncounter('fight').turn).toBeNull();
    });
  });

  describe('writing', () => {
    it('activates through the document and reports the encounter afterwards', async () => {
      const { document, activate } = encounterDocument({ active: false });

      const activated = await storeFor([document]).activate('fight');

      expect(activate).toHaveBeenCalledWith();
      expect(activated.active).toBe(true);
    });

    it('links and unlinks the scene with an update of `scene`', async () => {
      const { document, update } = encounterDocument();
      const store = storeFor([document]);

      await store.linkScene('fight', 'crypt');
      await store.linkScene('fight', null);

      expect(update.mock.calls).toEqual([[{ scene: 'crypt' }], [{ scene: null }]]);
    });

    it('plays the rounds through the core and reports what they resolve to', async () => {
      const { document, nextRound, previousRound } = encounterDocument({ round: 2 });
      const store = storeFor([document]);

      expect((await store.nextRound('fight')).round).toBe(3);
      expect((await store.previousRound('fight')).round).toBe(2);
      expect(nextRound).toHaveBeenCalledTimes(1);
      expect(previousRound).toHaveBeenCalledTimes(1);
    });

    it('reports the combat as it stands when a round call resolves to nothing', async () => {
      const { document, nextRound } = encounterDocument({ round: 4 });
      nextRound.mockResolvedValue(undefined);

      expect((await storeFor([document]).nextRound('fight')).round).toBe(4);
    });

    it('resets the initiative through the core, whatever it resolves to', async () => {
      const { document, resetAll } = encounterDocument();

      const combat = await storeFor([document]).resetInitiative('fight');

      expect(resetAll).toHaveBeenCalledWith();
      expect(combat.id).toBe('fight');
    });

    it('rejects an unknown encounter', async () => {
      await expect(storeFor([]).nextRound('gone')).rejects.toThrow(new CombatNotFoundError('gone'));
      expect(() => storeFor([]).readEncounter('gone')).toThrow(CombatNotFoundError);
    });
  });
});
