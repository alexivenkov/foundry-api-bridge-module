import type { DrawingChanges } from '@/core/drawings/domain/model/Drawing';

/** What the running Foundry generation can store on a drawing. */
export interface DrawingCapabilities {
  /** The commands are modelled on the Foundry 12+ drawing (elevation, sort, interface). */
  readonly supported: boolean;
  readonly names: boolean;
  readonly levels: boolean;
}

/** The refusal for a change the generation cannot store, or null when it can. */
export function findUnsupportedDrawingFeature(
  capabilities: DrawingCapabilities,
  changes?: DrawingChanges
): string | null {
  if (!capabilities.supported) {
    return 'Drawing commands require Foundry 12 or newer';
  }
  if (changes?.name !== undefined && !capabilities.names) {
    return 'Drawing names require Foundry 14 or newer';
  }
  if (changes?.levels !== undefined && !capabilities.levels) {
    return 'Drawing levels require Foundry 14 or newer';
  }
  return null;
}
