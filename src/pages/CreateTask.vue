<template>
  <div class="task-management">
    <!-- 页面标题和操作按钮 -->
    <div class="header">
      <h2>任务管理</h2>
      <div class="header-actions">
        <t-button theme="primary" @click="showCreateDialog = true">
          新建任务
        </t-button>
        <t-button theme="default" @click="exportTasks">
          导出Excel
        </t-button>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filters">
      <t-row :gutter="16">
        <t-col :span="4">
          <t-input 
            v-model:value="filters.search" 
            placeholder="搜索任务名称" 
            @change="onSearch"
            clearable
          />
        </t-col>
        <t-col :span="3">
          <t-select 
            v-model:value="filters.type" 
            :options="typeOptions"
            placeholder="任务类型"
            clearable
            @change="onFilter"
          />
        </t-col>
        <t-col :span="3">
          <t-select 
            v-model:value="filters.status" 
            :options="statusOptions"
            placeholder="任务状态"
            clearable
            @change="onFilter"
          />
        </t-col>
        <t-col :span="3">
          <t-select 
            v-model:value="filters.priority" 
            :options="priorityOptions"
            placeholder="优先级"
            clearable
            @change="onFilter"
          />
        </t-col>
        <t-col :span="4">
          <UserSelect 
            :model-value="filters.assigneeId || undefined" 
            :multiple="false" 
            placeholder="指派人"
            @update:model-value="(val: any) => { filters.assigneeId = val; onFilter() }"
          />
        </t-col>
        <t-col :span="3">
          <t-button @click="resetFilters">重置</t-button>
        </t-col>
      </t-row>
    </div>

    <!-- 任务列表表格 -->
    <div class="table-container">
      <t-table
        :data="tasks"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
        row-key="id"
        stripe
      >
        <!-- 任务类型列 -->
        <template #type="{ row }">
          <t-tag :theme="getTypeTheme(row.type)">{{ getTypeLabel(row.type) }}</t-tag>
        </template>

        <!-- 优先级列 -->
        <template #priority="{ row }">
          <t-tag :theme="getPriorityTheme(row.priority)">
            {{ getPriorityLabel(row.priority) }}
          </t-tag>
        </template>

        <!-- 状态列 -->
        <template #status="{ row }">
          <t-tag :theme="getStatusTheme(row.status)">
            {{ getStatusLabel(row.status) }}
          </t-tag>
        </template>

        <!-- 进度列 -->
        <template #progress="{ row }">
          <t-progress 
            :percentage="row.progress || 0" 
            :theme="getProgressTheme(row.progress)"
            size="small"
          />
        </template>

        <!-- 指派人列 -->
        <template #assignee="{ row }">
          <span v-if="row.assignee">{{ row.assignee.full_name || row.assignee.username }}</span>
          <span v-else class="text-placeholder">未指派</span>
        </template>

        <!-- 计划时间列 -->
        <template #planTime="{ row }">
          <div v-if="row.plan_start_at && row.plan_end_at">
            <div>{{ formatDate(row.plan_start_at) }}</div>
            <div class="text-secondary">{{ formatDate(row.plan_end_at) }}</div>
          </div>
          <span v-else class="text-placeholder">未设置</span>
        </template>

        <!-- 操作列 -->
        <template #actions="{ row }">
          <t-space>
            <t-button 
              theme="primary" 
              variant="text" 
              size="small"
              @click="editTask(row)"
            >
              编辑
            </t-button>
            <t-dropdown :options="getActionOptions(row)" @click="onActionClick">
              <t-button theme="default" variant="text" size="small">
                更多 ▼
              </t-button>
            </t-dropdown>
          </t-space>
        </template>
      </t-table>
    </div>

    <!-- 新建/编辑任务对话框 -->
    <t-dialog
      v-model:visible="showCreateDialog"
      :header="isEditing ? '编辑任务' : '新建任务'"
      width="800px"
      @confirm="onSubmit"
      @cancel="resetForm"
      :confirm-btn="{ loading: isSubmitting }"
    >
      <t-form label-width="120px" v-model:value="form" ref="formRef">
        <t-form-item label="任务类型" name="type">
          <t-select v-model:value="form.type" :options="typeOptions" style="width:320px" />
        </t-form-item>

        <t-form-item label="任务名称" name="task_name">
          <t-input v-model:value="form.task_name" style="width:480px" />
        </t-form-item>

        <t-form-item label="备注">
          <t-textarea v-model:value="form.remarks" rows="4" style="width:480px" />
        </t-form-item>

        <t-form-item label="优先级">
          <t-input-number v-model:value="form.priority" :min="1" :max="5" />
        </t-form-item>

        <t-form-item label="任务状态" v-if="isEditing">
          <t-select v-model:value="form.status" :options="statusOptions" style="width:320px" />
        </t-form-item>

        <t-form-item label="进度" v-if="isEditing">
          <t-input-number v-model:value="form.progress" :min="0" :max="100" />
        </t-form-item>

        <t-form-item label="计划开始">
          <t-date-picker v-model:value="form.plan_start_at" enable-time-picker style="width:320px" />
        </t-form-item>

        <t-form-item label="计划结束">
          <t-date-picker v-model:value="form.plan_end_at" enable-time-picker style="width:320px" />
        </t-form-item>

        <t-form-item label="指派人">
          <UserSelect 
            :model-value="form.assigneeId || undefined" 
            :multiple="false"
            @update:model-value="(val: any) => form.assigneeId = val"
          />
        </t-form-item>
        
        <t-form-item label="商户">
          <MerchantSelect v-model="form.selectedMerchants" />
        </t-form-item>

        <t-form-item label="标签">
          <TagSelect v-model="form.selectedTags" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 分配任务对话框 -->
    <t-dialog
      v-model:visible="showAssignDialog"
      header="分配任务"
      width="400px"
      @confirm="onAssignConfirm"
      :confirm-btn="{ loading: isAssigning }"
    >
      <t-form label-width="80px">
        <t-form-item label="任务">
          <span>{{ assigningTask?.task_name }}</span>
        </t-form-item>
        <t-form-item label="指派给">
          <UserSelect 
            :model-value="assignForm.assigneeId || undefined" 
            :multiple="false"
            @update:model-value="(val: any) => assignForm.assigneeId = val"
          />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { 
  createTask, 
  fetchTasksPaged, 
  updateTask, 
  deleteTask, 
  assignTask, 
  updateTaskStatus as updateTaskStatusAPI,
  exportTasks as exportTasksAPI
} from '../api/task'
import { 
  Form, 
  FormItem, 
  Input, 
  Textarea, 
  Button, 
  Select, 
  InputNumber, 
  DatePicker,
  Table,
  Dialog,
  Tag,
  Progress,
  Dropdown,
  Space,
  Row,
  Col,
  Loading,
  MessagePlugin
} from 'tdesign-vue-next'
import UserSelect from '../components/Selectors/UserSelect.vue'
import MerchantSelect from '../components/Selectors/MerchantSelect.vue'
import TagSelect from '../components/Selectors/TagSelect.vue'
import { buildScopeJson } from '../utils/scope'
import { toISOStringOrNull, formatDate } from '../utils/date'
import { validateTaskForm } from '../utils/validation'
import { notifyError, notifySuccess } from '../utils/notification'
import { handleError } from '../utils/error-handler'
import type { Task } from '../types'

