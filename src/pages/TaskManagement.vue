<template>
  <div class="task-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>我的任务</h2>
      <t-space>
        <t-button variant="outline" @click="loadData">
          <template #icon>
            <refresh-icon />
          </template>
          刷新
        </t-button>
      </t-space>
    </div>

    <!-- 任务商户列表 -->
    <t-table
      :data="taskMerchants"
      :columns="columns"
      :loading="loading"
      row-key="id"
    >
      <!-- 商户信息 -->
      <template #merchant="{ row }">
        <div class="merchant-info">
          <div class="merchant-name">{{ row.merchant?.legal_name || '未知商户' }}</div>
          <div class="merchant-address">{{ row.merchant?.address || '地址未知' }}</div>
          <div class="merchant-phone" v-if="row.merchant?.phone">{{ row.merchant.phone }}</div>
        </div>
      </template>

      <!-- 任务信息 -->
      <template #task="{ row }">
        <div class="task-info">
          <div class="task-name">{{ row.task?.task_name || '未知任务' }}</div>
          <t-tag :theme="getTaskTypeTheme(row.task?.type)" size="small">
            {{ getTaskTypeLabel(row.task?.type) }}
          </t-tag>
        </div>
      </template>

      <!-- 进度 -->
      <template #progress="{ row }">
        <div class="progress-info">
          <t-progress
            :percentage="getProgressPercentage(row)"
            :theme="getProgressTheme(row)"
            size="small"
          />
          <div class="progress-text">
            {{ row.completed_subtask_count || 0 }} / {{ row.target_subtask_count || 1 }}
          </div>
        </div>
      </template>

      <!-- 状态 -->
      <template #status="{ row }">
        <t-tag :theme="getStatusTheme(row.status)" size="small">
          {{ getStatusLabel(row.status) }}
        </t-tag>
      </template>

      <!-- 操作 -->
      <template #actions="{ row }">
        <t-space>
          <t-button
            theme="primary"
            size="small"
            @click="openSubmitDialog(row)"
            :disabled="row.status === 'completed'"
          >
            提交任务
          </t-button>
          <t-button
            variant="outline"
            size="small"
            @click="openEditMerchantDialog(row)"
          >
            编辑商户
          </t-button>
          <t-button
            variant="text"
            size="small"
            @click="refreshMerchantInfo(row)"
          >
            刷新商户
          </t-button>
        </t-space>
      </template>
    </t-table>

    <!-- 提交任务对话框 -->
    <t-dialog
      v-model:visible="submitDialogVisible"
      header="提交任务"
      width="600px"
      @confirm="submitTask"
      @cancel="cancelSubmit"
    >
      <div class="submit-form" v-if="currentTaskMerchant">
        <div class="merchant-summary">
          <h4>商户信息</h4>
          <p><strong>商户名称：</strong>{{ currentTaskMerchant.merchant?.legal_name }}</p>
          <p><strong>地址：</strong>{{ currentTaskMerchant.merchant?.address }}</p>
          <p><strong>任务：</strong>{{ currentTaskMerchant.task?.task_name }}</p>
        </div>

        <t-form :data="submitForm" label-width="80px">
          <t-form-item label="任务内容" name="content">
            <t-textarea
              v-model="submitForm.content"
              placeholder="请描述任务完成情况..."
              :maxlength="500"
              show-limit
              :autosize="{ minRows: 3, maxRows: 6 }"
            />
          </t-form-item>

          <t-form-item label="完成状态" name="client_mark">
            <t-radio-group v-model="submitForm.client_mark">
              <t-radio value="completed">已完成</t-radio>
              <t-radio value="failed">未完成</t-radio>
              <t-radio value="other">其他</t-radio>
            </t-radio-group>
          </t-form-item>

          <t-form-item label="上传文件" name="files">
            <t-upload
              v-model="submitForm.files"
              multiple
              :max="5"
              accept="image/*,.pdf,.doc,.docx,.txt"
              @success="onUploadSuccess"
              @error="onUploadError"
            >
              <t-button variant="outline">
                <template #icon>
                  <upload-icon />
                </template>
                选择文件
              </t-button>
              <template #tips>
                <div class="upload-tips">
                  支持图片、PDF、Word文档等格式，最多5个文件
                </div>
              </template>
            </t-upload>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>

    <!-- 编辑商户信息对话框 -->
    <t-dialog
      v-model:visible="editMerchantDialogVisible"
      header="编辑商户信息"
      width="600px"
      @confirm="updateMerchantInfo"
      @cancel="cancelEditMerchant"
    >
      <div class="edit-merchant-form" v-if="editingMerchant">
        <t-form :data="merchantForm" label-width="100px" ref="merchantFormRef">
          <t-form-item label="商户名称" name="legal_name" required>
            <t-input
              v-model="merchantForm.legal_name"
              placeholder="请输入商户名称"
              clearable
            />
          </t-form-item>

          <t-form-item label="联系电话" name="phone">
            <t-input
              v-model="merchantForm.phone"
              placeholder="请输入联系电话"
              clearable
            />
          </t-form-item>

          <t-form-item label="详细地址" name="address" required>
            <t-textarea
              v-model="merchantForm.address"
              placeholder="请输入详细地址"
              :maxlength="200"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </t-form-item>

          <t-form-item label="城市" name="city">
            <t-input
              v-model="merchantForm.city"
              placeholder="请输入城市"
              clearable
            />
          </t-form-item>

          <t-form-item label="商圈" name="area">
            <t-select
              v-model="merchantForm.area"
              placeholder="请选择商圈类型"
              clearable
            >
              <t-option value="居民区" label="居民区" />
              <t-option value="商业（集贸）区" label="商业（集贸）区" />
              <t-option value="其他" label="其他" />
            </t-select>
          </t-form-item>

          <t-form-item label="坐标信息" name="coordinates" v-if="merchantForm.lng && merchantForm.lat">
            <div class="coordinates-display">
              <t-tag theme="primary" variant="light" size="small">
                经度: {{ merchantForm.lng.toFixed(6) }}
              </t-tag>
              <t-tag theme="primary" variant="light" size="small" style="margin-left: 8px;">
                纬度: {{ merchantForm.lat.toFixed(6) }}
              </t-tag>
            </div>
          </t-form-item>
        </t-form>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { RefreshIcon, UploadIcon } from 'tdesign-icons-vue-next'
