import type { MacroSummary, MacroDetail, MacroType, MacroScope } from '@/commands/types';

export interface FoundryMacroDoc {
  id: string;
  uuid: string;
  name: string;
  type: MacroType;
  img: string;
  command: string;
  scope: MacroScope;
  folder: { id: string; name: string } | null | undefined;
  author: { id: string; name: string } | null | undefined;
  update(data: Record<string, unknown>): Promise<FoundryMacroDoc>;
  delete(): Promise<FoundryMacroDoc>;
  execute(scope?: { actor?: object; token?: object }): Promise<unknown>;
}

export interface FoundryMacrosCollection {
  contents: ReadonlyArray<FoundryMacroDoc>;
  get(id: string): FoundryMacroDoc | undefined;
}

export interface FoundryActorRef {
  id: string;
}

export interface FoundryActorsCollection {
  get(id: string): FoundryActorRef | undefined;
}

export interface FoundryGame {
  macros: FoundryMacrosCollection;
  actors: FoundryActorsCollection;
}

export interface FoundryMacroConstructor {
  create(data: Record<string, unknown>): Promise<FoundryMacroDoc>;
}

export interface FoundryTokenRef {
  id: string;
}

export interface FoundryCanvas {
  scene: {
    tokens: {
      get(id: string): FoundryTokenRef | undefined;
    };
  } | null | undefined;
}

export function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

export function getMacroClass(): FoundryMacroConstructor {
  return (globalThis as unknown as { Macro: FoundryMacroConstructor }).Macro;
}

export function getCanvas(): FoundryCanvas | undefined {
  return (globalThis as unknown as { canvas?: FoundryCanvas }).canvas;
}

export function mapMacroToSummary(macro: FoundryMacroDoc): MacroSummary {
  return {
    id: macro.id,
    uuid: macro.uuid,
    name: macro.name,
    type: macro.type,
    img: macro.img,
    scope: macro.scope,
    folder: macro.folder?.name ?? null,
    authorId: macro.author?.id ?? null
  };
}

export function mapMacroToDetail(macro: FoundryMacroDoc): MacroDetail {
  return {
    ...mapMacroToSummary(macro),
    command: macro.command
  };
}