// 响应式数据
const tasks = ref<Task[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showAssignDialog = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const isAssigning = ref(false)
const assigningTask = ref<Task | null>(null)

// 表单数据
const form = reactive<{
  id?: number
  type: 'visit' | 'survey' | 'audit' | 'onboarding'
  task_name: string
  remarks: string
  priority: number
  status: number
  progress: number
  scope_json: string
  plan_start_at?: Date
  plan_end_at?: Date
  assigner_id: number | null
  assignee_id: number | null
  assigneeId: number | null
  group_id: number | null
  selectedMerchants: number[]
  selectedTags: number[]
}>({
  type: 'visit',
  task_name: '',
  remarks: '',
  priority: 1,
  status: 0,
  progress: 0,
  scope_json: '',
  plan_start_at: undefined,
  plan_end_at: undefined,
  assigner_id: null,
  assignee_id: null,
  assigneeId: null,
  group_id: null,
  selectedMerchants: [],
  selectedTags: [],
})

// 分配表单
const assignForm = reactive({
  assigneeId: null as number | null
})

// 筛选条件
const filters = reactive({
  search: '',
  type: '',
  status: '',
  priority: '',
  assigneeId: null as number | null,
  page: 1,
  pageSize: 10
})

// 分页数据
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
  showSizeChanger: true,
  pageSizeOptions: [10, 20, 50, 100]
})

