import type { WorldModule, WorldSession, WorldSessionInspector, WorldUserPresence } from '@/core/world/domain';
import type { WorldInfoGameProvider } from './FoundryWorldInspector';
import type { FoundryWorldInfoGame } from './foundryWorldTypes';

function activeModules(game: FoundryWorldInfoGame): WorldModule[] {
  const modules: WorldModule[] = [];
  game.modules?.forEach?.((module) => {
    if (module.active) {
      modules.push({ id: module.id, title: module.title, version: module.version ?? '' });
    }
  });
  return modules;
}

function users(game: FoundryWorldInfoGame): WorldUserPresence[] {
  const list: WorldUserPresence[] = [];
  game.users?.forEach((user) => {
    list.push({ id: user.id, name: user.name, isGM: user.isGM, active: user.active });
  });
  return list;
}

/** Reads the live state off `game`; anything the game has not set up yet reads as empty or null. */
export class FoundryWorldSessionInspector implements WorldSessionInspector {
  constructor(private readonly gameProvider: WorldInfoGameProvider) {}

  readSession(): WorldSession {
    const game = this.gameProvider.getGame();
    const scene = game.scenes?.active;
    const worldTime = game.time?.worldTime;
    return {
      modules: activeModules(game),
      activeScene: scene ? { id: scene.id, name: scene.name } : null,
      users: users(game),
      paused: typeof game.paused === 'boolean' ? game.paused : null,
      worldTime: typeof worldTime === 'number' ? worldTime : null
    };
  }
}
