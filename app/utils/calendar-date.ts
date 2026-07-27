/** Small, timezone-safe date helpers for the month calendar (local Y/M/D only). */

const pad = (n: number) => String(n).padStart(2, "0")

/** Format a Date as a local `YYYY-MM-DD` string (no UTC shift). */
export const toISODate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Parse a `YYYY-MM-DD` string into a local Date at midnight. */
export const fromISODate = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1)
}

export const isSameISO = (a: Date, b: Date): boolean => toISODate(a) === toISODate(b)

/**
 * The 6-week (42-cell) grid covering `monthDate`'s month, starting on Sunday.
 * Returns the leading Sunday, trailing Saturday, and every cell date in order.
 */
export function monthGrid(monthDate: Date): { start: Date; end: Date; cells: Date[] } {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay()) // rewind to the Sunday on/before the 1st

  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push(d)
  }
  return { start, end: cells[41]!, cells }
}
