export function toISOStringOrNull(value: any): string | null {
  if (!value) return null
  // If value is a Date
  if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString()
  // If value is a string, try to parse
  const d = new Date(value)
  if (!isNaN(d.getTime())) return d.toISOString()
  return null
}

export function formatDate(value: any): string {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
