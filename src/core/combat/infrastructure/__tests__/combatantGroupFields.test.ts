import { FoundryCombatantStore } from '../FoundryCombatantStore';
import type { FoundryCombatDocument } from '../foundryCombatTypes';
import {
  clearFoundryGeneration,
  combatDocument,
  combatantDocument,
  gameWith,
  setFoundryGeneration
} from './fakeDocuments';

// The group and scene fields of a combatant, as the probe of Foundry 13 / 14
// shows them: `group` a 16-character id or null (the core does not check that
// the group exists), `sceneId` the scene of the token.

function storeFor(...combats: FoundryCombatDocument[]): FoundryCombatantStore {
  const { game } = gameWith(combats);
  return new FoundryCombatantStore({ getGame: () => game });
}

describe('combatant group and scene fields', () => {
  afterEach(() => {
    clearFoundryGeneration();
  });

  describe('reading', () => {
    it('reads the group the core put the combatant in (Foundry 13+)', () => {
      setFoundryGeneration(13);
      const { document } = combatDocument({}, [
        combatantDocument({ id: 'grouped', group: { id: 'gggggggggggggggg' } }),
        combatantDocument({ id: 'stale', group: 'zzzzzzzzzzzzzzzz' }),
        combatantDocument({ id: 'single', group: null })
      ]);

      expect(storeFor(document).listCombatants('fight').map((entry) => entry.groupId)).toEqual([
        'gggggggggggggggg',
        null,
        null
      ]);
    });

    it('leaves the group out before Foundry 13', () => {
      setFoundryGeneration(12);
      const { document } = combatDocument({}, [combatantDocument({ id: 'c1' })]);

      expect('groupId' in (storeFor(document).findCombatant('fight', 'c1') ?? {})).toBe(false);
    });
  });

  describe('writing', () => {
    it('adds a looked-up token with the payload of TokenDocument.createCombatants, and its group', async () => {
      const { document, createEmbedded } = combatDocument();
      createEmbedded.mockResolvedValue([combatantDocument()]);

      await storeFor(document).addCombatant('fight', {
        actorId: 'aaaaaaaaaaaaaaaa',
        tokenId: 'tttttttttttttttt',
        sceneId: 'ssssssssssssssss',
        hidden: true,
        groupId: 'gggggggggggggggg'
      });

      expect(createEmbedded).toHaveBeenCalledWith('Combatant', [
        {
          actorId: 'aaaaaaaaaaaaaaaa',
          tokenId: 'tttttttttttttttt',
          sceneId: 'ssssssssssssssss',
          hidden: true,
          group: 'gggggggggggggggg'
        }
      ]);
    });

    it('moves a combatant into a group and out of it', async () => {
      const fighter = combatantDocument();
      const { document } = combatDocument({}, [fighter]);
      const store = storeFor(document);

      await store.updateCombatant('fight', 'c1', { groupId: 'gggggggggggggggg' });
      await store.updateCombatant('fight', 'c1', { groupId: null });

      expect((fighter.update as jest.Mock).mock.calls).toEqual([[{ group: 'gggggggggggggggg' }], [{ group: null }]]);
    });
  });
});
