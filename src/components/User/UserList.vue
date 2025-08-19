<template>
  <t-table :data="users" :columns="columns" :row-key="'id'" bordered>
  </t-table>
</template>

<script setup lang="ts">
import { computed, createVNode } from 'vue'
import { Button, Space } from 'tdesign-vue-next'
import type { User } from '../../types'

const props = defineProps<{ users: User[] }>()
const emit = defineEmits<{
  (e: 'edit', user: User): void
  (e: 'delete', id: number | string): void
}>()

function onEdit(user: User) {
  emit('edit', user)
}

function onDelete(id: number | string) {
  emit('delete', id)
}

const columns = computed(() => [
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'username', title: '用户名' },
  {
    colKey: 'actions',
    title: '操作',
    width: 200,
    cell: ({ row }: { row: User }) => {
      return createVNode(
        Space,
        null,
        {
          default: () => [
            createVNode(
              Button,
              { size: 'small', variant: 'outline', onClick: () => onEdit(row) },
              { default: () => '编辑' }
            ),
            createVNode(
              Button,
              { size: 'small', theme: 'danger', variant: 'text', onClick: () => onDelete(row.id) },
              { default: () => '删除' }
            ),
          ],
        }
      )
    }
  }
])
</script>

<style scoped></style>