// 选项配置
const typeOptions = [
  { label: '商户走访', value: 'visit' },
  { label: '调研巡检', value: 'survey' },
  { label: '审核合规', value: 'audit' },
  { label: '入驻激活', value: 'onboarding' },
]

const statusOptions = [
  { label: '草稿', value: 0 },
  { label: '已分配', value: 1 },
  { label: '进行中', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已取消', value: 4 },
]

const priorityOptions = [
  { label: '很低', value: 1 },
  { label: '低', value: 2 },
  { label: '中', value: 3 },
  { label: '高', value: 4 },
  { label: '很高', value: 5 },
]

// 表格列配置
const columns = computed(() => [
  {
    colKey: 'id',
    title: 'ID',
    width: 80,
    sorter: true
  },
  {
    colKey: 'task_name',
    title: '任务名称',
    width: 200,
    ellipsis: true
  },
  {
    colKey: 'type',
    title: '类型',
    width: 100,
    cell: 'type'
  },
  {
    colKey: 'priority',
    title: '优先级',
    width: 100,
    cell: 'priority'
  },
  {
    colKey: 'status',
    title: '状态',
    width: 100,
    cell: 'status'
  },
  {
    colKey: 'progress',
    title: '进度',
    width: 120,
    cell: 'progress'
  },
  {
    colKey: 'assignee',
    title: '指派人',
    width: 120,
    cell: 'assignee'
  },
  {
    colKey: 'planTime',
    title: '计划时间',
    width: 180,
    cell: 'planTime'
  },
  {
    colKey: 'created_at',
    title: '创建时间',
    width: 160,
    sorter: true,
    cell: (h: any, { row }: any) => formatDate(row.created_at)
  },
  {
    colKey: 'actions',
    title: '操作',
    width: 150,
    cell: 'actions',
    fixed: 'right'
  }
])

// 获取类型主题色
const getTypeTheme = (type: string) => {
  const themeMap: Record<string, string> = {
    'visit': 'primary',
    'survey': 'success',
    'audit': 'warning',
    'onboarding': 'default'
  }
  return themeMap[type] || 'default'
}

// 获取类型标签
const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    'visit': '商户走访',
    'survey': '调研巡检',
    'audit': '审核合规',
    'onboarding': '入驻激活'
  }
  return labelMap[type] || type
}

// 获取优先级主题色
const getPriorityTheme = (priority: number) => {
  if (priority <= 2) return 'success'
  if (priority <= 3) return 'warning'
  return 'danger'
}

// 获取优先级标签
const getPriorityLabel = (priority: number) => {
  const labelMap: Record<number, string> = {
    1: '很低',
    2: '低',
    3: '中',
    4: '高',
    5: '很高'
  }
  return labelMap[priority] || priority.toString()
}

// 获取状态主题色
const getStatusTheme = (status: number) => {
  const themeMap: Record<number, string> = {
    0: 'default',    // 草稿
    1: 'warning',    // 已分配
    2: 'primary',    // 进行中
    3: 'success',    // 已完成
    4: 'danger'      // 已取消
  }
  return themeMap[status] || 'default'
}

