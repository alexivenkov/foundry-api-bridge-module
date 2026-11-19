import { CombatNotFoundError } from '../../domain';
import { FoundryCombatantStore } from '../FoundryCombatantStore';
import type { FoundryCombatDocument } from '../foundryCombatTypes';
import { combatDocument, combatantDocument, gameWith } from './fakeDocuments';

function storeFor(...combats: FoundryCombatDocument[]): FoundryCombatantStore {
  const { game } = gameWith(combats);
  return new FoundryCombatantStore({ getGame: () => game });
}

describe('FoundryCombatantStore', () => {
  describe('reading', () => {
    it('lists the combatants of the collection', () => {
      const { document } = combatDocument({}, [combatantDocument({ id: 'c1' }), combatantDocument({ id: 'c2' })]);

      expect(storeFor(document).listCombatants('fight').map((entry) => entry.id)).toEqual(['c1', 'c2']);
    });

    it('finds a combatant by id, with its fields as they are', () => {
      const { document } = combatDocument({}, [
        combatantDocument({ id: 'c1', tokenId: null, initiative: null, hidden: true })
      ]);

      expect(storeFor(document).findCombatant('fight', 'c1')).toEqual({
        id: 'c1',
        actorId: 'a1',
        tokenId: null,
        name: 'Fighter',
        img: 'icons/fighter.webp',
        initiative: null,
        defeated: false,
        hidden: true
      });
    });

    it('returns null for an unknown combatant', () => {
      expect(storeFor(combatDocument().document).findCombatant('fight', 'missing')).toBeNull();
    });

    it('rejects an unknown combat', () => {
      expect(() => storeFor().listCombatants('missing')).toThrow(CombatNotFoundError);
      expect(() => storeFor().findCombatant('missing', 'c1')).toThrow('Combat not found: missing');
    });

    it('reads the combat the tracker shows', () => {
      const viewed = combatDocument({ id: 'shown' }, [combatantDocument({ id: 'c1' })]).document;
      const { game, get } = gameWith([], { viewed });

      expect(new FoundryCombatantStore({ getGame: () => game }).listCombatants('shown')).toHaveLength(1);
      expect(get).not.toHaveBeenCalled();
    });
  });

  describe('addCombatant', () => {
    it('creates an embedded Combatant with the actor alone for a bare draft', async () => {
      const { document, createEmbedded } = combatDocument();
      createEmbedded.mockResolvedValue([combatantDocument({ id: 'new' })]);

      const added = await storeFor(document).addCombatant('fight', { actorId: 'a1' });

      expect(createEmbedded).toHaveBeenCalledWith('Combatant', [{ actorId: 'a1' }]);
      expect(Object.keys((createEmbedded.mock.calls[0] as [string, Array<Record<string, unknown>>])[1][0] ?? {}))
        .toEqual(['actorId']);
      expect(added?.id).toBe('new');
    });

    it('sends the token, the initiative and the hidden flag when they are set', async () => {
      const { document, createEmbedded } = combatDocument();
      createEmbedded.mockResolvedValue([combatantDocument()]);

      await storeFor(document).addCombatant('fight', { actorId: 'a1', tokenId: 't1', initiative: 0, hidden: false });

      expect(createEmbedded).toHaveBeenCalledWith('Combatant', [
        { actorId: 'a1', tokenId: 't1', initiative: 0, hidden: false }
      ]);
    });

    it('sends a null token and a null initiative as they are', async () => {
      const { document, createEmbedded } = combatDocument();
      createEmbedded.mockResolvedValue([combatantDocument()]);

      await storeFor(document).addCombatant('fight', { actorId: 'a1', tokenId: null, initiative: null });

      expect(createEmbedded).toHaveBeenCalledWith('Combatant', [{ actorId: 'a1', tokenId: null, initiative: null }]);
    });

    it('resolves to null when the core created nothing', async () => {
      const { document, createEmbedded } = combatDocument();
      createEmbedded.mockResolvedValue([]);

      await expect(storeFor(document).addCombatant('fight', { actorId: 'a1' })).resolves.toBeNull();
    });
  });

  describe('updateCombatant', () => {
    it('sends only the attributes that are set', async () => {
      const fighter = combatantDocument({ id: 'c1' });
      const { document } = combatDocument({}, [fighter]);

      await storeFor(document).updateCombatant('fight', 'c1', { defeated: true, hidden: undefined });

      expect(fighter.update).toHaveBeenCalledWith({ defeated: true });
      expect(Object.keys((fighter.update as jest.Mock).mock.calls[0]?.[0] as object)).toEqual(['defeated']);
    });

    it('sends every attribute, a null initiative included', async () => {
      const fighter = combatantDocument({ id: 'c1' });
      const { document } = combatDocument({}, [fighter]);

      const updated = await storeFor(document).updateCombatant('fight', 'c1', {
        initiative: null,
        defeated: false,
        hidden: true
      });

      expect(fighter.update).toHaveBeenCalledWith({ initiative: null, defeated: false, hidden: true });
      expect(updated).toMatchObject({ initiative: null, defeated: false, hidden: true });
    });

    it('reports the document as it is after an update that changed nothing', async () => {
      const fighter = combatantDocument({ id: 'c1', hidden: false, update: jest.fn().mockResolvedValue(undefined) });
      const { document } = combatDocument({}, [fighter]);

      const updated = await storeFor(document).updateCombatant('fight', 'c1', { hidden: true });

      expect(updated?.hidden).toBe(false);
    });

    it('resolves to null for an unknown combatant', async () => {
      await expect(
        storeFor(combatDocument().document).updateCombatant('fight', 'missing', { hidden: true })
      ).resolves.toBeNull();
    });
  });

  describe('removeCombatant', () => {
    it('deletes the embedded document by id', async () => {
      const { document, deleteEmbedded } = combatDocument({}, [combatantDocument({ id: 'c1' })]);

      await storeFor(document).removeCombatant('fight', 'c1');

      expect(deleteEmbedded).toHaveBeenCalledWith('Combatant', ['c1']);
    });
  });

  describe('initiative', () => {
    it('sets the initiative through the combat', async () => {
      const { document, setInitiative } = combatDocument({}, [combatantDocument({ id: 'c1' })]);

      await storeFor(document).setInitiative('fight', 'c1', 21);
      await storeFor(document).setInitiative('fight', 'c1', null);

      expect(setInitiative.mock.calls).toEqual([
        ['c1', 21],
        ['c1', null]
      ]);
    });

    it('rolls for the named combatants without a dialog and no other options by default', async () => {
      const { document, rollInitiative } = combatDocument();

      await storeFor(document).rollInitiative('fight', ['c1', 'c2'], {});

      expect(rollInitiative).toHaveBeenCalledWith(['c1', 'c2'], { skipDialog: true });
      expect(Object.keys((rollInitiative.mock.calls[0] as [string[], object])[1])).toEqual(['skipDialog']);
    });

    it('rolls with a custom formula', async () => {
      const { document, rollInitiative } = combatDocument();

      await storeFor(document).rollInitiative('fight', ['c1'], { formula: '2d6+5' });

      expect(rollInitiative).toHaveBeenCalledWith(['c1'], { formula: '2d6+5', skipDialog: true });
    });

    it('sends a null formula as it is', async () => {
      const { document, rollInitiative, rollAll } = combatDocument();

      await storeFor(document).rollInitiative('fight', ['c1'], { formula: null });
      await storeFor(document).rollAll('fight', { formula: null });

      expect(rollInitiative).toHaveBeenCalledWith(['c1'], { formula: null, skipDialog: true });
      expect(rollAll).toHaveBeenCalledWith({ formula: null, skipDialog: true });
    });

    it('rolls for everyone with the core `rollAll`', async () => {
      const { document, rollAll, rollNPC } = combatDocument();

      await storeFor(document).rollAll('fight', { formula: '1d20' });

      expect(rollAll).toHaveBeenCalledWith({ formula: '1d20', skipDialog: true });
      expect(rollNPC).not.toHaveBeenCalled();
    });

    it('rolls for the non-player combatants with the core `rollNPC`', async () => {
      const { document, rollAll, rollNPC } = combatDocument();

      await storeFor(document).rollNpcs('fight', {});

      expect(rollNPC).toHaveBeenCalledWith({ skipDialog: true });
      expect(rollAll).not.toHaveBeenCalled();
    });

    it('rejects an unknown combat', async () => {
      await expect(storeFor().rollAll('missing', {})).rejects.toThrow(CombatNotFoundError);
      await expect(storeFor().setInitiative('missing', 'c1', 1)).rejects.toThrow('Combat not found: missing');
    });
  });
});