import { fetchTasksPaged, fetchTaskMerchants } from '../api/task'
import { submitSubTask } from '../api/subtask'
import { fetchMerchants } from '../api/merchant'
import type { TaskMerchant, Merchant } from '../types'

// 数据状态
const taskMerchants = ref<TaskMerchant[]>([])
const loading = ref(false)
const submitDialogVisible = ref(false)
const editMerchantDialogVisible = ref(false)
const currentTaskMerchant = ref<TaskMerchant | null>(null)
const editingMerchant = ref<any>(null)
const merchantFormRef = ref()

// 提交表单
const submitForm = reactive({
  content: '',
  client_mark: 'completed' as 'completed' | 'failed' | 'other',
  files: [] as any[]
})

// 商户编辑表单
const merchantForm = reactive({
  id: null as number | null,
  legal_name: '',
  phone: '',
  address: '',
  city: '',
  area: '',
  lng: null as number | null,
  lat: null as number | null
})

// 表格列定义
const columns = [
  {
    colKey: 'merchant',
    title: '商户信息',
    width: 250
  },
  {
    colKey: 'task',
    title: '任务信息',
    width: 200
  },
  {
    colKey: 'progress',
    title: '完成进度',
    width: 150
  },
  {
    colKey: 'status',
    title: '状态',
    width: 100
  },
  {
    colKey: 'last_submit_at',
    title: '最后提交',
    width: 150,
    cell: (h: any, { row }: any) => formatDateTime(row.last_submit_at)
  },
  {
    colKey: 'actions',
    title: '操作',
    width: 180,
    fixed: 'right'
  }
]

