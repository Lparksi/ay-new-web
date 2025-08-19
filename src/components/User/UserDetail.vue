<template>
  <t-dialog
    v-model:visible="visible"
    header="用户详情"
    width="500px"
    :confirm-btn="null"
    cancel-btn="关闭"
  >
    <div v-if="user" class="user-detail">
      <t-descriptions :data="descriptions" />
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '../../types'

const props = defineProps<{
  user?: User | null
  visible?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
}>()

const visible = computed({
  get: () => props.visible || false,
  set: (value) => emit('update:visible', value)
})

// 格式化日期
function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('zh-CN')
  } catch {
    return dateStr
  }
}

// 格式化角色
function formatRoles(user: User) {
  const roles: string[] = []
  
  // 添加多角色信息
  if (user.roles && user.roles.length > 0) {
    user.roles.forEach(role => {
      if (typeof role === 'object') {
        roles.push(role.display_name || role.name)
      } else {
        roles.push(role)
      }
    })
  }
  
  // 如果没有多角色，显示向后兼容的单角色
  if (roles.length === 0 && user.role && user.role !== 'user') {
    roles.push(user.role)
  }
  
  return roles.length > 0 ? roles.join(', ') : '-'
}

// 格式化权限
function formatPermissions(permissions?: any[]) {
  if (!permissions || permissions.length === 0) return '-'
  return permissions.map(p => p.name || p).join(', ')
}

const descriptions = computed(() => {
  if (!props.user) return []
  
  const user = props.user
  return [
    {
      label: 'ID',
      content: user.id
    },
    {
      label: '用户名',
      content: user.username
    },
    {
      label: '姓名',
      content: user.full_name || '-'
    },
    {
      label: '状态',
      content: user.active ? '激活' : '禁用'
    },
    {
      label: '角色',
      content: formatRoles(user)
    },
    {
      label: '权限',
      content: formatPermissions(user.permissions)
    },
    {
      label: '创建时间',
      content: formatDate(user.created_at)
    },
    {
      label: '更新时间',
      content: formatDate(user.updated_at)
    }
  ]
})
</script>

<style scoped>
.user-detail {
  padding: 16px 0;
}
</style>
