<template>
  <t-space direction="vertical" :size="24">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h2>用户管理</h2>
      <t-space>
        <t-button theme="primary" @click="onCreateClick">新建用户</t-button>
        <t-button @click="load">刷新</t-button>
      </t-space>
    </div>

    <user-form :modelValue="editingUser" @created="onCreate" @updated="onUpdate" @cancel="onCancelEdit" />
    <user-list :users="users" @edit="onEdit" @delete="onDelete" />
  </t-space>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import UserList from '../components/User/UserList.vue'
import UserForm from '../components/User/UserForm.vue'
import { fetchUsers, createUser, updateUser, deleteUser } from '../api/user'
import type { User } from '../types'

const users = ref<User[]>([])
const editingUser = ref<User | null>(null)

async function load() {
  const resp = await fetchUsers({ page: 1, pageSize: 50 })
  users.value = resp.items || resp || []
}

onMounted(() => {
  load()
})

async function onCreate(payload: any) {
  await createUser(payload)
  await load()
}

function onCreateClick() {
  // 进入新建模式：清空当前编辑用户，form 组件应根据 modelValue 为 null 展示新建表单
  editingUser.value = null
}

function onEdit(user: User) {
  editingUser.value = user
}

async function onUpdate(payload: { id: number | string; data: any }) {
  await updateUser(payload.id, payload.data)
  editingUser.value = null
  await load()
}

function onCancelEdit() {
  editingUser.value = null
}

async function onDelete(id: number | string) {
  await deleteUser(id)
  await load()
}
</script>

<style scoped></style>
