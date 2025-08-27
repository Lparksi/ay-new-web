<template>
  <div class="my-tasks-page">
    <t-card title="我的任务管理" style="height:100%;">
      <!-- 任务选择区域 -->
      <div class="task-selector" style="margin-bottom: 16px;">
        <t-select v-model="selectedTaskId" placeholder="请选择任务" @change="onTaskSelect" style="width: 300px;">
          <t-option v-for="task in combinedTasks" :key="task.id" :value="task.id" :label="task.task_name">
            {{ task.task_name }}
            <t-tag size="small" theme="primary" variant="light" style="margin-left: 8px;">
              {{ task._sourceLabel }}
            </t-tag>
          </t-option>
        </t-select>
      </div>

      <!-- 商家任务表格 -->
      <t-table v-if="selectedTaskId && !loadingMerchants" :data="merchantTableData" :columns="merchantColumns"
        :loading="loadingMerchants" row-key="id" bordered hover size="medium" :pagination="pagination"
        @row-click="handleRowClick" table-layout="auto" :resizable="true">
        <template #status="{ row }">
          <t-tag :theme="getStatusTheme(row.status)" variant="light">
            {{ getStatusText(row.status) }}
          </t-tag>
        </template>

        <template #actions="{ row }">
          <t-space>
            <t-button size="small" theme="primary" @click="openUploadDialog(row)">
              上传内容
            </t-button>
            <t-button size="small" theme="success" :disabled="!canComplete(row)" @click="confirmComplete(row)">
              确认完成
            </t-button>
          </t-space>
        </template>

        <template #progress="{ row }">
          <div style="display: flex; align-items: center;">
            <span style="margin-right: 8px;">{{ row.completedSubtasks }}/{{ row.totalSubtasks }}</span>
            <t-progress :percentage="getProgressPercentage(row)" size="small" :status="getProgressStatus(row)" />
          </div>
        </template>
      </t-table>

      <!-- 空状态 -->
      <div v-if="!selectedTaskId" class="empty-state" style="text-align: center; padding: 40px;">
        <div style="color: #999; font-size: 14px;">请选择一个任务查看商家列表</div>
      </div>

      <div v-if="selectedTaskId && merchantTableData.length === 0 && !loadingMerchants" class="empty-state"
        style="text-align: center; padding: 40px;">
        <div style="color: #999; font-size: 14px;">该任务暂无分配的商家</div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loadingAssigned || loadingManaged" class="loading" style="text-align: center; padding: 40px;">
        <t-loading size="medium" />
        <div style="margin-top: 8px; color: #999;">加载中...</div>
      </div>
    </t-card>

    <!-- 上传内容对话框 -->
    <t-dialog v-model:visible="showUploadDialog" header="上传任务内容" width="600px" @confirm="handleUploadConfirm">
      <div v-if="currentMerchant">
        <div style="margin-bottom: 16px;">
          <strong>商家：</strong>{{ currentMerchant.merchant_name }}
        </div>

        <t-form>
          <t-form-item label="提交内容">
            <t-textarea v-model="uploadContent" rows="4" placeholder="请输入任务完成内容描述" />
          </t-form-item>

          <t-form-item label="上传图片/文件">
            <t-upload v-model="uploadFiles" theme="image-flow" :multiple="true" :auto-upload="false"
              accept="image/*,.pdf,.doc,.docx" :max="5" tips="支持上传图片、PDF、Word文档，最多5个文件" />
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Card as TCard,
  Select as TSelect,
  Option as TOption,
  Tag as TTag,
  Table as TTable,
  Space as TSpace,
  Button as TButton,
  Progress as TProgress,
  Loading as TLoading,
  Dialog as TDialog,
  Form as TForm,
  FormItem as TFormItem,
  Textarea as TTextarea,
  Upload as TUpload
} from 'tdesign-vue-next'
import { fetchTasksPaged, fetchTaskMerchants } from '../api/task'
import { submitSubTask, listSubTasks, presignSubtaskAttachment, confirmSubtaskAttachment, confirmSubTask } from '../api/subtask'
import { fetchMerchant } from '../api/merchant'
import { useAuthStore } from '../stores/auth'

const assignedTasks = ref<any[]>([])
const managedTasks = ref<any[]>([])
const loadingAssigned = ref(false)
const loadingManaged = ref(false)
const loadingMerchants = ref(false)

// 新增的响应式数据
const selectedTaskId = ref<number | undefined>(undefined)
const merchantTableData = ref<any[]>([])
const showUploadDialog = ref(false)
const currentMerchant = ref<any | null>(null)
const uploadContent = ref('')
const uploadFiles = ref<any[]>([])

// 表格相关
const pagination = ref({
  defaultCurrent: 1,
  defaultPageSize: 10,
  total: 0,
})

