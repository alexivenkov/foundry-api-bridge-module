/**
 * `proximity`: the wall does not restrict a sense whose source is nearer than
 * the threshold distance; `reverse-proximity`: whose source is farther.
 */
export const WALL_PROXIMITIES = ['proximity', 'reverse-proximity'] as const;
export type WallProximity = (typeof WALL_PROXIMITIES)[number];

export const THRESHOLD_SENSES = ['light', 'sight', 'sound'] as const;
export type ThresholdSense = (typeof THRESHOLD_SENSES)[number];

export interface WallSenseThreshold {
  /** null: the plain restriction of the sense applies. */
  readonly proximity: WallProximity | null;
  /** Distance units; null = none. */
  readonly distance: number | null;
}

export interface WallThreshold {
  readonly light: WallSenseThreshold;
  readonly sight: WallSenseThreshold;
  readonly sound: WallSenseThreshold;
  readonly attenuation: boolean;
}

export interface WallSenseThresholdChanges {
  readonly proximity?: WallProximity | null | undefined;
  readonly distance?: number | null | undefined;
}

export interface WallThresholdChanges {
  readonly light?: WallSenseThresholdChanges | undefined;
  readonly sight?: WallSenseThresholdChanges | undefined;
  readonly sound?: WallSenseThresholdChanges | undefined;
  readonly attenuation?: boolean | undefined;
}

const NO_SENSE_THRESHOLD: WallSenseThreshold = { proximity: null, distance: null };

export const NO_THRESHOLD: WallThreshold = {
  light: NO_SENSE_THRESHOLD,
  sight: NO_SENSE_THRESHOLD,
  sound: NO_SENSE_THRESHOLD,
  attenuation: false
};
