import { foundryGeneration } from '@/compat/foundryVersion';
import {
  FoundryActorLocator,
  FoundrySceneLocator,
  globalGameProvider,
  type FoundryActorsGame,
  type GameProvider
} from '@/core/shared';
import { createFoundryWallService, type WallService } from '@/core/walls';
import {
  TokenAppearanceService,
  TokenCanvasService,
  TokenCoreMovementService,
  TokenMovementService,
  TokenService,
  TokenTargetingService
} from './application';
import {
  FoundryCanvasTokenSelection,
  FoundryCoreTokenMovement,
  FoundrySpeechBubbles,
  FoundryMovementSurface,
  FoundryPrototypeTokens,
  FoundryTokenAppearanceEnvironment,
  FoundryTokenStore,
  FoundryTokenTargeting,
  WallPassages,
  appearanceWriteOptions,
  type CanvasGlobalsProvider,
  type CanvasInteractionGlobalsProvider,
  type FoundryPrototypeGame,
  type MovementGameProvider,
  type MovementGlobalsProvider,
  type FoundryTokenGame,
  type TargetingGlobalsProvider,
  type TokenAppearanceGlobalsProvider,
  type TokenGameProvider
} from './infrastructure';

export const defaultTokenGameProvider: TokenGameProvider = globalGameProvider<FoundryTokenGame>();

/** What the appearance and prototype commands read: scenes with their tokens, and world actors. */
export type TokenAppearanceGame = FoundryTokenGame & FoundryPrototypeGame & FoundryActorsGame;
export type TokenAppearanceGameProvider = GameProvider<TokenAppearanceGame>;

export interface TokenAppearanceWiring {
  readonly gameProvider?: TokenAppearanceGameProvider | undefined;
  readonly globals?: TokenAppearanceGlobalsProvider | undefined;
  readonly generation?: (() => number) | undefined;
}

export interface TokenMovementWiring {
  readonly gameProvider?: TokenGameProvider;
  readonly canvasGlobals?: CanvasGlobalsProvider;
  /** The walls context the mover asks about doors; defaults to the Foundry-backed one. */
  readonly walls?: WallService;
}

// Composition root of the context. Handlers pass custom providers only in tests.

export function createFoundryTokenService(
  gameProvider: TokenGameProvider = defaultTokenGameProvider
): TokenService {
  const store = new FoundryTokenStore(gameProvider);
  return new TokenService({ scenes: new FoundrySceneLocator(gameProvider), tokens: store, grids: store });
}

export function createFoundryTokenMovementService(wiring: TokenMovementWiring = {}): TokenMovementService {
  const gameProvider = wiring.gameProvider ?? defaultTokenGameProvider;
  return new TokenMovementService({
    scenes: new FoundrySceneLocator(gameProvider),
    tokens: new FoundryTokenStore(gameProvider),
    surface: new FoundryMovementSurface(wiring.canvasGlobals),
    passages: new WallPassages(wiring.walls ?? createFoundryWallService())
  });
}

export function createFoundryTokenTargetingService(globals?: TargetingGlobalsProvider): TokenTargetingService {
  return new TokenTargetingService({ targeting: new FoundryTokenTargeting(globals) });
}

export function createFoundryTokenAppearanceService(wiring: TokenAppearanceWiring = {}): TokenAppearanceService {
  const gameProvider = wiring.gameProvider ?? globalGameProvider<TokenAppearanceGame>();
  const generation = wiring.generation ?? foundryGeneration;
  const writeOptions = (): ReturnType<typeof appearanceWriteOptions> => appearanceWriteOptions(generation());
  const scenes = new FoundrySceneLocator(gameProvider);
  const store = new FoundryTokenStore(gameProvider, writeOptions);
  const prototypes = new FoundryPrototypeTokens(gameProvider, writeOptions);
  return new TokenAppearanceService({
    scenes,
    actors: new FoundryActorLocator(gameProvider),
    tokens: new TokenService({ scenes, tokens: store, grids: store }),
    appearance: store,
    environment: new FoundryTokenAppearanceEnvironment(wiring.globals, generation),
    prototypes,
    actorTokens: prototypes
  });
}

export interface CoreMovementWiring {
  readonly gameProvider?: MovementGameProvider | undefined;
  readonly globals?: MovementGlobalsProvider | undefined;
  readonly generation?: (() => number) | undefined;
  /** Replaces the bounded wait for a running movement; tests pass an instant one. */
  readonly wait?: ((milliseconds: number) => Promise<void>) | undefined;
}

export function createFoundryTokenCoreMovementService(wiring: CoreMovementWiring = {}): TokenCoreMovementService {
  const gameProvider = wiring.gameProvider ?? globalGameProvider();
  const movement = new FoundryCoreTokenMovement(gameProvider, wiring.globals, wiring.generation, wiring.wait);
  return new TokenCoreMovementService({ scenes: new FoundrySceneLocator(gameProvider), movement, history: movement });
}

export interface TokenCanvasWiring {
  readonly gameProvider?: TokenGameProvider | undefined;
  readonly globals?: CanvasInteractionGlobalsProvider | undefined;
}

export function createFoundryTokenCanvasService(wiring: TokenCanvasWiring = {}): TokenCanvasService {
  const gameProvider = wiring.gameProvider ?? defaultTokenGameProvider;
  return new TokenCanvasService({
    scenes: new FoundrySceneLocator(gameProvider),
    tokens: new FoundryTokenStore(gameProvider),
    selection: new FoundryCanvasTokenSelection(wiring.globals),
    bubbles: new FoundrySpeechBubbles(wiring.globals)
  });
}
