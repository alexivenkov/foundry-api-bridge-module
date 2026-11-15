import { FoundryWorldInspector, MODULE_ID } from '../FoundryWorldInspector';
import type { FoundryWorldInfoGame, FoundryWorldPack } from '../foundryWorldTypes';

function pack(overrides: Partial<FoundryWorldPack> = {}): FoundryWorldPack {
  return {
    collection: 'dnd5e.monsters',
    metadata: { label: 'Monsters', type: 'Actor', system: 'dnd5e' },
    index: { size: 350 },
    ...overrides
  };
}

function packs(list: FoundryWorldPack[]): NonNullable<FoundryWorldInfoGame['packs']> {
  return {
    forEach: (fn) => {
      list.forEach(fn);
    }
  };
}

function inspectorOver(game: FoundryWorldInfoGame): FoundryWorldInspector {
  return new FoundryWorldInspector({ getGame: () => game });
}

describe('FoundryWorldInspector', () => {
  describe('readIdentity', () => {
    it('reads the world, its game system, the core and this module', () => {
      const moduleIds: string[] = [];
      const inspector = inspectorOver({
        world: { id: 'my-world', title: 'My World' },
        system: { id: 'pf2e', version: '7.12.2' },
        version: '13.351',
        modules: {
          get: (id) => {
            moduleIds.push(id);
            return { version: '8.18.0' };
          }
        }
      });

      expect(inspector.readIdentity()).toEqual({
        id: 'my-world',
        title: 'My World',
        systemId: 'pf2e',
        systemVersion: '7.12.2',
        coreVersion: '13.351',
        moduleVersion: '8.18.0'
      });
      expect(moduleIds).toEqual([MODULE_ID]);
      expect(MODULE_ID).toBe('foundry-api-bridge');
    });

    it('reports what a bare game does not know as empty strings', () => {
      expect(inspectorOver({}).readIdentity()).toEqual({
        id: '',
        title: '',
        systemId: '',
        systemVersion: '',
        coreVersion: '',
        moduleVersion: ''
      });
    });

    it.each([
      ['the module is not installed under its id', { get: () => undefined }],
      ['the module states no version', { get: () => ({}) }]
    ])('reports no module version when %s', (_case, modules) => {
      expect(inspectorOver({ modules }).readIdentity().moduleVersion).toBe('');
    });
  });

  describe('countDocuments', () => {
    it('counts the world collections', () => {
      const inspector = inspectorOver({
        journal: { size: 3 },
        actors: { size: 2 },
        items: { size: 4 },
        scenes: { size: 1 }
      });

      expect(inspector.countDocuments()).toEqual({ journals: 3, actors: 2, items: 4, scenes: 1 });
    });

    it('counts a missing collection as empty', () => {
      expect(inspectorOver({ actors: { size: 7 } }).countDocuments()).toEqual({
        journals: 0,
        actors: 7,
        items: 0,
        scenes: 0
      });
    });
  });

  describe('listCompendiums', () => {
    it('describes each pack by its collection id, label, document type, system and size', () => {
      const inspector = inspectorOver({
        packs: packs([
          pack(),
          pack({ collection: 'dnd5e.spells', metadata: { label: 'Spells', type: 'Item', system: 'dnd5e' }, index: { size: 0 } })
        ])
      });

      expect(inspector.listCompendiums()).toEqual([
        { id: 'dnd5e.monsters', label: 'Monsters', documentType: 'Actor', systemId: 'dnd5e', entryCount: 350 },
        { id: 'dnd5e.spells', label: 'Spells', documentType: 'Item', systemId: 'dnd5e', entryCount: 0 }
      ]);
    });

    it.each([
      ['an undefined system', { label: 'Tables', type: 'RollTable', system: undefined }],
      ['no system field', { label: 'Tables', type: 'RollTable' }]
    ])('reads a pack with %s as belonging to no game system', (_case, metadata) => {
      const inspector = inspectorOver({ packs: packs([pack({ metadata })]) });

      expect(inspector.listCompendiums()[0]?.systemId).toBeNull();
    });

    it('lists nothing when the game has no packs collection', () => {
      expect(inspectorOver({}).listCompendiums()).toEqual([]);
    });

    it('walks the packs with forEach only, never asking for their documents', () => {
      const forEach = jest.fn();

      inspectorOver({ packs: { forEach } }).listCompendiums();

      expect(forEach).toHaveBeenCalledTimes(1);
    });
  });

  it('reads the game on every call, not when it is built', () => {
    let game: FoundryWorldInfoGame = {};
    const inspector = new FoundryWorldInspector({ getGame: () => game });

    expect(inspector.readIdentity().id).toBe('');
    game = { world: { id: 'late', title: 'Late' } };
    expect(inspector.readIdentity().id).toBe('late');
  });
});
