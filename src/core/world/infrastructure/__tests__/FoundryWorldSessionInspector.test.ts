import { FoundryWorldSessionInspector } from '../FoundryWorldSessionInspector';
import type { FoundryWorldInfoGame, FoundryWorldModule, FoundryWorldUser } from '../foundryWorldTypes';

function inspectorOver(game: FoundryWorldInfoGame): FoundryWorldSessionInspector {
  return new FoundryWorldSessionInspector({ getGame: () => game });
}

function collection<T>(items: T[]): { forEach(fn: (item: T) => void): void } {
  return {
    forEach: (fn) => {
      items.forEach((item) => {
        fn(item);
      });
    }
  };
}

describe('FoundryWorldSessionInspector', () => {
  it('reads active modules, the active scene, users, pause and clock', () => {
    const modules: FoundryWorldModule[] = [
      { id: 'foundry-api-bridge', title: 'Foundry API Bridge', version: '8.18.0', active: true },
      { id: 'dice-so-nice', title: 'Dice So Nice!', version: '5.2.0', active: false },
      { id: 'no-version', title: 'Unversioned', active: true }
    ];
    const users: FoundryWorldUser[] = [
      { id: 'gm', name: 'Gamemaster', isGM: true, active: true },
      { id: 'p1', name: 'Alice', isGM: false, active: false }
    ];

    const session = inspectorOver({
      modules: { get: () => undefined, ...collection(modules) },
      scenes: { size: 2, active: { id: 's1', name: 'Tavern' } },
      users: collection(users),
      paused: true,
      time: { worldTime: 3600 }
    }).readSession();

    expect(session).toEqual({
      modules: [
        { id: 'foundry-api-bridge', title: 'Foundry API Bridge', version: '8.18.0' },
        { id: 'no-version', title: 'Unversioned', version: '' }
      ],
      activeScene: { id: 's1', name: 'Tavern' },
      users: [
        { id: 'gm', name: 'Gamemaster', isGM: true, active: true },
        { id: 'p1', name: 'Alice', isGM: false, active: false }
      ],
      paused: true,
      worldTime: 3600
    });
  });

  it('reads a game that is still loading as empty and unknown', () => {
    expect(inspectorOver({ modules: { get: () => undefined }, scenes: { size: 0, active: undefined } }).readSession()).toEqual({
      modules: [],
      activeScene: null,
      users: [],
      paused: null,
      worldTime: null
    });
    expect(inspectorOver({}).readSession().modules).toEqual([]);
  });
});
