/** Where the running Foundry generation stands on measured templates. */
export interface TemplateCapabilities {
  /** The commands are modelled on the Foundry 12–13 template (`author`, elevation, sort). */
  readonly supported: boolean;
  /** Foundry 14 merged measured templates into regions. */
  readonly mergedIntoRegions: boolean;
}

/** The refusal on a generation without measured templates, or null. */
export function findTemplateUnavailability(capabilities: TemplateCapabilities): string | null {
  if (capabilities.mergedIntoRegions) {
    return 'Measured templates are not available in Foundry 14 or newer; use regions';
  }
  if (!capabilities.supported) {
    return 'Measured template commands require Foundry 12 or newer';
  }
  return null;
}
