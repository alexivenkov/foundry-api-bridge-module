import type { MacroDetail, MacroSummary } from '@/commands/types';
import type { Macro } from '@/core/macros';

export function toWireMacroSummary(macro: Macro): MacroSummary {
  return {
    id: macro.id,
    uuid: macro.uuid,
    name: macro.name,
    type: macro.type,
    img: macro.img,
    scope: macro.scope,
    folder: macro.folderName,
    authorId: macro.authorId
  };
}

export function toWireMacroDetail(macro: Macro): MacroDetail {
  return { ...toWireMacroSummary(macro), command: macro.command };
}