// 加载数据
async function loadData() {
  try {
    loading.value = true
    
    // 获取分配给当前用户的任务
    const tasksResp = await fetchTasksPaged({})
    
    if (tasksResp && tasksResp.items) {
      // 获取每个任务的商户列表
      const allTaskMerchants: TaskMerchant[] = []
      
      for (const task of tasksResp.items) {
        if (task.id) {
          try {
            const merchantsResp = await fetchTaskMerchants(task.id)
            
            if (merchantsResp && merchantsResp.items) {
              // 获取所有商户ID
              const merchantIds = merchantsResp.items.map((tm: any) => tm.merchant_id).filter(Boolean)
              
              // 批量获取商户信息
              let merchantsMap: Record<number, Merchant> = {}
              if (merchantIds.length > 0) {
                try {
                  const merchantsData = await fetchMerchants({})
                  const merchants = Array.isArray(merchantsData) ? merchantsData : merchantsData.items || []
                  merchantsMap = merchants.reduce((map: Record<number, Merchant>, merchant: Merchant) => {
                    if (merchant.id) {
                      map[merchant.id] = merchant
                    }
                    return map
                  }, {})
                } catch (error) {
                  console.warn('Failed to fetch merchants:', error)
                }
              }
              
              const taskMerchantsWithTask = merchantsResp.items.map((tm: any) => {
                let merchant = tm.merchant || merchantsMap[tm.merchant_id]
                
                // 如果仍然没有商户信息，创建一个默认的
                if (!merchant) {
                  merchant = {
                    id: tm.merchant_id,
                    legal_name: `商户${tm.merchant_id}`,
                    address: '地址信息获取失败',
                    phone: ''
                  }
                }
                
                return {
                  id: tm.id || Math.random(),
                  task_id: tm.task_id || task.id,
                  merchant_id: tm.merchant_id || 0,
                  target_subtask_count: tm.target_subtask_count || 1,
                  completed_subtask_count: tm.completed_subtask_count || 0,
                  status: tm.status || 'pending',
                  last_submit_at: tm.last_submit_at,
                  task,
                  merchant
                }
              })
              allTaskMerchants.push(...taskMerchantsWithTask)
            }
          } catch (error) {
            console.warn(`Failed to load merchants for task ${task.id}:`, error)
          }
        }
      }
      
      taskMerchants.value = allTaskMerchants
      console.log('加载的任务商户数据:', allTaskMerchants)
    } else {
      // 如果没有数据，创建一些示例数据用于测试
      taskMerchants.value = [
        {
          id: 1,
          task_id: 1,
          merchant_id: 1,
          target_subtask_count: 2,
          completed_subtask_count: 0,
          status: 'pending',
          last_submit_at: null,
          task: {
            id: 1,
            task_name: '商户拜访任务',
            type: 'visit'
          },
          merchant: {
            id: 1,
            legal_name: '示例商户A',
            address: '北京市朝阳区示例街道123号',
            phone: '13800138001'
          }
        },
        {
          id: 2,
          task_id: 1,
          merchant_id: 2,
          target_subtask_count: 1,
          completed_subtask_count: 1,
          status: 'completed',
          last_submit_at: new Date().toISOString(),
          task: {
            id: 1,
            task_name: '商户拜访任务',
            type: 'visit'
          },
          merchant: {
            id: 2,
            legal_name: '示例商户B',
            address: '上海市浦东新区示例路456号',
            phone: '13800138002'
          }
        }
      ] as TaskMerchant[]
    }
  } catch (error) {
    console.error('加载任务列表失败:', error)
    MessagePlugin.error('加载任务列表失败')
    // 提供示例数据
    taskMerchants.value = [
      {
        id: 1,
        task_id: 1,
        merchant_id: 1,
        target_subtask_count: 2,
        completed_subtask_count: 0,
        status: 'pending',
        last_submit_at: null,
        task: {
          id: 1,
          task_name: '商户拜访任务',
          type: 'visit'
        },
        merchant: {
          id: 1,
          legal_name: '示例商户A',
          address: '北京市朝阳区示例街道123号',
          phone: '13800138001'
        }
      }
    ] as TaskMerchant[]
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  loadData()
})

// 打开提交对话框
function openSubmitDialog(taskMerchant: TaskMerchant) {
  currentTaskMerchant.value = taskMerchant
  submitForm.content = ''
  submitForm.client_mark = 'completed'
  submitForm.files = []
  submitDialogVisible.value = true
}

