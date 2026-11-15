import { DomainError } from '@/kernel';

/** The whole wire text of the refusal below Foundry 13 (a `CoreFeatureUnavailableError`). */
export const CALENDAR_UNAVAILABLE = 'The world calendar requires Foundry 13 or newer';

/** A date part outside what the world calendar has (a 13th month, hour 25). */
export class InvalidCalendarDateError extends DomainError {
  constructor(detail: string) {
    super(`Invalid calendar date: ${detail}`);
    this.name = 'InvalidCalendarDateError';
    Object.setPrototypeOf(this, InvalidCalendarDateError.prototype);
  }
}

/** A day the calendar skips in that year, such as a leap day outside a leap year. */
export class CalendarDateNotFoundError extends DomainError {
  constructor(year: number, month: number, day: number) {
    super(`Day ${String(day)} of month ${String(month)} does not exist in year ${String(year)}`);
    this.name = 'CalendarDateNotFoundError';
    Object.setPrototypeOf(this, CalendarDateNotFoundError.prototype);
  }
}
