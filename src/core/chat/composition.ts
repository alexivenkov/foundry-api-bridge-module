import { FoundryActorLocator, FoundrySceneLocator, type GameProvider } from '@/core/shared';
import { ChatService, DiceService } from './application';
import {
  FoundryChatActors,
  FoundryChatLog,
  FoundryChatSpeakers,
  FoundryChatUsers,
  FoundryDiceRoller,
  FoundryRollData,
  FoundryRollFormulas,
  type ChatWorldGlobalsProvider,
  type DiceGlobalsProvider,
  type FoundryChatWorldGame,
  type FoundryChatWorldGlobals,
  type FoundryDiceGlobals,
  type FoundryRollDataGame
} from './infrastructure';

// The globals are read on every call, so a service can be composed before Foundry is ready.
export const defaultChatGlobals: ChatWorldGlobalsProvider = () => globalThis as unknown as FoundryChatWorldGlobals;
export const defaultRollGlobals: DiceGlobalsProvider = () => globalThis as unknown as FoundryDiceGlobals;

// Composition root of the context. Handlers pass custom providers only in tests.

export function createFoundryChatService(globals: ChatWorldGlobalsProvider = defaultChatGlobals): ChatService {
  const world: GameProvider<FoundryChatWorldGame> = { getGame: () => globals().game };
  return new ChatService({
    log: new FoundryChatLog(globals),
    actors: new FoundryChatActors(globals),
    users: new FoundryChatUsers(globals),
    speakers: new FoundryChatSpeakers(globals),
    scenes: new FoundrySceneLocator(world),
    locator: new FoundryActorLocator(world)
  });
}

export function createFoundryDiceService(globals: DiceGlobalsProvider = defaultRollGlobals): DiceService {
  const world: GameProvider<FoundryRollDataGame> = { getGame: () => globals().game };
  const rollData = new FoundryRollData(world);
  return new DiceService({
    dice: new FoundryDiceRoller(globals, rollData),
    formulas: new FoundryRollFormulas(globals, rollData),
    speakers: new FoundryChatSpeakers(globals),
    scenes: new FoundrySceneLocator(world),
    locator: new FoundryActorLocator(world)
  });
}
