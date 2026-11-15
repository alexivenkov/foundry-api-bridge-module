/**
 * The world's consent to scripts arriving through the API: the module's "Allow Script Macros" setting, the same
 * opt-in `create-macro` asks for.
 */
export interface ScriptMacroImportPolicy {
  allowsScripts(): boolean;
}
