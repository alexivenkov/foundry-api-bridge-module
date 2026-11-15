import type { MacroScope, MacroType } from '@/core/macros/domain';

/** The Macro document fields and methods the context uses (`BaseMacro` schema and `Macro#execute`, Foundry 13–14). */
export interface FoundryMacroDocument {
  id: string;
  uuid: string;
  name: string;
  type: MacroType;
  img: string;
  command: string;
  scope: MacroScope;
  folder: { id: string; name: string } | null | undefined;
  author: { id: string; name: string } | null | undefined;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<FoundryMacroDocument>;
  execute(scope?: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryMacrosCollection {
  contents: ReadonlyArray<FoundryMacroDocument>;
  get(id: string): FoundryMacroDocument | undefined;
}

/** Actors and token documents are only handed on to the core; the context never looks inside them. */
export interface FoundrySpeakerCollection {
  get(id: string): object | undefined;
}

export interface FoundryMacroGame {
  macros: FoundryMacrosCollection;
  actors: FoundrySpeakerCollection;
}

export interface FoundryMacroClass {
  /** Resolves to nothing when a `preCreateMacro` hook or the data model refuses the macro. */
  create(data: Record<string, unknown>): Promise<FoundryMacroDocument | null | undefined>;
}

/** A `Token` placeable of the token layer: what the core itself hands a macro as `token`. */
export interface FoundryTokenPlaceable {
  /** The TokenDocument the placeable draws. */
  document: object;
  /** `Token#actor`, the actor of its document: synthetic for an unlinked token, null for a token without one. */
  actor?: object | null | undefined;
}

export interface FoundryMacroCanvas {
  /** The token layer. `get` answers undefined when no scene is rendered or the token is not drawn. */
  tokens?: { get(id: string): FoundryTokenPlaceable | undefined } | null | undefined;
  /** The viewed scene; its token documents are read only on cores 11 and 12 (see `FoundryMacroRunner`). */
  scene?: { tokens: FoundrySpeakerCollection } | null | undefined;
}

/** `ChatMessage.implementation.getSpeaker`: how the core derives a speaker from an actor or a token document. */
export interface FoundryChatMessageClass {
  implementation: {
    getSpeaker(options: { actor?: object | null | undefined; token?: object | undefined }): object;
  };
}

export interface FoundryMacroGlobals {
  game: FoundryMacroGame;
  Macro: FoundryMacroClass;
  ChatMessage: FoundryChatMessageClass;
  canvas?: FoundryMacroCanvas | null | undefined;
}

export type MacroGlobalsProvider = () => FoundryMacroGlobals;

/** Reads the globals on every call, so a gateway can be built before Foundry is ready. */
export const macroGlobalsFromGlobalThis: MacroGlobalsProvider = () => globalThis as unknown as FoundryMacroGlobals;
