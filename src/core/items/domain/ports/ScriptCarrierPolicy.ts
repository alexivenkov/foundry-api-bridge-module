/** The world's consent to item data that automation modules run (the macros context's "Allow Script Macros"). */
export interface ScriptCarrierPolicy {
  allowsScripts(): boolean;
}
