import type { WorldInfoResult } from '@/commands/types';
import type { WorldInfo, WorldSession } from '@/core/world';

export function toWireWorldInfo(info: WorldInfo, session: WorldSession): WorldInfoResult {
  return {
    world: {
      id: info.identity.id,
      title: info.identity.title,
      system: info.identity.systemId,
      systemVersion: info.identity.systemVersion,
      foundryVersion: info.identity.coreVersion,
      moduleVersion: info.identity.moduleVersion
    },
    counts: {
      journals: info.counts.journals,
      actors: info.counts.actors,
      items: info.counts.items,
      scenes: info.counts.scenes
    },
    compendiumMeta: info.compendiums.map((compendium) => ({
      id: compendium.id,
      label: compendium.label,
      type: compendium.documentType,
      system: compendium.systemId ?? '',
      count: compendium.entryCount
    })),
    modules: session.modules.map((module) => ({ id: module.id, title: module.title, version: module.version })),
    activeScene: session.activeScene === null ? null : { id: session.activeScene.id, name: session.activeScene.name },
    users: session.users.map((user) => ({ id: user.id, name: user.name, isGM: user.isGM, active: user.active })),
    paused: session.paused,
    worldTime: session.worldTime
  };
}