// 提交任务
async function submitTask() {
  if (!currentTaskMerchant.value) return
  
  if (!submitForm.content.trim()) {
    MessagePlugin.warning('请填写任务内容')
    return
  }
  
  try {
    const payload = {
      task_id: currentTaskMerchant.value.task_id,
      task_merchant_id: currentTaskMerchant.value.id,
      merchant_id: currentTaskMerchant.value.merchant_id,
      submitter_id: getCurrentUserId(),
      content: submitForm.content,
      client_mark: submitForm.client_mark,
      submitted_at: new Date().toISOString(),
      attachments: submitForm.files.map((file: any) => ({
        url: file.response?.url || file.url || '',
        type: file.type || 'file',
        meta_json: JSON.stringify({
          name: file.name,
          size: file.size
        })
      }))
    }
    
    await submitSubTask(payload)
    MessagePlugin.success('任务提交成功')
    submitDialogVisible.value = false
    
    // 更新本地数据
    const index = taskMerchants.value.findIndex(tm => tm.id === currentTaskMerchant.value?.id)
    if (index !== -1) {
      taskMerchants.value[index].completed_subtask_count = (taskMerchants.value[index].completed_subtask_count || 0) + 1
      taskMerchants.value[index].last_submit_at = new Date().toISOString()
      if (taskMerchants.value[index].completed_subtask_count >= taskMerchants.value[index].target_subtask_count) {
        taskMerchants.value[index].status = 'completed'
      } else {
        taskMerchants.value[index].status = 'in_progress'
      }
    }
    
    // 重置表单
    submitForm.content = ''
    submitForm.client_mark = 'completed'
    submitForm.files = []
  } catch (error) {
    console.error('提交任务失败:', error)
    MessagePlugin.error('提交任务失败')
  }
}

// 获取当前用户ID的辅助函数
function getCurrentUserId(): number {
  // 这里应该从用户状态或token中获取用户ID
  // 暂时返回1作为默认值
  return 1
}

// 取消提交
function cancelSubmit() {
  submitDialogVisible.value = false
  currentTaskMerchant.value = null
}

// 打开编辑商户对话框
function openEditMerchantDialog(taskMerchant: TaskMerchant) {
  if (!taskMerchant.merchant) {
    MessagePlugin.warning('商户信息不完整，无法编辑')
    return
  }
  
  editingMerchant.value = taskMerchant
  
  // 填充表单数据
  merchantForm.id = taskMerchant.merchant.id
  merchantForm.legal_name = taskMerchant.merchant.legal_name || ''
  merchantForm.phone = taskMerchant.merchant.phone || ''
  merchantForm.address = taskMerchant.merchant.address || ''
  merchantForm.city = taskMerchant.merchant.city || ''
  merchantForm.area = taskMerchant.merchant.area || ''
  merchantForm.lng = taskMerchant.merchant.lng || null
  merchantForm.lat = taskMerchant.merchant.lat || null
  
  editMerchantDialogVisible.value = true
}

// 更新商户信息
async function updateMerchantInfo() {
  if (!editingMerchant.value || !merchantForm.id) return
  
  // 基本验证
  if (!merchantForm.legal_name.trim()) {
    MessagePlugin.warning('请输入商户名称')
    return
  }
  
  if (!merchantForm.address.trim()) {
    MessagePlugin.warning('请输入详细地址')
    return
  }
  
  try {
    const { updateMerchant } = await import('../api/merchant')
    
    const updateData = {
      legal_name: merchantForm.legal_name,
      phone: merchantForm.phone,
      address: merchantForm.address,
      city: merchantForm.city,
      area: merchantForm.area,
      lng: merchantForm.lng,
      lat: merchantForm.lat
    }
    
    await updateMerchant(merchantForm.id, updateData)
    MessagePlugin.success('商户信息更新成功')
    
    // 更新本地数据
    const taskMerchantIndex = taskMerchants.value.findIndex(tm => tm.id === editingMerchant.value?.id)
    if (taskMerchantIndex !== -1 && taskMerchants.value[taskMerchantIndex].merchant) {
      Object.assign(taskMerchants.value[taskMerchantIndex].merchant!, updateData)
    }
    
    editMerchantDialogVisible.value = false
    editingMerchant.value = null
  } catch (error) {
    console.error('更新商户信息失败:', error)
    MessagePlugin.error('更新商户信息失败')
  }
}

