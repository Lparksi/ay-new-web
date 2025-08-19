<template>
  <div class="navbar-header">
    <div class="brand">AY Admin</div>

    <div class="header-ops">
      <template v-if="auth.isAuthenticated()">
        <t-space>
          <t-avatar :image="auth.user?.avatar" size="32px" />
          <span class="username">{{ auth.user?.username || 'user' }}</span>
          <t-button size="small" theme="primary" variant="text" @click="onLogout">退出</t-button>
        </t-space>
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
import { Button, Space, Avatar } from 'tdesign-vue-next'

const router = useRouter()
const auth = useAuthStore()

function goLogin() {
  router.push('/login')
}

function onLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.navbar-brand {
  font-weight: 600;
  font-size: 18px;
}

.navbar-nav {
  display: flex;
  gap: 24px;
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

.navbar-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  color: #666;
  font-size: 14px;
}
</style>
