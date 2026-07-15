import type { ZodError } from 'zod';

export function formatZodError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return '';
  }
  const path = issue.path.map((segment) => String(segment)).join('.');
  return path.length === 0 ? issue.message : `${path}: ${issue.message}`;
}
