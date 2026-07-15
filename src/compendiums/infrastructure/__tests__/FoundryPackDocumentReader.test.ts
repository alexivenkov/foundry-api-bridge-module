import { PackDocumentNotFoundError, PackNotFoundError } from '../../domain';
import { FoundryPackDocumentReader } from '../FoundryPackDocumentReader';
import { makeGame, makePack, makePacksCollection, providerFor } from './fixtures';
import type { FoundryPackDocument } from '../foundryPackTypes';

function readerFor(packs: ReturnType<typeof makePack>[]): FoundryPackDocumentReader {
  return new FoundryPackDocumentReader(
    providerFor(makeGame({ packs: makePacksCollection(packs) }))
  );
}

function makeDoc(overrides: Partial<FoundryPackDocument> = {}): FoundryPackDocument {
  return {
    id: 'd1',
    uuid: 'Compendium.world.test-pack.Item.d1',
    name: 'Doc',
    type: 'weapon',
    img: 'w.png',
    toObject: () => ({ name: 'Doc', system: { damage: '1d8' } }),
    ...overrides
  };
}

describe('FoundryPackDocumentReader', () => {
  describe('readAllDocumentViews', () => {
    it('maps simple documents', async () => {
      const rawDoc = { id: 'a1', uuid: 'u1', name: 'Sword', type: 'weapon', img: 's.png' };
      const pack = makePack({
        getDocuments: jest.fn(async () => [rawDoc as unknown as FoundryPackDocument])
      });

      const views = await readerFor([pack]).readAllDocumentViews('world.test-pack');
      expect(views).toEqual([
        { id: 'a1', uuid: 'u1', name: 'Sword', type: 'weapon', img: 's.png' }
      ]);
    });

    it('maps embedded actor items and journal pages from Map collections', async () => {
      const items = new Map([
        ['i1', { id: 'i1', name: 'Claw', type: 'weapon', system: { dmg: 1 } }]
      ]);
      const pages = new Map([
        ['p1', { id: 'p1', name: 'Intro', type: 'text', text: { content: '<p>hi</p>' } }]
      ]);
      const actorDoc = { id: 'a2', uuid: 'u2', name: 'Goblin', type: 'npc', items };
      const journalDoc = { id: 'j1', uuid: 'u3', name: 'Notes', type: 'base', pages };
      const pack = makePack({
        getDocuments: jest.fn(async () => [
          actorDoc as unknown as FoundryPackDocument,
          journalDoc as unknown as FoundryPackDocument
        ])
      });

      const [actor, journal] = await readerFor([pack]).readAllDocumentViews('world.test-pack');
      expect(actor?.items).toEqual([
        { id: 'i1', name: 'Claw', type: 'weapon', img: '', system: { dmg: 1 } }
      ]);
      expect(journal?.pages).toEqual([
        {
          id: 'p1',
          name: 'Intro',
          type: 'text',
          text: '<p>hi</p>',
          markdown: null,
          enrichedText: null,
          src: null
        }
      ]);
    });

    it('throws PackNotFoundError for unknown pack', async () => {
      await expect(readerFor([]).readAllDocumentViews('ghost')).rejects.toThrow(
        PackNotFoundError
      );
    });
  });

  describe('readAllDocumentViews with a contents filter', () => {
    const docs = [
      { id: 'a1', uuid: 'u1', name: 'Sword', type: 'weapon' },
      { id: 'a2', uuid: 'u2', name: 'Potion', type: 'consumable' }
    ] as unknown as FoundryPackDocument[];

    afterEach(() => {
      delete (globalThis as Record<string, unknown>)['game'];
    });

    it('uses a server-side __in query on v13+', async () => {
      (globalThis as Record<string, unknown>)['game'] = { release: { generation: 13 } };
      const getDocuments = jest.fn(async () => [docs[0] as FoundryPackDocument]);
      const pack = makePack({ getDocuments });

      const views = await readerFor([pack]).readAllDocumentViews('world.test-pack', {
        types: ['weapon'],
        ids: ['a1']
      });

      expect(getDocuments).toHaveBeenCalledWith({
        type__in: ['weapon'],
        _id__in: ['a1']
      });
      expect(views.map(v => v.id)).toEqual(['a1']);
    });

    it('builds partial queries when only one constraint is set', async () => {
      (globalThis as Record<string, unknown>)['game'] = { release: { generation: 14 } };
      const getDocuments = jest.fn(async () => []);
      const pack = makePack({ getDocuments });

      await readerFor([pack]).readAllDocumentViews('world.test-pack', {
        types: ['spell']
      });
      expect(getDocuments).toHaveBeenCalledWith({ type__in: ['spell'] });
    });

    it('falls back to client-side filtering on pre-v13 cores', async () => {
      (globalThis as Record<string, unknown>)['game'] = { release: { generation: 12 } };
      const getDocuments = jest.fn(async () => docs);
      const pack = makePack({ getDocuments });

      const views = await readerFor([pack]).readAllDocumentViews('world.test-pack', {
        types: ['consumable']
      });

      expect(getDocuments).toHaveBeenCalledWith();
      expect(views.map(v => v.id)).toEqual(['a2']);
    });

    it('client-side fallback treats an empty list as matching nothing', async () => {
      const pack = makePack({ getDocuments: jest.fn(async () => docs) });

      const views = await readerFor([pack]).readAllDocumentViews('world.test-pack', {
        ids: []
      });
      expect(views).toEqual([]);
    });

    it('calls getDocuments without arguments when no filter is given', async () => {
      const getDocuments = jest.fn(async () => docs);
      const pack = makePack({ getDocuments });

      const views = await readerFor([pack]).readAllDocumentViews('world.test-pack');
      expect(getDocuments).toHaveBeenCalledWith();
      expect(views).toHaveLength(2);
    });

    it('ignores an empty filter object entirely', async () => {
      (globalThis as Record<string, unknown>)['game'] = { release: { generation: 13 } };
      const getDocuments = jest.fn(async () => docs);
      const pack = makePack({ getDocuments });

      const views = await readerFor([pack]).readAllDocumentViews('world.test-pack', {});
      expect(getDocuments).toHaveBeenCalledWith();
      expect(views).toHaveLength(2);
    });
  });

  describe('readDocumentRecord', () => {
    it('returns the raw record with toObject data', async () => {
      const pack = makePack({ getDocument: jest.fn(async () => makeDoc()) });

      const record = await readerFor([pack]).readDocumentRecord('world.test-pack', 'd1');
      expect(record).toEqual({
        id: 'd1',
        uuid: 'Compendium.world.test-pack.Item.d1',
        name: 'Doc',
        type: 'weapon',
        img: 'w.png',
        data: { name: 'Doc', system: { damage: '1d8' } }
      });
    });

    it('falls back type to empty string and img to null', async () => {
      const doc = makeDoc();
      delete (doc as { type?: string }).type;
      delete (doc as { img?: string | null }).img;
      const pack = makePack({ getDocument: jest.fn(async () => doc) });

      const record = await readerFor([pack]).readDocumentRecord('world.test-pack', 'd1');
      expect(record.type).toBe('');
      expect(record.img).toBeNull();
    });

    it('throws PackDocumentNotFoundError when getDocument yields null or undefined', async () => {
      const nullPack = makePack({ getDocument: jest.fn(async () => null) });
      await expect(
        readerFor([nullPack]).readDocumentRecord('world.test-pack', 'nope')
      ).rejects.toThrow('Document not found in pack world.test-pack: nope');

      const undefinedPack = makePack({ getDocument: jest.fn(async () => undefined) });
      await expect(
        readerFor([undefinedPack]).readDocumentRecord('world.test-pack', 'nope')
      ).rejects.toThrow(PackDocumentNotFoundError);
    });
  });

  describe('readDocumentSource', () => {
    it('returns the raw toObject data', async () => {
      const pack = makePack({ getDocument: jest.fn(async () => makeDoc()) });
      const source = await readerFor([pack]).readDocumentSource('world.test-pack', 'd1');
      expect(source).toEqual({ name: 'Doc', system: { damage: '1d8' } });
    });

    it('throws PackNotFoundError / PackDocumentNotFoundError consistently', async () => {
      await expect(readerFor([]).readDocumentSource('ghost', 'x')).rejects.toThrow(
        'Pack not found: ghost'
      );
      const pack = makePack({ getDocument: jest.fn(async () => null) });
      await expect(
        readerFor([pack]).readDocumentSource('world.test-pack', 'x')
      ).rejects.toThrow(PackDocumentNotFoundError);
    });
  });
});
