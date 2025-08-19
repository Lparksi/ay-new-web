import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as apiLogin } from '../api/auth'
import { saveToken, readToken, removeToken } from '../utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(readToken())
  const user = ref<any>(null)

  function setToken(t: string | null) {
    token.value = t
    if (t) saveToken(t)
    else removeToken()
  }

  async function login(username: string, password: string) {
    const r = await apiLogin(username, password)
    if (r.token) {
      setToken(r.token)
      // optionally set user from r.raw.data.data.user
      user.value = r.raw?.data?.data?.user || null
    }
    return r
  }

  function logout() {
    setToken(null)
    user.value = null
  }

  function isAuthenticated() {
    return !!token.value
  }

  return { token, user, setToken, login, logout, isAuthenticated }
})
