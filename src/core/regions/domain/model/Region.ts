import type {
  RegionHighlightMode,
  RegionRestrictionType,
  RegionVisibility
} from '@/core/regions/domain/value-objects';
import type { RegionBehavior } from './RegionBehavior';
import type { RegionShape } from './RegionShape';

/** Distance units; null = unbounded. */
export interface RegionElevation {
  readonly bottom: number | null;
  readonly top: number | null;
  /** Foundry 14+. */
  readonly topInclusive?: boolean | undefined;
}

export interface RegionRestriction {
  readonly enabled: boolean;
  readonly type: RegionRestrictionType;
  readonly priority: number;
}

/** The attributes the Foundry 14 region model added; absent on older cores. */
export interface RegionExtensions {
  readonly levelIds?: readonly string[] | undefined;
  readonly restriction?: RegionRestriction | undefined;
  readonly attachedTokenId?: string | null | undefined;
  readonly highlightMode?: RegionHighlightMode | undefined;
  readonly displayMeasurements?: boolean | undefined;
  readonly hidden?: boolean | undefined;
}

export interface Region extends RegionExtensions {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly shapes: readonly RegionShape[];
  readonly elevation: RegionElevation;
  /** null when the document holds a code this module does not know. */
  readonly visibility: RegionVisibility | null;
  readonly locked: boolean;
  readonly behaviors: readonly RegionBehavior[];
}

export interface RegionElevationChanges {
  readonly bottom?: number | null | undefined;
  readonly top?: number | null | undefined;
  readonly topInclusive?: boolean | undefined;
}

export interface RegionRestrictionChanges {
  readonly enabled?: boolean | undefined;
  readonly type?: RegionRestrictionType | undefined;
  readonly priority?: number | undefined;
}

/** Omitted attributes are left to the core default (create) or untouched (update). */
export interface RegionChanges {
  readonly name?: string | undefined;
  readonly color?: string | undefined;
  readonly shapes?: readonly RegionShape[] | undefined;
  readonly elevation?: RegionElevationChanges | undefined;
  readonly visibility?: RegionVisibility | undefined;
  readonly locked?: boolean | undefined;
  readonly levelIds?: readonly string[] | undefined;
  readonly restriction?: RegionRestrictionChanges | undefined;
  readonly attachedTokenId?: string | null | undefined;
  readonly highlightMode?: RegionHighlightMode | undefined;
  readonly displayMeasurements?: boolean | undefined;
  readonly hidden?: boolean | undefined;
}

export interface RegionDraft extends RegionChanges {
  readonly name: string;
}

export interface RegionTokenRef {
  readonly id: string;
  readonly name: string;
}

export interface ElevatedPoint {
  readonly x: number;
  readonly y: number;
  readonly elevation: number;
}
