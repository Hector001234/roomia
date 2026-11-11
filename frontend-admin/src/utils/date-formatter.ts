/**
 * Section 14.1 Compliance: Utility file in kebab-case (date-formatter.ts).
 */
export function formatIsoDateRange(checkIn: string, checkOut: string): string {
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  const formatter = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${formatter.format(start)} — ${formatter.format(end)}`;
}

export function calculateNightsCount(checkIn: string, checkOut: string): number {
  const diffMs = Date.parse(checkOut) - Date.parse(checkIn);
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}