// 表格列配置
const merchantColumns = ref([
  {
    colKey: 'merchant_name',
    title: '商家名称',
    minWidth: 200,
    ellipsis: true,
  },
  {
    colKey: 'status',
    title: '完成状态',
    width: 100,
    cell: 'status'
  },
  {
    colKey: 'progress',
    title: '进度',
    width: 150,
    cell: 'progress'
  },
  {
    colKey: 'last_submit_time',
    title: '最后提交时间',
    width: 160,
    ellipsis: true,
  },
  {
    colKey: 'actions',
    title: '操作',
    width: 180,
    cell: 'actions',
    fixed: 'right'
  }
])

const auth = useAuthStore()

const loadAssigned = async () => {
  if (!auth.isAuthenticated()) return
  loadingAssigned.value = true
  try {
    const data = await fetchTasksPaged({});
    console.log('[MyTasks] loadAssigned response:', data)
    assignedTasks.value = data.items || data.data?.items || data || []
  } catch (e) {
    assignedTasks.value = []
  } finally {
    loadingAssigned.value = false
  }
}

const loadManaged = async () => {
  if (!auth.user || !auth.user.id) return
  loadingManaged.value = true
  try {
    const params: any = { assigner_id: auth.user.id, assignerId: auth.user.id, page: 1, pageSize: 50 }
    const data = await fetchTasksPaged(params)
    console.log('[MyTasks] loadManaged response:', params, data)
    managedTasks.value = data.items || data.data?.items || data || []
  } catch (e) {
    managedTasks.value = []
  } finally {
    loadingManaged.value = false
  }
}

// 合并任务列表
const combinedTasks = computed(() => {
  const map = new Map<number, any>()
  for (const t of assignedTasks.value) {
    const copy = { ...t, _sourceLabel: '分配给我的' }
    map.set(t.id, copy)
  }
  for (const t of managedTasks.value) {
    if (map.has(t.id)) {
      const existing = map.get(t.id)
      existing._sourceLabel = '分配给我的/我管理'
      map.set(t.id, existing)
    } else {
      const copy = { ...t, _sourceLabel: '我管理的' }
      map.set(t.id, copy)
    }
  }
  return Array.from(map.values())
})

// 任务选择处理
const onTaskSelect = async (value: any) => {
  const taskId = Number(value)
  selectedTaskId.value = taskId
  await loadMerchantData(taskId)
}

// 加载商家数据
const loadMerchantData = async (taskId: number) => {
  loadingMerchants.value = true
  try {
    const [merchantsResp, subtasksResp] = await Promise.all([
      fetchTaskMerchants(taskId, { page: 1, size: 200 }),
      listSubTasks({ taskId: taskId, page: 1, size: 500 }),
    ])

    // 如果需要，也可以获取商户详细信息
    // import { fetchMerchants } from '../api/merchant'
    // const merchantIds = merchants.map(m => m.merchant_id).filter(Boolean)
    // const merchantDetails = await fetchMerchants({ ids: merchantIds })

    const merchants = merchantsResp.items || merchantsResp.data?.items || merchantsResp.list || merchantsResp.data?.list || (Array.isArray(merchantsResp) ? merchantsResp : [])
    const subtasks = subtasksResp.data?.data?.list || subtasksResp.data?.data?.items || subtasksResp.data?.list || subtasksResp.data?.items || subtasksResp.list || subtasksResp.items || (Array.isArray(subtasksResp.data) ? subtasksResp.data : []) || []

    console.log('[MyTasks] loadMerchantData - merchants:', merchants)
    console.log('[MyTasks] loadMerchantData - subtasksResp:', subtasksResp)
    console.log('[MyTasks] loadMerchantData - subtasks:', subtasks)
    console.log('[MyTasks] loadMerchantData - subtasks is array:', Array.isArray(subtasks))

    // 处理商家数据，关联子任务信息
    console.log('[MyTasks] Sample merchant object:', merchants[0])

    // 获取所有商户的详细信息
    const merchantDetails = new Map()
    const merchantIds = [...new Set(merchants.map((m: any) => m.merchant_id).filter(Boolean))]

    try {
      await Promise.all(merchantIds.map(async (id: number) => {
        try {
          const detail = await fetchMerchant(id)
          merchantDetails.set(id, detail)
        } catch (e) {
          console.warn(`Failed to fetch merchant ${id}:`, e)
        }
      }))
    } catch (e) {
      console.warn('Failed to fetch merchant details:', e)
    }

    const merchantData = merchants.map((merchant: any) => {
      const merchantSubtasks = subtasks.filter((st: any) =>
        st.merchant_id === merchant.merchant_id || st.task_merchant_id === (merchant.ID || merchant.id)
      )

      const completedSubtasks = merchantSubtasks.filter((st: any) => st.status === 'success').length
      const totalSubtasks = merchantSubtasks.length || 1 // 至少为1，避免除0

      // 获取最后提交时间
      const lastSubmit = merchantSubtasks
        .filter((st: any) => st.submitted_at)
        .sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0]

      // 获取商户详细信息
      const detail = merchantDetails.get(merchant.merchant_id)
      const merchantName = detail ?
        `${detail.name || detail.legal_name || `商户${merchant.merchant_id}`}${detail.address ? ' · ' + detail.address : ''}` :
        `商户 ${merchant.merchant_id}`

      return {
        id: merchant.ID || merchant.id,
        merchant_id: merchant.merchant_id,
        merchant_name: merchantName,
        status: completedSubtasks === totalSubtasks ? 'completed' : totalSubtasks > 0 ? 'in_progress' : 'pending',
        completedSubtasks,
        totalSubtasks,
        last_submit_time: lastSubmit?.submitted_at || '-',
        subtasks: merchantSubtasks,
        taskMerchantId: merchant.ID || merchant.id,
        merchantDetail: detail // 保存详细信息供上传对话框使用
      }
    })

    merchantTableData.value = merchantData
    pagination.value.total = merchantData.length
  } catch (e) {
    console.error('Load merchant data failed:', e)
    merchantTableData.value = []
  } finally {
    loadingMerchants.value = false
  }
}

