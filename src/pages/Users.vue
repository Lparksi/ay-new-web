<template>
  <div class="users-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>用户管理</h2>
      <t-space>
        <t-dropdown>
          <t-button variant="outline">
            <template #icon>
              <download-icon />
            </template>
            导出数据
          </t-button>
          <t-dropdown-menu>
            <t-dropdown-item @click="exportToExcel">导出Excel</t-dropdown-item>
            <t-dropdown-item @click="exportToCSV">导出CSV</t-dropdown-item>
          </t-dropdown-menu>
        </t-dropdown>
        <t-button theme="primary" @click="onCreateClick">
          <template #icon>
            <add-icon />
          </template>
          新建用户
        </t-button>
        <t-button variant="outline" @click="load">
          <template #icon>
            <refresh-icon />
          </template>
          刷新
        </t-button>
      </t-space>
    </div>

    <!-- 用户列表 -->
    <user-list 
      :users="users" 
      :loading="loading"
      :pagination="pagination"
      @edit="onEdit" 
      @view="onView"
      @delete="onDeleteClick"
      @batch-delete="onBatchDeleteClick"
      @search="onSearch"
      @page-change="onPageChange"
    />

    <!-- 用户表单对话框 -->
    <user-form 
      v-model:visible="formVisible"
      :modelValue="editingUser" 
      @created="onCreate" 
      @updated="onUpdate" 
      @cancel="onCancelEdit" 
    />

    <!-- 用户详情对话框 -->
    <user-detail
      v-model:visible="detailVisible"
      :user="viewingUser"
    />

    <!-- 删除确认对话框 -->
    <t-dialog
      v-model:visible="deleteDialogVisible"
      header="确认删除"
      theme="warning"
      @confirm="onConfirmDelete"
      @cancel="onCancelDelete"
    >
      <p>确定要删除用户 <strong>{{ deletingUser?.username }}</strong> 吗？</p>
      <p class="warning-text">此操作不可撤销，请谨慎操作。</p>
    </t-dialog>

    <!-- 批量删除确认对话框 -->
    <t-dialog
      v-model:visible="batchDeleteDialogVisible"
      header="确认批量删除"
      theme="warning"
      @confirm="onConfirmBatchDelete"
      @cancel="onCancelBatchDelete"
    >
      <p>确定要删除选中的 <strong>{{ deletingUserIds.length }}</strong> 个用户吗？</p>
      <p class="warning-text">此操作不可撤销，请谨慎操作。</p>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { AddIcon, RefreshIcon, DownloadIcon } from 'tdesign-icons-vue-next'
import UserList from '../components/User/UserList.vue'
import UserForm from '../components/User/UserForm.vue'
import UserDetail from '../components/User/UserDetail.vue'
import { fetchUsers, createUser, updateUser, deleteUser } from '../api/user'
import { exportUsersToExcel, exportUsersToCSV } from '../utils/export'
import type { User } from '../types'

// 数据状态
const users = ref<User[]>([])
const loading = ref(false)
const editingUser = ref<User | null>(null)
const viewingUser = ref<User | null>(null)
const formVisible = ref(false)
const detailVisible = ref(false)
const deleteDialogVisible = ref(false)
const batchDeleteDialogVisible = ref(false)
const deletingUser = ref<User | null>(null)
const deletingUserIds = ref<(number | string)[]>([])

// 搜索和分页参数
const searchParams = reactive({
  username: '',
  email: '',
  active: undefined as boolean | undefined
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
  showSizer: true,
  pageSizeOptions: [10, 20, 50, 100]
})

// 加载用户列表
async function load() {
  try {
    loading.value = true
    
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...searchParams
    }

    const resp = await fetchUsers(params)
    
    // 处理响应数据
    if (resp && typeof resp === 'object' && 'items' in resp) {
      // 确保每个用户对象都是有效的
      users.value = (resp.items as User[]).filter(user => user && typeof user === 'object' && user.id)
      pagination.total = resp.total || resp.items.length
    } else if (Array.isArray(resp)) {
      // 过滤无效数据
      users.value = resp.filter(user => user && typeof user === 'object' && user.id)
      pagination.total = resp.length
    } else {
      users.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    MessagePlugin.error('加载用户列表失败')
    users.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  load()
})

// 搜索
function onSearch(params: any) {
  Object.assign(searchParams, params)
  pagination.current = 1 // 重置到第一页
  load()
}

// 分页变化
function onPageChange(pageInfo: any) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  load()
}

// 创建用户
function onCreateClick() {
  editingUser.value = null
  formVisible.value = true
}

async function onCreate(payload: any) {
  try {
    await createUser(payload)
    formVisible.value = false
    MessagePlugin.success('用户创建成功')
    await load()
  } catch (error) {
    console.error('创建用户失败:', error)
    MessagePlugin.error('创建用户失败')
  }
}

// 编辑用户
function onEdit(user: User) {
  editingUser.value = user
  formVisible.value = true
}

// 查看用户详情
function onView(user: User) {
  viewingUser.value = user
  detailVisible.value = true
}

async function onUpdate(payload: { id: number | string; data: any }) {
  try {
    await updateUser(payload.id, payload.data)
    formVisible.value = false
    editingUser.value = null
    MessagePlugin.success('用户更新成功')
    await load()
  } catch (error) {
    console.error('更新用户失败:', error)
    MessagePlugin.error('更新用户失败')
  }
}

function onCancelEdit() {
  formVisible.value = false
  editingUser.value = null
}

// 删除用户
function onDeleteClick(id: number | string) {
  const user = users.value.find(u => u.id === id)
  if (user) {
    deletingUser.value = user
    deleteDialogVisible.value = true
  }
}

// 批量删除用户
function onBatchDeleteClick(ids: (number | string)[]) {
  deletingUserIds.value = ids
  batchDeleteDialogVisible.value = true
}

async function onConfirmDelete() {
  if (!deletingUser.value) return
  
  try {
    await deleteUser(deletingUser.value.id)
    deleteDialogVisible.value = false
    deletingUser.value = null
    MessagePlugin.success('用户删除成功')
    await load()
  } catch (error) {
    console.error('删除用户失败:', error)
    MessagePlugin.error('删除用户失败')
  }
}

function onCancelDelete() {
  deleteDialogVisible.value = false
  deletingUser.value = null
}

async function onConfirmBatchDelete() {
  if (deletingUserIds.value.length === 0) return
  
  try {
    // 批量删除用户
    await Promise.all(deletingUserIds.value.map(id => deleteUser(id)))
    batchDeleteDialogVisible.value = false
    deletingUserIds.value = []
    MessagePlugin.success(`成功删除 ${deletingUserIds.value.length} 个用户`)
    await load()
  } catch (error) {
    console.error('批量删除用户失败:', error)
    MessagePlugin.error('批量删除用户失败')
  }
}

function onCancelBatchDelete() {
  batchDeleteDialogVisible.value = false
  deletingUserIds.value = []
}

// 导出功能
function exportToExcel() {
  try {
    exportUsersToExcel(users.value, '用户列表')
    MessagePlugin.success('导出Excel成功')
  } catch (error) {
    console.error('导出Excel失败:', error)
    MessagePlugin.error('导出Excel失败')
  }
}

function exportToCSV() {
  try {
    exportUsersToCSV(users.value, '用户列表')
    MessagePlugin.success('导出CSV成功')
  } catch (error) {
    console.error('导出CSV失败:', error)
    MessagePlugin.error('导出CSV失败')
  }
}
</script>

<style scoped>
.users-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.warning-text {
  color: #f56565;
  font-size: 14px;
  margin-top: 8px;
}
</style>
