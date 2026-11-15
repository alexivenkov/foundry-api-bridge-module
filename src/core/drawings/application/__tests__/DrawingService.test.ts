import { CoreFeatureUnavailableError, NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import {
  DrawingAuthorNotFoundError,
  DrawingCreationFailedError,
  DrawingNotFoundError,
  DrawingShapeError,
  InvisibleDrawingError
} from '../../domain';
import { DrawingService } from '../DrawingService';
import { FakeAuthors, FakeDrawingStore, FakeSceneLocator, drawing } from './fakePorts';

const label = drawing({
  id: 'label',
  shape: { type: 'rectangle', width: 300, height: 60, points: [] },
  stroke: { width: 0, color: '#ffffff', alpha: 1 },
  text: { content: 'Tavern', fontFamily: null, fontSize: 48, color: '#ffffff', alpha: 1 }
});
const path = drawing({
  id: 'path',
  x: 100,
  y: 100,
  shape: { type: 'polygon', width: 40, height: 40, points: [0, 0, 40, 0, 40, 40] },
  bezierFactor: 0.5
});

function setup(options: { active?: string | null; store?: FakeDrawingStore } = {}): {
  service: DrawingService;
  store: FakeDrawingStore;
} {
  const store = options.store ?? new FakeDrawingStore({ dungeon: [label, path] });
  const scenes = new FakeSceneLocator(['dungeon', 'tavern'], options.active === undefined ? 'dungeon' : options.active);
  const authors = new FakeAuthors(['gmgmgmgmgmgmgmgm', 'playerplayer0001']);
  return { service: new DrawingService({ scenes, drawings: store, authors }), store };
}

describe('DrawingService', () => {
  describe('listDrawings', () => {
    it('lists the active scene, or the named one', () => {
      const { service } = setup();

      expect(service.listDrawings({ sceneId: undefined }).drawings.map((d) => d.id)).toEqual(['label', 'path']);
      expect(service.listDrawings({ sceneId: 'tavern' })).toEqual({ sceneId: 'tavern', drawings: [] });
    });

    it('rejects an unknown scene and a missing active scene', () => {
      expect(() => setup().service.listDrawings({ sceneId: 'missing' })).toThrow(SceneNotFoundError);
      expect(() => setup({ active: null }).service.listDrawings({ sceneId: undefined })).toThrow(NoActiveSceneError);
    });

    it('refuses before Foundry 12', () => {
      const store = new FakeDrawingStore();
      store.caps = { supported: false, names: false, levels: false };

      expect(() => setup({ store }).service.listDrawings({ sceneId: undefined })).toThrow(
        new CoreFeatureUnavailableError('Drawing commands require Foundry 12 or newer')
      );
    });
  });

  describe('createDrawing', () => {
    it('creates a text label', async () => {
      const { service, store } = setup();
      const draft = {
        x: 10,
        y: 20,
        shape: { type: 'rectangle' as const, width: 400, height: 80 },
        stroke: { width: 0 },
        text: { content: 'Tavern' }
      };

      const result = await service.createDrawing({ sceneId: 'tavern', draft });

      expect(result.sceneId).toBe('tavern');
      expect(store.created).toEqual([
        { sceneId: 'tavern', draft: { ...draft, shape: { type: 'rectangle', width: 400, height: 80, points: [] } } }
      ]);
    });

    it('normalizes a freehand polygon and moves it accordingly', async () => {
      const { service, store } = setup();

      await service.createDrawing({
        sceneId: undefined,
        draft: { x: 100, y: 200, shape: { type: 'polygon', points: [10, 20, 50, 20, 50, 60] }, bezierFactor: 0.5 }
      });

      expect(store.created[0]?.draft).toEqual({
        x: 110,
        y: 220,
        shape: { type: 'polygon', width: 40, height: 40, points: [0, 0, 40, 0, 40, 40] },
        bezierFactor: 0.5
      });
    });

    it('checks an explicit author and lets the core default an absent one', async () => {
      const { service, store } = setup();
      const shape = { type: 'rectangle' as const, width: 100, height: 100 };

      await service.createDrawing({ sceneId: undefined, draft: { x: 0, y: 0, shape, authorId: 'playerplayer0001' } });
      expect(store.created[0]?.draft.authorId).toBe('playerplayer0001');

      await expect(
        service.createDrawing({ sceneId: undefined, draft: { x: 0, y: 0, shape, authorId: 'unknownunknown00' } })
      ).rejects.toThrow(new DrawingAuthorNotFoundError('unknownunknown00'));
    });

    it('refuses an invisible drawing with the core defaults applied', async () => {
      const { service, store } = setup();

      await expect(
        service.createDrawing({
          sceneId: undefined,
          draft: { x: 0, y: 0, shape: { type: 'rectangle', width: 100, height: 100 }, stroke: { width: 0 } }
        })
      ).rejects.toThrow(new InvisibleDrawingError('A drawing needs visible text, a visible fill or a visible stroke'));
      await expect(
        service.createDrawing({ sceneId: undefined, draft: { x: 0, y: 0, shape: { type: 'ellipse', width: 8, height: 50 } } })
      ).rejects.toThrow('An ellipse must be wider and taller than its stroke width (8 px)');
      expect(store.created).toEqual([]);
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      await expect(
        service.createDrawing({ sceneId: undefined, draft: { x: 0, y: 0, shape: { type: 'rectangle', width: 50, height: 50 } } })
      ).rejects.toThrow(new DrawingCreationFailedError());
    });
  });

  describe('updateDrawing', () => {
    it('moves a polygon whose points change and writes the normalized shape', async () => {
      const { service, store } = setup();

      await service.updateDrawing({ sceneId: undefined, drawingId: 'path', changes: { shape: { points: [-10, 0, 30, 0, 30, 30] } } });

      expect(store.updated[0]?.changes).toEqual({
        x: 90,
        y: undefined,
        shape: { type: 'polygon', width: 40, height: 30, points: [0, 0, 40, 0, 40, 30] }
      });
    });

    it('refuses to clear the text of a text-only label', async () => {
      const { service, store } = setup();

      await expect(
        service.updateDrawing({ sceneId: undefined, drawingId: 'label', changes: { text: { content: null } } })
      ).rejects.toThrow(InvisibleDrawingError);
      expect(store.updated).toEqual([]);
    });

    it('accepts clearing the text once a line shows', async () => {
      const { service, store } = setup();

      await service.updateDrawing({
        sceneId: undefined,
        drawingId: 'label',
        changes: { text: { content: null }, stroke: { width: 4 } }
      });

      expect(store.updated).toHaveLength(1);
    });

    it('does not judge visibility for an unrelated change', async () => {
      const invisible = drawing({ id: 'ghost', stroke: { width: 0, color: '#ffffff', alpha: 1 } });
      const { service, store } = setup({ store: new FakeDrawingStore({ dungeon: [invisible] }) });

      await service.updateDrawing({ sceneId: undefined, drawingId: 'ghost', changes: { hidden: true } });

      expect(store.updated[0]?.changes).toMatchObject({ hidden: true });
    });

    it('refuses an incomplete shape change', async () => {
      await expect(
        setup().service.updateDrawing({ sceneId: undefined, drawingId: 'label', changes: { shape: { type: 'polygon' } } })
      ).rejects.toThrow(new DrawingShapeError('A polygon needs points'));
    });

    it('rejects an unknown drawing, and one that vanished during the update', async () => {
      const { service, store } = setup();

      await expect(service.updateDrawing({ sceneId: undefined, drawingId: 'nope', changes: {} })).rejects.toThrow(
        new DrawingNotFoundError('nope')
      );
      store.losesDrawingOnUpdate = true;
      await expect(service.updateDrawing({ sceneId: undefined, drawingId: 'label', changes: {} })).rejects.toThrow(
        DrawingNotFoundError
      );
    });

    it('refuses a name before Foundry 14', async () => {
      await expect(
        setup().service.updateDrawing({ sceneId: undefined, drawingId: 'label', changes: { name: 'Sign' } })
      ).rejects.toThrow(new CoreFeatureUnavailableError('Drawing names require Foundry 14 or newer'));
    });
  });

  describe('deleteDrawing', () => {
    it('deletes an existing drawing and rejects an unknown one', async () => {
      const { service, store } = setup();

      await expect(service.deleteDrawing({ sceneId: 'dungeon', drawingId: 'path' })).resolves.toEqual({
        sceneId: 'dungeon',
        drawingId: 'path'
      });
      expect(store.deleted).toEqual([{ sceneId: 'dungeon', drawingId: 'path' }]);
      await expect(service.deleteDrawing({ sceneId: undefined, drawingId: 'nope' })).rejects.toThrow(
        'Drawing not found: nope'
      );
    });
  });
});
