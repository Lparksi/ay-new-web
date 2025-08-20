import axios from 'axios'

const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9001/api/v1'

export const http = axios.create({
  baseURL: base,
  headers: {
    'Content-Type': 'application/json',
  },
})

// named request interceptor for easier testing
export function requestFulfilled(config: any) {
  const token = localStorage.getItem('AY_AUTH_TOKEN')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
}

// named response rejected handler for easier testing
export function responseRejected(error: any) {
  const status = error?.response?.status
  if (status === 401 || status === 403) {
    try {
      localStorage.removeItem('AY_AUTH_TOKEN')
    } catch (e) {}
    // redirect to login
    window.location.href = '/login'
  }
  return Promise.reject(error)
}

// Register interceptors
http.interceptors.request.use(requestFulfilled)
http.interceptors.response.use((resp) => resp, responseRejected)

// Export API modules
export * from './auth'
export * from './geocode'
export { fetchUsers, fetchCurrentUser, createUser, updateUser, deleteUser, updatePassword } from './user'
export { createTask, fetchTasks, fetchTasksPaged } from './task'
