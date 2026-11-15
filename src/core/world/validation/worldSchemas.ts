import { z } from 'zod';

// Unknown keys are ignored, as the pre-DDD handlers did. The commands that take
// no parameters (world info, world time, pause, calendar) have nothing to validate.

export const advanceTimeRequestSchema = z.object({
  seconds: z.number()
});

export const setWorldTimeRequestSchema = z.object({
  worldTime: z.number()
});

// The calendar forms are new (Foundry 13+) and strict. They are chosen only when
// their key is present, so the old forms keep their exact validation and texts.

export const calendarDateRequestSchema = z.object({
  year: z.number().int().min(0),
  month: z.number().int().min(1),
  day: z.number().int().min(1),
  hour: z.number().int().min(0).optional(),
  minute: z.number().int().min(0).optional(),
  second: z.number().min(0).optional()
});

export const calendarDurationRequestSchema = z
  .object({
    days: z.number().int().optional(),
    hours: z.number().int().optional(),
    minutes: z.number().int().optional(),
    seconds: z.number().int().optional()
  })
  .refine((duration) => Object.values(duration).some((part) => part !== undefined), {
    message: 'needs at least one of days, hours, minutes, seconds'
  });

export const advanceTimeByDurationRequestSchema = z
  .object({ seconds: z.unknown(), duration: calendarDurationRequestSchema })
  .refine((request) => request.seconds === undefined, {
    message: 'give either seconds or duration, not both',
    path: ['seconds']
  })
  .transform(({ duration }) => ({ duration }));

export const setWorldTimeByDateRequestSchema = z
  .object({ worldTime: z.unknown(), date: calendarDateRequestSchema })
  .refine((request) => request.worldTime === undefined, {
    message: 'give either worldTime or date, not both',
    path: ['worldTime']
  })
  .transform(({ date }) => ({ date }));

const worldTimePoint = z.number().min(0);

export const getTimeDifferenceRequestSchema = z
  .object({
    fromWorldTime: worldTimePoint.optional(),
    fromDate: calendarDateRequestSchema.optional(),
    toWorldTime: worldTimePoint.optional(),
    toDate: calendarDateRequestSchema.optional()
  })
  .superRefine((request, context) => {
    if (request.fromWorldTime !== undefined && request.fromDate !== undefined) {
      context.addIssue({ code: 'custom', path: ['fromDate'], message: 'give either fromWorldTime or fromDate, not both' });
    }
    if ((request.toWorldTime === undefined) === (request.toDate === undefined)) {
      context.addIssue({ code: 'custom', path: ['toDate'], message: 'give exactly one of toWorldTime and toDate' });
    }
  });

function given(params: unknown, key: string): boolean {
  return typeof params === 'object' && params !== null && (params as Record<string, unknown>)[key] !== undefined;
}

export type CalendarDateRequest = z.infer<typeof calendarDateRequestSchema>;
export type CalendarDurationRequest = z.infer<typeof calendarDurationRequestSchema>;
export type AdvanceTimeRequest =
  | z.infer<typeof advanceTimeRequestSchema>
  | z.infer<typeof advanceTimeByDurationRequestSchema>;
export type SetWorldTimeRequest =
  | z.infer<typeof setWorldTimeRequestSchema>
  | z.infer<typeof setWorldTimeByDateRequestSchema>;
export type GetTimeDifferenceRequest = z.infer<typeof getTimeDifferenceRequestSchema>;

/** `duration` selects the calendar form; otherwise the request is read exactly as before. */
export function advanceTimeSchemaFor(params: unknown): z.ZodType<AdvanceTimeRequest> {
  return given(params, 'duration') ? advanceTimeByDurationRequestSchema : advanceTimeRequestSchema;
}

/** `date` selects the calendar form; otherwise the request is read exactly as before. */
export function setWorldTimeSchemaFor(params: unknown): z.ZodType<SetWorldTimeRequest> {
  return given(params, 'date') ? setWorldTimeByDateRequestSchema : setWorldTimeRequestSchema;
}
