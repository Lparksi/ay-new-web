import { http } from './index'

export async function login(username: string, password: string) {
  const resp = await http.post('/auth/login', { username, password })
  // backend wraps data into { code,msg,data: { user, token }}
  const token = resp?.data?.data?.token || resp?.data?.token
  return { raw: resp, token }
}

export function logout() {
  localStorage.removeItem('AY_AUTH_TOKEN')
}
