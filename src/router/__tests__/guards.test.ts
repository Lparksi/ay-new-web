import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import CreateTask from '../../pages/CreateTask.vue'
import Login from '../../pages/Login.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../../stores/auth'

// reuse the same route config as main.ts
const routes = [
  { path: '/', redirect: '/create-task' },
  { path: '/create-task', component: CreateTask },
  { path: '/login', component: Login },
]

describe('router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('redirects unauthenticated user to login with redirect param', async () => {
  const router = createRouter({ history: createMemoryHistory(), routes })
    // initialize pinia store
    const auth = useAuthStore()
    // ensure unauthenticated
    auth.setToken(null)

    // install guard similar to main.ts
  router.beforeEach((to: any, from: any, next: any) => {
      const publicPaths = ['/login']
      if (publicPaths.includes((to as any).path)) return next()
      const auth2 = useAuthStore()
      if (!auth2.isAuthenticated()) {
        return next({ path: '/login', query: { redirect: to.fullPath } })
      }
      next()
    })

    // push protected route
    await router.push('/create-task')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/create-task')
  })

  it('allows authenticated user', async () => {
  const router = createRouter({ history: createMemoryHistory(), routes })
    const auth = useAuthStore()
    auth.setToken('ok')

  router.beforeEach((to: any, from: any, next: any) => {
      const publicPaths = ['/login']
      if (publicPaths.includes((to as any).path)) return next()
      const auth2 = useAuthStore()
      if (!auth2.isAuthenticated()) {
        return next({ path: '/login', query: { redirect: to.fullPath } })
      }
      next()
    })

    await router.push('/create-task')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/create-task')
  })
})
