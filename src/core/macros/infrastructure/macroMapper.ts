import type { Macro, MacroChanges, MacroDraft } from '@/core/macros/domain';
import type { FoundryMacroDocument } from './foundryMacroTypes';

export function toMacro(document: FoundryMacroDocument): Macro {
  return {
    id: document.id,
    uuid: document.uuid,
    name: document.name,
    type: document.type,
    img: document.img,
    command: document.command,
    scope: document.scope,
    folderName: document.folder?.name ?? null,
    authorId: document.author?.id ?? null
  };
}

/** Only the attributes that are set become document fields, so an update stays a partial update. */
export function toFoundryMacroChanges(changes: MacroChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (changes.name !== undefined) {
    data['name'] = changes.name;
  }
  if (changes.type !== undefined) {
    data['type'] = changes.type;
  }
  if (changes.command !== undefined) {
    data['command'] = changes.command;
  }
  if (changes.scope !== undefined) {
    data['scope'] = changes.scope;
  }
  if (changes.img !== undefined) {
    data['img'] = changes.img;
  }
  if (changes.folderId !== undefined) {
    data['folder'] = changes.folderId;
  }

  return data;
}

/**
 * A new macro always states its name, type and command; the core reads an
 * unset type as a chat macro and an unset command as an empty one.
 */
export function toFoundryMacroData(draft: MacroDraft): Record<string, unknown> {
  return {
    name: draft.name,
    type: draft.type,
    command: draft.command,
    ...toFoundryMacroChanges({ scope: draft.scope, img: draft.img, folderId: draft.folderId })
  };
}
