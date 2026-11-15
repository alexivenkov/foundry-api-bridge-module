import type { CalendarComponents, CalendarDefinition } from '@/core/world/domain/model/Calendar';

/**
 * The world calendar of the running core. Every method but `isAvailable`
 * assumes it is available (Foundry 13+).
 */
export interface WorldCalendar {
  isAvailable(): boolean;
  definition(): CalendarDefinition;
  decompose(worldTime: number): CalendarComponents;
  /** Where the core starts counting the given year (`componentsToTime({ year })`); a first estimate only. */
  startOfYear(year: number): number;
  /** The core's own text for a world time. */
  format(worldTime: number): string;
}
