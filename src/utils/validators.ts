export function required(value: any) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  return true
}

export function isISODateString(val: any) {
  if (!val) return true
  return !isNaN(Date.parse(val))
}

export function validatePriority(val: any, min = 1, max = 5) {
  const n = Number(val)
  if (Number.isNaN(n)) return false
  return n >= min && n <= max
}
