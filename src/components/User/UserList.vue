<template>
  <div>
    <!-- 搜索和筛选区域 -->
    <t-space class="search-section" direction="vertical" :size="16">
      <t-form :data="searchForm" layout="inline" @submit="onSearch" @reset="onReset">
        <t-form-item label="用户名" name="username">
          <t-input 
            v-model="searchForm.username" 
            placeholder="请输入用户名" 
            clearable
            style="width: 200px;"
          />
        </t-form-item>
        <t-form-item label="姓名" name="full_name">
          <t-input 
            v-model="searchForm.full_name" 
            placeholder="请输入姓名" 
            clearable
            style="width: 200px;"
          />
        </t-form-item>
        <t-form-item label="状态" name="active">
          <t-select 
            v-model="searchForm.active" 
            placeholder="请选择状态" 
            clearable
            style="width: 120px;"
          >
            <t-option value="true" label="激活" />
            <t-option value="false" label="禁用" />
          </t-select>
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">搜索</t-button>
            <t-button type="reset">重置</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-space>

    <!-- 批量操作区域 -->
    <div v-if="selectedRowKeys.length > 0" class="batch-operations">
      <t-space>
        <span class="selected-info">
          已选择 {{ selectedRowKeys.length }} 项
        </span>
        <t-button 
          size="small" 
          theme="danger" 
          variant="outline"
          @click="onBatchDelete"
        >
          批量删除
        </t-button>
        <t-button 
          size="small" 
          variant="outline"
          @click="onClearSelection"
        >
          清空选择
        </t-button>
      </t-space>
    </div>

    <!-- 表格 -->
    <t-table 
      :data="users || []" 
      :columns="columns" 
      :row-key="'id'" 
      :pagination="pagination"
      :loading="loading"
      :selected-row-keys="selectedRowKeys"
      bordered
      hover
      stripe
      size="medium"
      cell-empty-content="-"
      empty="暂无数据"
      @page-change="onPageChange"
      @select-change="onSelectChange"
    >
      <!-- 状态列自定义渲染 -->
      <template #status="{ row }">
        <t-tag 
          :theme="(row && row.active) ? 'success' : 'danger'" 
          variant="light-outline"
          size="small"
        >
          {{ (row && row.active) ? '激活' : '禁用' }}
        </t-tag>
      </template>

      <!-- 角色列自定义渲染 -->
      <template #roles="{ row }">
        <t-space v-if="row && row.roles && row.roles.length > 0" :size="4">
          <t-tag 
            v-for="role in row.roles" 
            :key="role.id || role.name || role" 
            theme="primary" 
            variant="light"
            size="small"
          >
            {{ typeof role === 'object' ? (role.display_name || role.name) : role }}
          </t-tag>
        </t-space>
        <!-- 显示向后兼容的单角色字段 -->
        <t-tag 
          v-else-if="row && row.role && row.role !== 'user'" 
          theme="primary" 
          variant="light"
          size="small"
        >
          {{ row.role }}
        </t-tag>
        <span v-else class="text-placeholder">-</span>
      </template>

      <!-- 操作列自定义渲染 -->
      <template #actions="{ row }">
        <t-space v-if="row" :size="8">
          <t-button 
            size="small" 
            variant="text" 
            theme="default"
            @click="onView(row)"
          >
            查看
          </t-button>
          <t-button 
            size="small" 
            variant="text" 
            theme="primary"
            @click="onEdit(row)"
          >
            编辑
          </t-button>
          <t-button 
            size="small" 
            variant="text" 
            theme="danger"
            @click="onDelete(row.id)"
          >
            删除
          </t-button>
        </t-space>
        <span v-else>-</span>
      </template>
    </t-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import type { User } from '../../types'

const props = defineProps<{ 
  users: User[]
  loading?: boolean
  pagination?: any
}>()

const emit = defineEmits<{
  (e: 'edit', user: User): void
  (e: 'delete', id: number | string): void
  (e: 'view', user: User): void
  (e: 'search', params: any): void
  (e: 'page-change', pageInfo: any): void
  (e: 'batch-delete', ids: (number | string)[]): void
}>()

// 搜索表单
const searchForm = reactive({
  username: '',
  full_name: '',
  active: undefined as string | undefined
})

// 选择状态
const selectedRowKeys = ref<(string | number)[]>([])

function onEdit(user: User) {
  emit('edit', user)
}

function onView(user: User) {
  emit('view', user)
}

function onDelete(id: number | string) {
  emit('delete', id)
}

function onSearch() {
  const params: any = { ...searchForm }
  // 转换active字段
  if (params.active !== undefined) {
    params.active = params.active === 'true'
  }
  emit('search', params)
}

function onReset() {
  searchForm.username = ''
  searchForm.full_name = ''
  searchForm.active = undefined
  emit('search', {})
}

function onPageChange(pageInfo: any) {
  emit('page-change', pageInfo)
}

// 选择变化
function onSelectChange(selectedKeys: (string | number)[]) {
  selectedRowKeys.value = selectedKeys
}

// 批量删除
function onBatchDelete() {
  emit('batch-delete', selectedRowKeys.value)
}

// 清空选择
function onClearSelection() {
  selectedRowKeys.value = []
}

// 格式化日期
function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  } catch {
    return dateStr
  }
}

const columns = computed(() => [
  { 
    colKey: 'row-select', 
    type: 'multiple',
    width: 50,
    align: 'center'
  },
  { 
    colKey: 'id', 
    title: 'ID', 
    width: 80,
    align: 'center'
  },
  { 
    colKey: 'username', 
    title: '用户名',
    width: 140,
    ellipsis: true
  },
  { 
    colKey: 'full_name', 
    title: '姓名',
    width: 120,
    ellipsis: true
  },
  { 
    colKey: 'active', 
    title: '状态',
    width: 80,
    align: 'center',
    cell: 'status'
  },
  { 
    colKey: 'roles', 
    title: '角色',
    width: 180,
    cell: 'roles'
  },
  { 
    colKey: 'created_at', 
    title: '创建时间',
    width: 140,
    cell: ({ row }: { row?: User }) => row ? formatDate(row.created_at) : '-'
  },
  {
    colKey: 'actions',
    title: '操作',
    width: 160,
    align: 'center',
    fixed: 'right',
    cell: 'actions'
  }
])
</script>

<style scoped>
.search-section {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 16px;
}

.text-placeholder {
  color: #bbb;
}

.batch-operations {
  padding: 12px 16px;
  background: #f0f7ff;
  border: 1px solid #d0e5ff;
  border-radius: 6px;
  margin-bottom: 16px;
}

.selected-info {
  color: #0052d9;
  font-weight: 500;
}
</style>
