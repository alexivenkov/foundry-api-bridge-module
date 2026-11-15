export { MACRO_SCOPES, MACRO_TYPES } from './model/Macro';
export type { Macro, MacroChanges, MacroDraft, MacroScope, MacroType } from './model/Macro';
export {
  InvalidMacroArgumentsError,
  MacroActorNotFoundError,
  MacroCreationCancelledError,
  MacroExecutionFailedError,
  MacroNotFoundError,
  MacroSyntaxError,
  MacroTokenNotFoundError,
  ScriptMacrosDisabledError
} from './errors/macroErrors';
export type { MacroRunContext, MacroRunner, MacroStore, ScriptMacroPolicy } from './ports/ports';
export { describeThrown } from './rules/describeThrown';
export { isMacroArguments } from './rules/macroArguments';
export type { MacroArguments } from './rules/macroArguments';
export { requireScriptMacrosAllowed } from './rules/scriptMacroGate';
export { MACRO_RESULT_MAX_BYTES, serializeMacroResult } from './rules/serializeMacroResult';
export type { SerializedMacroResult } from './rules/serializeMacroResult';
export { HOTBAR_PAGE_COUNT, HOTBAR_PAGE_SIZE, HOTBAR_SLOT_COUNT } from './model/Hotbar';
export type { Hotbar, HotbarAssignment, HotbarEntry, HotbarMacro } from './model/Hotbar';
export {
  CurrentUserUnknownError,
  HotbarFullError,
  HotbarSlotEmptyError,
  HotbarUserNotFoundError
} from './errors/hotbarErrors';
export type { HotbarStore } from './ports/HotbarStore';
export { findHotbarEntry, firstFreeSlot, hotbarPage, isHotbarSlot, pageOfSlot } from './rules/hotbarSlots';
