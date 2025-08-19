export const TOKEN_KEY = 'AY_AUTH_TOKEN'

export function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch (e) {}
}

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (e) {
    return null
  }
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch (e) {}
}
