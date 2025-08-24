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
            placeholder="执行人（被分配者）"
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

  <!-- progress removed: managed by backend -->
        <!-- 只读进度列 -->
        <template #progress="{ row }">
          <t-progress
            :percentage="row.progress || 0"
            :theme="getProgressTheme(row.progress)"
            size="small"
          />
        </template>

        <!-- 执行人/发布人列：显示被分配者（执行人）和发布人（发布者） -->
        <template #assignee="{ row }">
          <div>
            <div v-if="row.assignee">{{ row.assignee.full_name || row.assignee.username }}</div>
            <div class="text-secondary" v-if="row.assigner">发布人: {{ row.assigner.full_name || row.assigner.username }}</div>
            <div v-else-if="!row.assignee" class="text-placeholder">未指派</div>
          </div>
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
            <t-dropdown :options="getActionOptions(row)" @click="enhancedOnActionClick">
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

  <!-- progress removed: backend manages progress -->

        <t-form-item label="计划开始">
          <t-date-picker v-model:value="form.plan_start_at" enable-time-picker style="width:320px" />
        </t-form-item>

        <t-form-item label="计划结束">
          <t-date-picker v-model:value="form.plan_end_at" enable-time-picker style="width:320px" />
        </t-form-item>

        <t-form-item label="执行人（被分配者）">
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

    <!-- 确认对话框：用于开始/完成/取消等需要确认的操作 -->
    <t-dialog
      v-model:visible="showConfirmDialog"
      header="确认操作"
      width="420px"
      @confirm="handleConfirmAction"
      @cancel="cancelConfirmAction"
      :confirm-btn="{ loading: isActionLoading }"
    >
      <div>{{ confirmMessage }}</div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { 
  createTask, 
  fetchTasksPaged, 
  updateTask, 
  deleteTask, 
  assignTask, 
  fetchTaskProgress,
  updateTaskStatus as updateTaskStatusAPI,
  exportTasks as exportTasksAPI,
  transitionTask
} from '../api/task'
import { 
  submitSubTask, 
  confirmSubTask, 
  presignSubtaskAttachment, 
  confirmSubtaskAttachment
} from '../api/subtask'
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
// 当前正在编辑的原始任务（用于比较字段变更）
const editingTask = ref<Task | null>(null)

