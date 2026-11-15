import { SceneNotFoundError } from '../../../shared';
import { RegionNotFoundError } from '../../domain';
import { FoundryRegionStore } from '../FoundryRegionStore';
import {
  V13_SOURCE,
  V14_SOURCE,
  fakeBehavior,
  fakeRegion,
  fakeScene,
  gameWith,
  globalsWith,
  type FakeRegion
} from './fakeFoundry';

function storeFor(generation: number, ...regions: FakeRegion[]): { store: FoundryRegionStore; scene: ReturnType<typeof fakeScene> } {
  const scene = fakeScene('S', regions, { levels: { get: (id: string) => (id === 'l1' ? {} : undefined) } });
  return { store: new FoundryRegionStore(gameWith(scene), globalsWith(), () => generation), scene };
}

describe('FoundryRegionStore', () => {
  describe('features', () => {
    it('follows the Foundry generation', () => {
      expect(storeFor(11).store.features().available).toBe(false);
      expect(storeFor(12).store.features()).toMatchObject({ available: true, extendedModel: false });
      expect(storeFor(13).store.features().shapeTypes).toEqual(['rectangle', 'circle', 'ellipse', 'polygon']);
      expect(storeFor(14).store.features()).toMatchObject({
        available: true,
        extendedModel: true,
        visibilities: ['layer', 'gamemaster', 'always', 'observer', 'layer-unlocked']
      });
    });
  });

  describe('reading', () => {
    it('maps a Foundry 13 region without the Foundry 14 fields', () => {
      const { store } = storeFor(13, fakeRegion(V13_SOURCE));

      expect(store.findRegion('S', 'r1')).toEqual({
        id: 'r1',
        name: 'Trap',
        color: '#ff0000',
        shapes: [
          { type: 'rectangle', x: 0, y: 0, width: 100, height: 50, rotation: 30, hole: false },
          { type: 'circle', x: 10, y: 10, radius: 5, hole: true },
          { type: 'ellipse', x: 1, y: 2, radiusX: 3, radiusY: 4, rotation: 0, hole: false },
          { type: 'polygon', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 80 }], hole: false }
        ],
        elevation: { bottom: 0, top: 10 },
        visibility: 'gamemaster',
        locked: true,
        behaviors: []
      });
    });

    it('maps every Foundry 14 shape and attribute', () => {
      const { store } = storeFor(14, fakeRegion(V14_SOURCE));

      expect(store.findRegion('S', 'r2')).toEqual({
        id: 'r2',
        name: 'V14',
        color: '#5328cc',
        shapes: [
          { type: 'rectangle', x: 0, y: 0, width: 100, height: 50, rotation: 0, hole: false, anchorX: 0.5, anchorY: 0.5, gridBased: true },
          { type: 'polygon', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 80 }], hole: false, origin: { x: 5, y: 6 } },
          { type: 'cone', x: 0, y: 0, radius: 100, angle: 90, rotation: 45, curvature: 'flat', hole: false, gridBased: false },
          { type: 'ring', x: 0, y: 0, radius: 100, innerWidth: 10, outerWidth: 20, hole: false, gridBased: false },
          { type: 'line', x: 0, y: 0, length: 300, width: 50, rotation: 10, hole: false, gridBased: false },
          {
            type: 'emanation',
            base: { type: 'token', x: 100, y: 100, width: 1, height: 2, shape: 'ellipse-1', hole: false },
            radius: 50,
            hole: false,
            gridBased: false
          },
          { type: 'token', x: 100, y: 200, width: 2, height: 2, shape: 'rectangle-2', hole: false },
          { type: 'grid', cells: [{ row: 1, column: 2 }, { row: 3, column: 4 }], origin: null, hole: false }
        ],
        elevation: { bottom: 0, top: 5, topInclusive: true },
        visibility: 'layer-unlocked',
        locked: false,
        levelIds: ['llllllllllllllll'],
        restriction: { enabled: true, type: 'sight', priority: 3 },
        attachedTokenId: 'tttttttttttttttt',
        highlightMode: 'coverage',
        displayMeasurements: true,
        hidden: true,
        behaviors: []
      });
    });

    it('leaves out shapes of unknown types and reads an unknown visibility as null', () => {
      const { store } = storeFor(
        14,
        fakeRegion({ ...V13_SOURCE, visibility: 99, shapes: [{ type: 'blob' }, { type: 'circle', x: 1, y: 1, radius: 1 }] })
      );
      const region = store.findRegion('S', 'r1');
      expect(region?.visibility).toBeNull();
      expect(region?.shapes).toEqual([{ type: 'circle', x: 1, y: 1, radius: 1, hole: false }]);
    });

    it('resolves the relative UUIDs Foundry 14 stores in behaviors', () => {
      const teleport = fakeBehavior({
        _id: 'b1',
        name: 'Gate',
        type: 'teleportToken',
        disabled: false,
        system: {
          destinations: ['..r9', 'Scene.X.Region.yyyyyyyyyyyyyyyy'],
          placement: 'random',
          snap: true,
          choice: false,
          revealed: false,
          dialog: { revealed: null, unrevealed: null },
          transition: { type: null, duration: 1500 }
        }
      });
      const { store } = storeFor(14, fakeRegion(V14_SOURCE, [teleport]));

      expect(store.findRegion('S', 'r2')?.behaviors).toEqual([
        {
          id: 'b1',
          name: 'Gate',
          type: 'teleportToken',
          disabled: false,
          config: {
            kind: 'teleportToken',
            settings: {
              destinationUuids: ['Scene.S.Region.r9', 'Scene.X.Region.yyyyyyyyyyyyyyyy'],
              choice: false,
              placement: 'random',
              snap: true,
              revealed: false,
              dialog: { revealed: null, unrevealed: null },
              transition: { type: null, duration: 1500 }
            }
          }
        }
      ]);
    });

    it('lists regions and answers the canonical errors', () => {
      const { store } = storeFor(13, fakeRegion(V13_SOURCE));
      expect(store.listRegions('S').map((region) => region.id)).toEqual(['r1']);
      expect(store.findRegion('S', 'nope')).toBeNull();
      expect(() => store.listRegions('other')).toThrow(new SceneNotFoundError('other'));
    });
  });

  describe('writing', () => {
    it('creates with only the attributes given, in Foundry vocabulary', async () => {
      const { store, scene } = storeFor(13);
      scene.createEmbeddedDocuments.mockResolvedValue([fakeRegion(V13_SOURCE)]);

      const created = await store.createRegion('S', {
        name: 'Trap',
        color: '#ff0000',
        elevation: { bottom: 0, top: 10 },
        visibility: 'gamemaster',
        locked: true,
        shapes: [
          { type: 'rectangle', x: 0, y: 0, width: 100, height: 50, rotation: 30 },
          { type: 'circle', x: 10, y: 10, radius: 5, hole: true },
          { type: 'polygon', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 80 }] }
        ]
      });

      expect(scene.createEmbeddedDocuments).toHaveBeenCalledWith('Region', [
        {
          name: 'Trap',
          color: '#ff0000',
          shapes: [
            { type: 'rectangle', x: 0, y: 0, width: 100, height: 50, rotation: 30 },
            { type: 'circle', hole: true, x: 10, y: 10, radius: 5 },
            { type: 'polygon', points: [0, 0, 100, 0, 50, 80] }
          ],
          visibility: 1,
          locked: true,
          elevation: { bottom: 0, top: 10 }
        }
      ]);
      expect(created?.id).toBe('r1');
    });

    it('writes the Foundry 14 shapes and attributes as the v14 model stores them', async () => {
      const { store, scene } = storeFor(14);
      scene.createEmbeddedDocuments.mockResolvedValue([fakeRegion(V14_SOURCE)]);

      await store.createRegion('S', {
        name: 'V14',
        levelIds: ['l1'],
        restriction: { enabled: true, type: 'sight', priority: 3 },
        attachedTokenId: 't1',
        highlightMode: 'coverage',
        displayMeasurements: true,
        hidden: true,
        visibility: 'layer-unlocked',
        elevation: { topInclusive: true },
        shapes: [
          { type: 'emanation', base: { type: 'token', x: 1, y: 2, width: 1, height: 2, shape: 'ellipse-1' }, radius: 50 },
          { type: 'grid', cells: [{ row: 1, column: 2 }], origin: null },
          { type: 'cone', x: 0, y: 0, radius: 100, angle: 90, curvature: 'flat' }
        ]
      });

      expect(scene.createEmbeddedDocuments).toHaveBeenCalledWith('Region', [
        {
          name: 'V14',
          shapes: [
            { type: 'emanation', base: { type: 'token', x: 1, y: 2, width: 1, height: 2, shape: 0 }, radius: 50 },
            { type: 'grid', offsets: [{ i: 1, j: 2 }], origin: null },
            { type: 'cone', x: 0, y: 0, radius: 100, angle: 90, curvature: 'flat' }
          ],
          visibility: 4,
          levels: ['l1'],
          highlightMode: 'coverage',
          displayMeasurements: true,
          hidden: true,
          elevation: { topInclusive: true },
          restriction: { enabled: true, type: 'sight', priority: 3 },
          attachment: { token: 't1' }
        }
      ]);
    });

    it('answers null when the core created nothing', async () => {
      const { store, scene } = storeFor(13);
      scene.createEmbeddedDocuments.mockResolvedValue([]);
      await expect(store.createRegion('S', { name: 'X' })).resolves.toBeNull();
    });

    it('updates partially: a cleared bound, a detached token, shapes replaced', async () => {
      const document = fakeRegion(V14_SOURCE);
      const { store } = storeFor(14, document);

      await store.updateRegion('S', 'r2', {
        elevation: { top: null },
        attachedTokenId: null,
        restriction: { priority: 2 },
        shapes: [{ type: 'rectangle', x: 1, y: 1, width: 2, height: 2 }]
      });

      expect(document.update).toHaveBeenCalledWith({
        shapes: [{ type: 'rectangle', x: 1, y: 1, width: 2, height: 2 }],
        elevation: { top: null },
        restriction: { priority: 2 },
        attachment: { token: null }
      });
      await expect(store.updateRegion('S', 'nope', { name: 'X' })).resolves.toBeNull();
    });

    it('deletes through the scene', async () => {
      const { store, scene } = storeFor(13, fakeRegion(V13_SOURCE));
      await store.deleteRegion('S', 'r1');
      expect(scene.deleteEmbeddedDocuments).toHaveBeenCalledWith('Region', ['r1']);
    });
  });

  describe('references', () => {
    it('looks tokens and levels up on the scene', () => {
      const { store } = storeFor(14);
      expect(store.hasToken('S', 't1')).toBe(true);
      expect(store.hasToken('S', 'zz')).toBe(false);
      expect(store.findMissingLevels('S', ['l1', 'l2'])).toEqual(['l2']);
    });

    it('treats every level as missing on a core without levels', () => {
      const scene = fakeScene('S', []);
      const store = new FoundryRegionStore(gameWith(scene), globalsWith(), () => 13);
      expect(store.findMissingLevels('S', ['l1'])).toEqual(['l1']);
    });
  });

  describe('queries', () => {
    it('lists the tokens the core records inside', () => {
      const document = fakeRegion(V13_SOURCE);
      document.tokens = new Set([{ id: 't1', name: 'Goblin' }, { id: 't2', name: null }]);
      const { store } = storeFor(13, document);
      expect(store.listTokensInside('S', 'r1')).toEqual([
        { id: 't1', name: 'Goblin' },
        { id: 't2', name: '' }
      ]);
    });

    it('passes the elevation in the point and as the Foundry 12 second argument', () => {
      const document = fakeRegion(V13_SOURCE);
      const testPoint = jest.fn(() => true);
      document.testPoint = testPoint;
      const { store } = storeFor(13, document);

      expect(store.testPoint('S', 'r1', { x: 5, y: 6, elevation: 3 })).toEqual({ kind: 'answered', inside: true });
      expect(testPoint).toHaveBeenCalledWith({ x: 5, y: 6, elevation: 3 }, 3);
    });

    it('refuses a wall-restricted region on one level whose constraints are not computed', () => {
      const document = fakeRegion({ ...V14_SOURCE, _shapeConstraints: null });
      document.testPoint = jest.fn(() => false);
      const { store } = storeFor(14, document);
      expect(store.testPoint('S', 'r2', { x: 0, y: 0, elevation: 0 })).toEqual({ kind: 'shape-not-computed' });
    });

    it('answers for a restricted region the core never computes (no single level)', () => {
      const document = fakeRegion({ ...V14_SOURCE, levels: [], _shapeConstraints: null });
      document.testPoint = jest.fn(() => false);
      const { store } = storeFor(14, document);
      expect(store.testPoint('S', 'r2', { x: 0, y: 0, elevation: 0 })).toEqual({ kind: 'answered', inside: false });
    });

    it('reports a client without testPoint and a missing region', () => {
      const { store } = storeFor(13, fakeRegion(V13_SOURCE));
      expect(store.testPoint('S', 'r1', { x: 0, y: 0, elevation: 0 })).toEqual({ kind: 'unavailable' });
      expect(() => store.testPoint('S', 'zz', { x: 0, y: 0, elevation: 0 })).toThrow(new RegionNotFoundError('zz'));
      expect(() => store.listTokensInside('S', 'zz')).toThrow(RegionNotFoundError);
    });
  });
});