// 获取状态标签
const getStatusLabel = (status: number) => {
  const labelMap: Record<number, string> = {
    0: '草稿',
    1: '已分配',
    2: '进行中',
    3: '已完成',
    4: '已取消'
  }
  return labelMap[status] || status.toString()
}

// 获取进度主题色
const getProgressTheme = (progress: number) => {
  if (progress < 30) return 'danger'
  if (progress < 70) return 'warning'
  return 'success'
}

// 获取操作选项
const getActionOptions = (row: Task) => {
  const options = [
    {
      content: '分配',
      value: 'assign',
      onClick: () => assignTaskToUser(row)
    }
  ]

  if (row.status !== 3 && row.status !== 4) {  // 非已完成和已取消
    options.push({
      content: '标记完成',
      value: 'complete',
      onClick: () => updateTaskStatus(row.id!, 3)
    })
  }

  if (row.status !== 4) {  // 非已取消
    options.push({
      content: '取消任务',
      value: 'cancel',
      onClick: () => updateTaskStatus(row.id!, 4)
    })
  }

  options.push({
    content: '删除',
    value: 'delete',
    onClick: () => deleteTaskById(row.id!)
  })

  return options
}

// 加载任务列表
const loadTasks = async () => {
  try {
    loading.value = true
    const params: any = {
      ...filters,
      page: pagination.current,
      pageSize: pagination.pageSize
    }
    
    // 清理空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null) {
        delete params[key]
      }
    })

    const response = await fetchTasksPaged(params)
    console.log('API response:', response) // 调试日志
    
    // 根据实际的API响应结构来解析数据
    if (response && typeof response === 'object') {
      if (Array.isArray(response.items)) {
        tasks.value = response.items
        pagination.total = response.total || 0
      } else if (Array.isArray(response.data)) {
        tasks.value = response.data
        pagination.total = response.total || 0
      } else if (Array.isArray(response)) {
        tasks.value = response
        pagination.total = response.length
      } else {
        console.warn('Unexpected response format:', response)
        tasks.value = []
        pagination.total = 0
      }
    } else {
      tasks.value = []
      pagination.total = 0
    }
  } catch (error) {
    handleError(error)
    notifyError('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const onSearch = () => {
  pagination.current = 1
  loadTasks()
}

// 筛选
const onFilter = () => {
  pagination.current = 1
  loadTasks()
}

// 重置筛选
const resetFilters = () => {
  Object.assign(filters, {
    search: '',
    type: '',
    status: '',
    priority: '',
    assigneeId: null,
    page: 1,
    pageSize: 10
  })
  pagination.current = 1
  loadTasks()
}

// 分页变化
const onPageChange = ({ current }: { current: number }) => {
  pagination.current = current
  loadTasks()
}

const onPageSizeChange = ({ pageSize }: { pageSize: number }) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  loadTasks()
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    type: 'visit',
    task_name: '',
    remarks: '',
    priority: 1,
    status: 0,
    progress: 0,
    scope_json: '',
    plan_start_at: undefined,
    plan_end_at: undefined,
    assigner_id: null,
    assignee_id: null,
    assigneeId: null,
    group_id: null,
    selectedMerchants: [],
    selectedTags: [],
  })
  isEditing.value = false
  showCreateDialog.value = false
}

// 编辑任务
const editTask = (task: Task) => {
  isEditing.value = true
  Object.assign(form, {
    ...task,
    assigneeId: task.assignee_id,
    selectedMerchants: [],
    selectedTags: [],
    plan_start_at: task.plan_start_at ? new Date(task.plan_start_at) : undefined,
    plan_end_at: task.plan_end_at ? new Date(task.plan_end_at) : undefined,
  })
  showCreateDialog.value = true
}