// 表单数据
const form = reactive<{
  id?: number
  type: 'visit' | 'survey' | 'audit' | 'onboarding'
  task_name: string
  remarks: string
  priority: number
  status: number
  // progress is managed by backend; removed from client editable fields
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
  // progress removed
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
    colKey: 'assignee',
  title: '执行人',
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

// progress display removed; backend manages progress
const getProgressTheme = (progress: number) => {
  if (!progress && progress !== 0) return 'default'
  if (progress < 30) return 'danger'
  if (progress < 70) return 'warning'
  return 'success'
}

// 获取操作选项（将 action 与 rowId 编码到 option 对象，避免函数在内部被序列化丢失）
const getActionOptions = (row: Task) => {
  const options: any[] = []
  options.push({ content: '分配', value: 'assign', action: 'assign', rowId: row.id })
  // 提交子任务与上传资料入口（需要额外输入子任务/附件）
  options.push({ content: '提交子任务', value: 'submit_subtask', action: 'submit_subtask', rowId: row.id })
  options.push({ content: '上传资料', value: 'upload_attachment', action: 'upload_attachment', rowId: row.id })
  if (row.status !== 3 && row.status !== 4) { // 非已完成和已取消
    options.push({ content: '标记完成', value: 'complete', action: 'complete', rowId: row.id })
  }
  if (row.status !== 4) {
    options.push({ content: '取消任务', value: 'cancel', action: 'cancel', rowId: row.id })
  }
  options.push({ content: '删除', value: 'delete', action: 'delete', rowId: row.id })
  return options
}

const onTransition = async (id: number, action: string) => {
  if (!id) {
    console.warn('onTransition called with invalid id', id, action)
    notifyError('无效的任务ID')
    return
  }
  try {
    console.log('transitionTask call', id, action)
    await transitionTask(id, action)
    notifySuccess('操作成功')
    loadTasks()
  } catch (e) {
    console.error('transition failed', e)
    handleError(e)
    notifyError('操作失败')
  }
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
        // fetch per-task progress stats in parallel
        try {
          await Promise.all(tasks.value.map(async (t: any) => {
            try {
              const pr = await fetchTaskProgress(t.id)
              const rate = pr?.data?.completion_rate ?? 0
              ;(t as any).progress = Math.round((rate || 0) * 100)
            } catch (e) {
              // ignore per-task progress error
              ;(t as any).progress = 0
            }
          }))
        } catch (e) {
          // ignore
        }
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
  // 清除正在编辑的原始任务
  editingTask.value = null
  showCreateDialog.value = false
}

// 编辑任务
const editTask = (task: Task) => {
  console.log('editTask called', task)
  isEditing.value = true
  // 保存原始任务用于后续比较（比如指派人是否修改）
  editingTask.value = task
  Object.assign(form, {
    ...task,
    assigneeId: task.assignee_id,
    // 尝试从后端返回的字段或嵌套对象中提取 merchant/tag id 列表
    selectedMerchants: (task as any).selectedMerchants || ((task as any).merchants ? (task as any).merchants.map((m: any) => m.id) : []),
    selectedTags: (task as any).selectedTags || ((task as any).tags ? (task as any).tags.map((t: any) => t.id) : []),
    plan_start_at: task.plan_start_at ? new Date(task.plan_start_at) : undefined,
    plan_end_at: task.plan_end_at ? new Date(task.plan_end_at) : undefined,
  })
  // 确保 id 显式赋值（支持后端返回不同命名，比如 id / ID / task_id）
  ;(form as any).id = (task as any).id ?? (task as any).ID ?? (task as any).task_id ?? (task as any).TaskID ?? undefined
  showCreateDialog.value = true
}

// 提交表单
const onSubmit = async () => {
  try { console.log('onSubmit called, isEditing=', isEditing.value, 'form=', JSON.parse(JSON.stringify(form))) } catch (e) { console.log('onSubmit log failed', e) }
  try { console.log('form.id =', (form as any).id) } catch (e) { }
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
      scope_json: form.scope_json,
      plan_start_at: toISOStringOrNull(form.plan_start_at),
      plan_end_at: toISOStringOrNull(form.plan_end_at),
      group_id: form.group_id,
    }
    // 主接口不直接包含 assignee；通过 assignTask 单独处理指派以走后端业务逻辑
    if (isEditing.value && form.id) {
      try {
        console.log('Updating task payload:', payload)
        const resp = await updateTask(form.id, payload)
        console.log('Update response:', resp)
        notifySuccess('任务更新成功')
        // 如果指派人发生变化，调用 assignTask
        const originalAssignee = editingTask.value?.assignee_id ?? null
        const newAssignee = form.assigneeId ?? null
        if (originalAssignee !== newAssignee) {
          try {
            if (newAssignee === null) {
              // 若后端支持取消指派，可调用 assignTask with null; 这里仅在选中非空时调用
            } else {
              console.log('Calling assignTask after update:', form.id, newAssignee)
              await assignTask(form.id as number, newAssignee)
              notifySuccess('指派人已更新')
            }
          } catch (e) {
            console.error('Assign after update failed', e)
            notifyError('更新后指派失败')
          }
        }
      } catch (err: any) {
        console.error('Update failed:', err)
        notifyError('更新失败: ' + (err?.response?.data?.message || err.message || '未知错误'))
        return
      }
    } else {
  const r = await createTask(payload)
  console.log('Create response:', r)
  // 后端返回形态不确定：尝试多个路径寻找新创建记录 ID
  const createdId = r.data?.id ?? r.data?.data?.id ?? r.data?.task?.id ?? r.data?.task_id ?? r.data?.data?.task_id
  // 如果创建时选择了 assignee，使用 assignTask 完成指派
  if (createdId && form.assigneeId) {
        try {
          console.log('Calling assignTask after create:', createdId, form.assigneeId)
          await assignTask(createdId, form.assigneeId)
          notifySuccess('任务创建并分配成功')
        } catch (e) {
          console.error('Assign after create failed', e)
          notifyError('创建后指派失败')
        }
      } else {
        notifySuccess('任务创建成功: ID = ' + (createdId || ''))
      }
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
  // normalize possible nested/alternative fields
  assignForm.assigneeId = (task as any).assignee_id ?? (task as any).assigneeId ?? null
  showAssignDialog.value = true
}

// 确认分配
const onAssignConfirm = async () => {
  if (!assigningTask.value) {
    notifyError('无效的任务')
    return
  }
  if (assignForm.assigneeId === null || assignForm.assigneeId === undefined) {
    notifyError('请选择执行人（被分配者）')
    return
  }

  try {
    isAssigning.value = true
    await assignTask(assigningTask.value.id!, assignForm.assigneeId)
    notifySuccess('任务分配成功')
    showAssignDialog.value = false
  // refresh
  await loadTasks()
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
  try {
    if (!data) return
    if (data.onClick) {
      data.onClick()
      return
    }
    // 基于 action 字段分发
    const action = data.action
    const id = data.rowId
    if (!action || !id) return
    switch (action) {
      case 'assign':
        // 找到对应行对象并打开分配对话框
        const t = tasks.value.find(x => x.id === id)
        if (t) assignTaskToUser(t)
        break
      case 'start':
      case 'complete':
      case 'cancel':
        // 展示确认对话框
        confirmAction.value = { id, action }
        confirmMessage.value = action === 'start' ? '确认开始该任务？' : (action === 'complete' ? '确认标记该任务为完成？' : '确认取消该任务？')
        showConfirmDialog.value = true
        break
      case 'delete':
        deleteTaskById(id)
        break
    }
  } catch (e) {
    console.error('onActionClick error', e)
  }
}

// 确认对话框相关状态
const showConfirmDialog = ref(false)
const confirmMessage = ref('')
const confirmAction = ref<{ id: number, action: string } | null>(null)
const isActionLoading = ref(false)

const handleConfirmAction = async () => {
  if (!confirmAction.value) return
  isActionLoading.value = true
  try {
    await onTransition(confirmAction.value.id, confirmAction.value.action)
  } finally {
    isActionLoading.value = false
    showConfirmDialog.value = false
    confirmAction.value = null
  }
}

const cancelConfirmAction = () => {
  showConfirmDialog.value = false
  confirmAction.value = null
}

// 页面加载时获取任务列表
onMounted(() => {
  loadTasks()
})

const auth = useAuthStore()

// ========== 子任务 & 附件 基本交互 ==========
const showSubtaskDialog = ref(false)
const subtaskForm = reactive({
  taskId: null as number | null,
  taskMerchantId: null as number | null,
  merchantId: null as number | null,
  submitterId: 0,
  content: '',
  attachments: [] as Array<{ url: string; type: string; meta_json?: string }>
})

const openSubmitSubtask = (taskId: number) => {
  subtaskForm.taskId = taskId
  subtaskForm.content = ''
  subtaskForm.attachments = []
  showSubtaskDialog.value = true
}

const submitSubtaskHandler = async () => {
  if (!subtaskForm.taskId) {
    notifyError('无效的任务ID')
    return
  }
  try {
    const payload = {
      task_id: subtaskForm.taskId,
      content: subtaskForm.content,
      submitter_id: auth.user?.id || subtaskForm.submitterId || 0,
      attachments: subtaskForm.attachments
    }
    await submitSubTask(payload as any)
    notifySuccess('子任务提交成功')
    showSubtaskDialog.value = false
    loadTasks()
  } catch (e) {
    handleError(e)
    notifyError('提交子任务失败')
  }
}

// 简单的附件上传流程（预签名 -> 前端上传 -> 确认）
const uploadAttachmentForSubtask = async (subtaskId: number, file: File) => {
  try {
    const presignReq = {
      file_name: file.name,
      size: file.size,
      mime: file.type || 'application/octet-stream',
      biz_type: 'attachment'
    }
    const presignResp = await presignSubtaskAttachment(subtaskId, presignReq as any)
    const data = presignResp.data
    // 执行浏览器端直传（这里假设使用 FormData + fetch）
    const formData = new FormData()
    // 预签名返回的 policy/fields 或 headers 取决于后端实现；这里尽量兼容常见 PostPolicy
    if (data.policy) {
      // assume PostPolicy fields present
      Object.keys(data.headers || {}).forEach(k => formData.append(k, data.headers[k]))
    }
    formData.append('file', file)
    // 使用 fetch 上传至 presign host
    await fetch(data.host, { method: 'POST', body: formData })
    // 调用确认接口
    await confirmSubtaskAttachment(subtaskId, {
      key: data.key,
      file_name: file.name,
      size: file.size,
      mime: file.type || 'application/octet-stream'
    } as any)
    notifySuccess('附件上传并确认成功')
  } catch (e) {
    handleError(e)
    notifyError('附件上传失败')
  }
}

// 在操作菜单中处理子任务和上传入口
// extend onActionClick 的 switch
const origOnActionClick = onActionClick
const enhancedOnActionClick = (payload: any) => {
  try {
    if (!payload || !payload.data) return
    const data = payload.data
    if (data.action === 'submit_subtask') {
      const id = data.rowId
      if (id) openSubmitSubtask(id)
      return
    }
    if (data.action === 'upload_attachment') {
      const id = data.rowId
      if (!id) return
      // 简单文件选择触发（仅示范）：创建一个隐藏 input
      const input = document.createElement('input')
      input.type = 'file'
      input.onchange = (ev: any) => {
        const f = ev.target.files && ev.target.files[0]
        if (f) {
          // 这里示例将 subtaskId 等于 task id（真实场景应先创建子任务再上传）
          uploadAttachmentForSubtask(id, f)
        }
      }
      input.click()
      return
    }
    // otherwise fallback to original
    origOnActionClick(payload)
  } catch (e) {
    console.error('enhancedOnActionClick error', e)
  }
}

// enhancedOnActionClick 直接暴露供模板使用
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
