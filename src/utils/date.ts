export function toISOStringOrNull(value: any): string | null {
  if (!value) return null
  // If value is a Date
  if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString()
  // If value is a string, try to parse
  const d = new Date(value)
  if (!isNaN(d.getTime())) return d.toISOString()
  return null
}