// 提交表单
const onSubmit = async () => {
  const { valid, errors } = validateTaskForm(form)
  if (!valid) {
    const first = Object.values(errors)[0]
    notifyError(first as string)
    return
  }

  try {
    isSubmitting.value = true
    
    // 构建scope_json
    form.scope_json = buildScopeJson({ 
      users: form.assigneeId ? [form.assigneeId] : [],
      merchants: form.selectedMerchants, 
      tags: form.selectedTags 
    })

    const payload = {
      type: form.type,
      task_name: form.task_name,
      remarks: form.remarks,
      priority: form.priority,
      status: form.status,
      progress: form.progress,
      scope_json: form.scope_json,
      plan_start_at: toISOStringOrNull(form.plan_start_at),
      plan_end_at: toISOStringOrNull(form.plan_end_at),
      assignee_id: form.assigneeId,
      group_id: form.group_id,
    }

    if (isEditing.value && form.id) {
      await updateTask(form.id, payload)
      notifySuccess('任务更新成功')
    } else {
      const r = await createTask(payload)
      notifySuccess('任务创建成功: ID = ' + (r.data?.id || ''))
    }
    
    resetForm()
    loadTasks()
  } catch (err: any) {
    notifyError(isEditing.value ? '更新失败' : '创建失败: ' + (err?.response?.data?.message || err.message))
  } finally {
    isSubmitting.value = false
  }
}

// 分配任务
const assignTaskToUser = (task: Task) => {
  assigningTask.value = task
  assignForm.assigneeId = task.assignee_id || null
  showAssignDialog.value = true
}

// 确认分配
const onAssignConfirm = async () => {
  if (!assigningTask.value || !assignForm.assigneeId) {
    notifyError('请选择指派人')
    return
  }

  try {
    isAssigning.value = true
    await assignTask(assigningTask.value.id!, assignForm.assigneeId)
    notifySuccess('任务分配成功')
    showAssignDialog.value = false
    loadTasks()
  } catch (error) {
    handleError(error)
    notifyError('任务分配失败')
  } finally {
    isAssigning.value = false
  }
}

// 更新任务状态
const updateTaskStatus = async (id: number, status: number) => {
  try {
    await updateTaskStatusAPI(id, status)
    notifySuccess('状态更新成功')
    loadTasks()
  } catch (error) {
    handleError(error)
    notifyError('状态更新失败')
  }
}

// 删除任务
const deleteTaskById = async (id: number) => {
  try {
    await deleteTask(id)
    notifySuccess('任务删除成功')
    loadTasks()
  } catch (error) {
    handleError(error)
    notifyError('任务删除失败')
  }
}

// 导出任务
const exportTasks = async () => {
  try {
    const params: any = { ...filters }
    // 不包含分页参数
    const { page, pageSize, ...exportParams } = params
    
    const response = await exportTasksAPI(exportParams)
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tasks_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    notifySuccess('导出成功')
  } catch (error) {
    handleError(error)
    notifyError('导出失败')
  }
}

// 操作点击处理
const onActionClick = ({ data }: { data: any }) => {
  if (data.onClick) {
    data.onClick()
  }
}

// 页面加载时获取任务列表
onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.task-management {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filters {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.text-placeholder {
  color: #999;
  font-style: italic;
}

.text-secondary {
  color: #666;
  font-size: 12px;
}

:deep(.t-table) {
  border-radius: 8px;
}

:deep(.t-table th) {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

:deep(.t-table td) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.t-table tr:hover td) {
  background-color: #f8f9fa;
}

:deep(.t-dialog__header) {
  border-bottom: 1px solid #e9ecef;
}

:deep(.t-form-item__label) {
  font-weight: 500;
}

:deep(.t-tag) {
  border-radius: 4px;
}

:deep(.t-progress) {
  width: 80px;
}

.icon-plus:before {
  content: "+";
}

.icon-download:before {
  content: "↓";
}

.icon-chevron-down:before {
  content: "▼";
  font-size: 12px;
}
</style>
