import type { CalendarDateInput, CalendarDuration, TimePoint } from '@/core/world/domain';

export type AdvanceTimeCommand =
  | {
      /** Negative seconds turn the clock back. */
      readonly seconds: number;
      readonly duration?: undefined;
    }
  | {
      /** Calendar units, Foundry 13+. */
      readonly duration: CalendarDuration;
      readonly seconds?: undefined;
    };

export type SetWorldTimeCommand =
  | { readonly worldTime: number; readonly date?: undefined }
  | { readonly date: CalendarDateInput; readonly worldTime?: undefined };

export interface TimeDifferenceQuery {
  /** Undefined = now. */
  readonly from: TimePoint | undefined;
  readonly to: TimePoint;
}
