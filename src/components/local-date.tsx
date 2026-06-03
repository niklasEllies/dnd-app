"use client";

/**
 * Renders a date in the viewer's locale/timezone. `suppressHydrationWarning`
 * absorbs the expected server (UTC) vs client (local) first-paint difference.
 * Use `dateOnly` for `date` columns (e.g. played_on) so a Y-M-D value isn't
 * shifted by a timezone offset.
 */
export function LocalDate({
  iso,
  dateOnly = false,
}: {
  iso: string;
  dateOnly?: boolean;
}) {
  let d: Date;
  if (dateOnly) {
    const [y, m, day] = iso.slice(0, 10).split("-").map(Number);
    d = new Date(y, (m ?? 1) - 1, day ?? 1);
  } else {
    d = new Date(iso);
  }
  const text = Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
