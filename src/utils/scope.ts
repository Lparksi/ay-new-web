export type ScopeItem = { type: 'user' | 'merchant' | 'tag'; id: number }

export function buildScopeJson(selected: { users?: number[]; merchants?: number[]; tags?: number[] }) {
  const parts: Record<string, number[]> = {}
  if (selected.users && selected.users.length) parts['users'] = selected.users
  if (selected.merchants && selected.merchants.length) parts['merchants'] = selected.merchants
  if (selected.tags && selected.tags.length) parts['tags'] = selected.tags
  return JSON.stringify(parts)
}
