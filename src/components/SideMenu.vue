<template>
  <t-menu v-model:value="active" width="232">
    <template #logo>
      <div style="padding: 16px; font-weight:600;">AY Admin</div>
    </template>

    <t-menu-item value="create-task" :to="{ path: '/create-task' }">创建任务</t-menu-item>
    <t-menu-item value="users" :to="{ path: '/users' }">用户管理</t-menu-item>
    <t-menu-item value="merchants" :to="{ path: '/merchants' }">商家管理</t-menu-item>
    <t-menu-item value="merchant-tags" :to="{ path: '/merchant-tags' }">标签管理</t-menu-item>
    <t-menu-item value="profile" :to="{ path: '/profile' }">个人资料</t-menu-item>

  </t-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const route = useRoute()
const router = useRouter()

const active = ref(route.path.replace(/^\//, '') || 'create-task')

// 同步路由变化到菜单激活
watch(() => route.path, (p) => {
  active.value = p.replace(/^\//, '')
})

// menu is always expanded; collapse functionality removed
</script>

<style scoped>
/* 可按需自定义侧边栏样式 */
</style>