// 取消编辑商户
function cancelEditMerchant() {
  editMerchantDialogVisible.value = false
  editingMerchant.value = null
  
  // 重置表单
  merchantForm.id = null
  merchantForm.legal_name = ''
  merchantForm.phone = ''
  merchantForm.address = ''
  merchantForm.city = ''
  merchantForm.area = ''
  merchantForm.lng = null
  merchantForm.lat = null
}

// 刷新单个商户信息
async function refreshMerchantInfo(taskMerchant: TaskMerchant) {
  if (!taskMerchant.merchant_id) {
    MessagePlugin.warning('商户ID不存在，无法刷新')
    return
  }
  
  try {
    const { fetchMerchant } = await import('../api/merchant')
    const updatedMerchant = await fetchMerchant(taskMerchant.merchant_id)
    
    // 更新本地数据
    const index = taskMerchants.value.findIndex(tm => tm.id === taskMerchant.id)
    if (index !== -1) {
      taskMerchants.value[index].merchant = updatedMerchant
    }
    
    MessagePlugin.success('商户信息刷新成功')
  } catch (error) {
    console.error('刷新商户信息失败:', error)
    MessagePlugin.error('刷新商户信息失败')
  }
}



// 上传成功回调
function onUploadSuccess(context: any) {
  MessagePlugin.success('文件上传成功')
}

// 上传失败回调
function onUploadError(context: any) {
  MessagePlugin.error('文件上传失败')
}

// 工具函数
function getProgressPercentage(taskMerchant: TaskMerchant): number {
  const target = taskMerchant.target_subtask_count || 1
  const completed = taskMerchant.completed_subtask_count || 0
  return Math.round((completed / target) * 100)
}

function getProgressTheme(taskMerchant: TaskMerchant): string {
  const percentage = getProgressPercentage(taskMerchant)
  if (percentage === 100) return 'success'
  if (percentage >= 50) return 'warning'
  return 'default'
}

function getTaskTypeTheme(type?: string): string {
  switch (type) {
    case 'visit': return 'primary'
    case 'survey': return 'success'
    case 'audit': return 'warning'
    case 'onboarding': return 'default'
    default: return 'default'
  }
}

function getTaskTypeLabel(type?: string): string {
  switch (type) {
    case 'visit': return '拜访'
    case 'survey': return '调研'
    case 'audit': return '审核'
    case 'onboarding': return '入驻'
    default: return '未知'
  }
}

function getStatusTheme(status: string): string {
  switch (status) {
    case 'pending': return 'default'
    case 'in_progress': return 'warning'
    case 'completed': return 'success'
    case 'cancelled': return 'danger'
    default: return 'default'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return '待处理'
    case 'in_progress': return '进行中'
    case 'completed': return '已完成'
    case 'cancelled': return '已取消'
    default: return '未知'
  }
}

function getClientMarkTheme(mark?: string): string {
  switch (mark) {
    case 'completed': return 'success'
    case 'failed': return 'danger'
    case 'other': return 'default'
    default: return 'default'
  }
}

function getClientMarkLabel(mark?: string): string {
  switch (mark) {
    case 'completed': return '已完成'
    case 'failed': return '未完成'
    case 'other': return '其他'
    default: return '未知'
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '无'
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<style scoped>
.task-management-page {
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

.merchant-info {
  line-height: 1.5;
}

.merchant-name {
  font-weight: 600;
  color: #1f2937;
}

.merchant-address {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.merchant-phone {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-name {
  font-weight: 500;
  color: #1f2937;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.submit-form {
  padding: 16px 0;
}

.merchant-summary {
  background: #f9fafb;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 24px;
}

.merchant-summary h4 {
  margin: 0 0 12px 0;
  color: #1f2937;
}

.merchant-summary p {
  margin: 4px 0;
  color: #6b7280;
}

.upload-tips {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.task-detail {
  padding: 16px 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.edit-merchant-form {
  padding: 16px 0;
}

.coordinates-display {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>