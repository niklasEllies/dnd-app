/** Up to two uppercase initials from a name, with a graceful fallback. */
export function initials(name: string) {
  const result = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return result || "?";
}
