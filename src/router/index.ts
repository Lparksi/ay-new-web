import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Lazy load components
const TaskManagement = () => import('../pages/CreateTask.vue')
const Login = () => import('../pages/Login.vue')
const Users = () => import('../pages/Users.vue')
const Merchants = () => import('../pages/Merchants.vue')
const Map = () => import('../pages/Map.vue')
const MerchantTags = () => import('../pages/MerchantTags.vue')
const Profile = () => import('../pages/Profile.vue')

const routes = [
  { 
    path: '/', 
    redirect: '/tasks' 
  },
  { 
    path: '/tasks', 
    component: TaskManagement,
    meta: { requiresAuth: true }
  },
  { 
    path: '/create-task', 
    redirect: '/tasks'
  },
  { 
    path: '/users', 
    component: Users,
    meta: { requiresAuth: true }
  },
  { 
    path: '/merchants', 
    component: Merchants,
    meta: { requiresAuth: true }
  },
  { 
    path: '/map', 
    component: Map,
    meta: { requiresAuth: true }
  },
  { 
    path: '/merchant-tags', 
    component: MerchantTags,
    meta: { requiresAuth: true }
  },
  { 
    path: '/profile', 
    component: Profile,
    meta: { requiresAuth: true }
  },
  { 
    path: '/login', 
    component: Login 
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard for authentication
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  // Allow access to login page
  if (to.path === '/login') {
    return next()
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated()) {
      return next({ 
        path: '/login', 
        query: { redirect: to.fullPath } 
      })
    }
  }

  next()
})

export default router