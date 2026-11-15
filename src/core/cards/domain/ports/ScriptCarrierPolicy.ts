/** The world's consent to card data that automation modules run (the macros context's "Allow Script Macros"). */
export interface ScriptCarrierPolicy {
  allowsScripts(): boolean;
}