// 状态相关函数
const getStatusTheme = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'in_progress': return 'warning'
    case 'pending': return 'default'
    default: return 'default'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return '已完成'
    case 'in_progress': return '进行中'
    case 'pending': return '待开始'
    default: return '未知'
  }
}

const getProgressPercentage = (row: any) => {
  return Math.round((row.completedSubtasks / row.totalSubtasks) * 100)
}

const getProgressTheme = (row: any): 'success' | 'warning' | undefined => {
  const percentage = getProgressPercentage(row)
  if (percentage === 100) return 'success'
  if (percentage >= 50) return 'warning'
  return undefined
}

const getProgressStatus = (row: any): 'success' | 'warning' | undefined => {
  const percentage = getProgressPercentage(row)
  if (percentage === 100) return 'success'
  if (percentage >= 50) return 'warning'
  return undefined
}

// 表格操作
const handleRowClick = (context: any) => {
  console.log('Row clicked:', context.row)
}

const openUploadDialog = (row: any) => {
  currentMerchant.value = row
  uploadContent.value = ''
  uploadFiles.value = []
  showUploadDialog.value = true
}

const canComplete = (row: any) => {
  return row.status === 'in_progress' && row.completedSubtasks > 0
}

const confirmComplete = async (row: any) => {
  try {
    // 找到该商家最新的子任务
    const latestSubtask = row.subtasks
      .filter((st: any) => st.status !== 'success')
      .sort((a: any, b: any) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime())[0]

    if (latestSubtask) {
      await confirmSubTask(latestSubtask.id, true)
      // 重新加载数据
      if (selectedTaskId.value) {
        await loadMerchantData(selectedTaskId.value)
      }
    }
  } catch (e) {
    console.error('Confirm complete failed:', e)
  }
}

const handleUploadConfirm = async () => {
  if (!currentMerchant.value || !uploadContent.value.trim()) {
    return
  }

  try {
    const submitterId = auth.user?.id || 0
    const payload: any = {
      task_id: selectedTaskId.value,
      submitter_id: submitterId,
      content: uploadContent.value,
      attachments: []
    }

    // 使用task_merchant_id
    if (currentMerchant.value.taskMerchantId) {
      payload.task_merchant_id = currentMerchant.value.taskMerchantId
    } else if (currentMerchant.value.merchant_id) {
      payload.merchant_id = currentMerchant.value.merchant_id
    }

    const resp = await submitSubTask(payload)
    const created = resp.data || {}
    const stId = created.id || created.subtask_id || created.data?.id

    // 处理文件上传
    if (uploadFiles.value.length > 0 && stId) {
      for (const file of uploadFiles.value) {
        if (file.raw) {
          const presign = await presignSubtaskAttachment(stId, {
            file_name: file.name,
            size: file.size,
            mime: file.type || 'application/octet-stream',
            biz_type: 'attachment'
          } as any)

          const p = presign.data
          const fd = new FormData()
          if (p.headers) Object.keys(p.headers).forEach(k => fd.append(k, p.headers[k]))
          fd.append('file', file.raw)

          await fetch(p.host, { method: 'POST', body: fd })
          await confirmSubtaskAttachment(stId, {
            key: p.key,
            file_name: file.name,
            size: file.size,
            mime: file.type || 'application/octet-stream'
          } as any)
        }
      }
    }

    showUploadDialog.value = false

    // 重新加载商家数据
    if (selectedTaskId.value) {
      await loadMerchantData(selectedTaskId.value)
    }
  } catch (e) {
    console.error('Upload failed', e)
  }
}

onMounted(() => {
  loadAssigned()
  loadManaged()
})
</script>

<style scoped>
.my-tasks-page {
  height: 100%;
}

.task-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.loading {
  text-align: center;
  padding: 40px;
}

/* 表格自适应样式 */
:deep(.t-table) {
  width: 100%;
}

:deep(.t-table__content) {
  overflow-x: auto;
}

:deep(.t-table-container) {
  width: 100%;
}

/* 商家名称列自适应 */
:deep(.t-table td:first-child) {
  max-width: none;
  word-break: break-word;
}
</style>
