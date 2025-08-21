<template>
  <div class="navbar-header">
    <div class="brand">AY Admin</div>

    <div class="header-ops">
      <template v-if="auth.isAuthenticated()">
        <t-dropdown
          :options="userMenuOptions"
          @click="handleUserMenuClick"
          trigger="click"
        >
          <div class="user-info">
            <t-avatar :image="auth.user?.avatar" size="32px" />
            <span class="username">{{ auth.user?.username || 'user' }}</span>
            <t-icon name="chevron-down" />
          </div>
        </t-dropdown>
      </template>
      <template v-else>
        <t-button size="small" theme="primary" @click="goLogin">登录</t-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { notifySuccess } from '../utils/notification'
import { Button, Space, Avatar, Dropdown, Icon } from 'tdesign-vue-next'

const router = useRouter()
const auth = useAuthStore()

const userMenuOptions = [
  {
    content: '个人资料',
    value: 'profile',
    prefixIcon: 'user'
  },
  {
    content: '退出登录',
    value: 'logout',
    prefixIcon: 'logout'
  }
]

function goLogin() {
  router.push('/login')
}

function handleUserMenuClick(data: any) {
  if (data.value === 'profile') {
    router.push('/profile')
  } else if (data.value === 'logout') {
    onLogout()
  }
}

function onLogout() {
  auth.logout()
  notifySuccess('已成功退出登录')
  router.push('/login')
}
</script>

<style scoped>
.navbar-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.brand {
  font-weight: 600;
  font-size: 18px;
  color: #0052d9;
}

.header-ops {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-link {
  color: #666;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #0052d9;
  background: #f3f3f3;
}

.nav-link.router-link-active {
  color: #0052d9;
  background: #e7f3ff;
}

.username {
  color: #666;
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f3f3f3;
}
</style>
