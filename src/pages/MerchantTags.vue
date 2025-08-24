<template>
  <div class="merchant-tags-page">
    <div class="page-header">
      <h2>标签管理</h2>
      <div class="header-actions">
        <t-button theme="primary" @click="showCreateForm">
          <template #icon><add-icon /></template>
          新建标签
        </t-button>
        <t-button theme="default" @click="preloadBuiltinTags">
          <template #icon><download-icon /></template>
          预载内置标签
        </t-button>
      </div>
    </div>

    <!-- Tag List -->
    <div class="tag-list">
      <t-table
        :data="tags"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @page-change="handlePageChange"
        row-key="id"
        :selected-row-keys="selectedRowKeys"
        @select-change="handleSelectChange"
        select-on-row-click
      >
        <template #class="{ row }">
          {{ findClassLabel(row.class) }}
        </template>
        <template #status="{ row }">
          <t-tag :theme="row.deleted_at ? 'danger' : 'success'">
            {{ row.deleted_at ? '已删除' : '正常' }}
          </t-tag>
        </template>
        
        <template #actions="{ row }">
          <t-button theme="primary" variant="text" @click="editTag(row)">
            编辑
          </t-button>
          <t-button 
            v-if="!row.deleted_at"
            theme="danger" 
            variant="text" 
            @click="deleteTag(row)"
          >
            删除
          </t-button>
          <t-button 
            v-else
            theme="success" 
            variant="text" 
            @click="restoreTag(row)"
          >
            恢复
          </t-button>
        </template>
      </t-table>

      <!-- Batch Actions -->
      <div v-if="selectedRowKeys.length > 0" class="batch-actions">
        <div class="batch-info">
          已选择 <strong>{{ selectedRowKeys.length }}</strong> 个标签
        </div>
        <div class="batch-buttons">
          <t-button theme="danger" variant="outline" @click="batchDelete">
            <template #icon><delete-icon /></template>
            批量删除
          </t-button>
          <t-button theme="success" variant="outline" @click="batchRestore">
            <template #icon><refresh-icon /></template>
            批量恢复
          </t-button>
          <t-button theme="primary" variant="outline" @click="batchExport">
            <template #icon><download-icon /></template>
            导出选中
          </t-button>
          <t-button theme="default" variant="outline" @click="clearSelection">
            取消选择
          </t-button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <t-dialog
      v-model:visible="showModal"
      :title="isEditing ? '编辑标签' : '新建标签'"
      width="500px"
      @confirm="handleDialogConfirm"
      @cancel="handleCancel"
    >
      <t-form
        ref="formRef"
        :data="formData"
        :rules="formRules"
        label-width="100px"
        @submit="onSubmit"
      >
        <t-form-item label="标签名称" name="name">
          <t-input v-model:value="formData.name" placeholder="请输入标签名称" />
        </t-form-item>

        <t-form-item label="别名" name="alias">
          <t-input v-model:value="formData.alias" placeholder="请输入别名（可选）" />
        </t-form-item>

        <t-form-item label="分类" name="class">
          <t-select 
            v-model:value="formData.class" 
            :options="classOptions" 
            placeholder="请选择或输入新分类" 
            filterable
            creatable
            clearable
            @create="handleCreateClass"
          />
        </t-form-item>

        <t-form-item label="备注" name="remarks">
          <t-textarea v-model:value="formData.remarks" placeholder="请输入备注（可选）" />
        </t-form-item>
      </t-form>
    </t-dialog>

  <!-- (手动批量创建功能已移除) -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, onUnmounted } from 'vue'
import { Table, Button, Dialog, Form, FormItem, Input, Textarea, Tag, MessagePlugin, Select, DialogPlugin } from 'tdesign-vue-next'
import { AddIcon, DeleteIcon, RefreshIcon, DownloadIcon } from 'tdesign-icons-vue-next'
import { fetchTags, createTag, updateTag, deleteTag as deleteTagApi, batchCreateTags } from '../api/tag'
import { formatTagLabel } from '../utils/tags'
import type { Tag as TagType } from '../types'
import { formValidationRules } from '../utils/form-validation'
import { handleError } from '../utils/error-handler'
import { useAuthStore } from '../stores/auth'
import { http } from '../api/index'
import * as XLSX from 'xlsx'

const authStore = useAuthStore()
const tags = ref<TagType[]>([])
const loading = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const formRef = ref()
const selectedRowKeys = ref<number[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const formData = reactive({
  id: null as number | null,
  name: '',
  alias: '',
  class: '' as string,
  remarks: '',
})

// classOptions will be loaded from backend by extracting distinct `class` values from tags
const classOptions = ref<{ label: string; value: string }[]>([])

async function loadClassOptions() {
  try {
    const resp = await http.get('/merchant-tags/classes')
    if (resp.data && resp.data.data) {
      classOptions.value = resp.data.data
    } else {
      classOptions.value = []
    }
  } catch (err) {
    // fallback: leave classOptions empty (UI will handle)
    console.warn('loadClassOptions failed', err)
    classOptions.value = []
  }
}

function handleCreateClass(value: string | number) {
  // 当用户输入新分类时，自动添加到选项列表中
  const newOption = { label: String(value), value: String(value) }
  if (!classOptions.value.find(option => option.value === String(value))) {
    classOptions.value.push(newOption)
  }
  // 设置当前值为新创建的分类
  formData.class = String(value)
}

// TDesign Form 提交处理
function onSubmit({ validateResult, firstError }: any) {
  if (validateResult === true) {
    handleSubmit()
  } else {
    MessagePlugin.warning(firstError || '请检查表单输入')
  }
}

// 对话框确认按钮处理
function handleDialogConfirm() {
  // 触发表单提交和验证
  formRef.value?.submit()
}

const formRules = formValidationRules.tag

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 60 },
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'name', title: '标签名称' },
  { colKey: 'alias', title: '别名', width: 120 },
  { colKey: 'class', title: '分类', width: 160 },
  { colKey: 'remarks', title: '备注' },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'actions', title: '操作', width: 150 },
]

function findClassLabel(val: string | undefined) {
  if (!val) return ''
  const opt = classOptions.value.find(o => o.value === val)
  return opt?.label ?? String(val)
}

async function loadTags() {
  try {
    loading.value = true
    const response = await fetchTags({
      page: pagination.current,
      pageSize: pagination.pageSize,
      includeDeleted: true, // Show both active and deleted tags
    })
    
    if (Array.isArray(response)) {
      tags.value = response
      pagination.total = response.length
    } else {
      tags.value = response.items || []
      pagination.total = response.total || 0
    }
  } catch (error: any) {
    MessagePlugin.error('加载标签列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

function showCreateForm() {
  resetForm()
  isEditing.value = false
  showModal.value = true
}


function editTag(tag: TagType) {
  formData.id = tag.id
  formData.name = tag.name || ''
  formData.alias = tag.alias || ''
  formData.class = tag.class || ''
  formData.remarks = tag.remarks || ''
  isEditing.value = true
  showModal.value = true
}

async function handleSubmit() {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return

    const payload = {
      name: formData.name,
      alias: formData.alias,
      class: formData.class,
      remarks: formData.remarks,
    }

    if (isEditing.value && formData.id) {
      await updateTag(formData.id, payload)
      MessagePlugin.success('更新标签成功')
    } else {
      await createTag(payload)
      MessagePlugin.success('创建标签成功')
      // 新建后跳回第一页以确保能看到新建的数据
      pagination.current = 1
    }

    showModal.value = false
    await loadTags()
    // 重新加载分类选项，确保新的分类会显示在下拉列表中
    await loadClassOptions()
  } catch (error: any) {
    MessagePlugin.error('操作失败: ' + error.message)
  }
}

// manual batch create removed

function handleCancel() {
  showModal.value = false
  resetForm()
}

// manual batch create removed

function resetForm() {
  formData.id = null
  formData.name = ''
  formData.alias = ''
  formData.class = ''
  formData.remarks = ''
}

// 全局事件：从其它组件触发打开标签管理创建弹窗（可带初始 name）
function openTagManagerFromEvent(e: Event) {
  try {
    const ev = e as CustomEvent
    const detail = ev?.detail || {}
    resetForm()
    isEditing.value = false
    if (detail && detail.name) formData.name = String(detail.name)
    showModal.value = true
  } catch (err) {
    console.warn('openTagManagerFromEvent error', err)
    resetForm()
    isEditing.value = false
    showModal.value = true
  }
}

onMounted(() => {
  window.addEventListener('open-tag-manager', openTagManagerFromEvent as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('open-tag-manager', openTagManagerFromEvent as EventListener)
})

async function deleteTag(tag: TagType) {
  try {
    await deleteTagApi(tag.id)
    MessagePlugin.success('删除标签成功')
    await loadTags()
  } catch (error: any) {
    MessagePlugin.error('删除失败: ' + error.message)
  }
}

async function restoreTag(tag: TagType) {
  try {
    // Assuming there's a restore API endpoint
    await updateTag(tag.id, { deleted_at: null })
    MessagePlugin.success('恢复标签成功')
    await loadTags()
  } catch (error: any) {
    MessagePlugin.error('恢复失败: ' + error.message)
  }
}

function handleSelectChange(selectedKeys: number[]) {
  selectedRowKeys.value = selectedKeys
}

function clearSelection() {
  selectedRowKeys.value = []
}

function batchExport() {
  if (selectedRowKeys.value.length === 0) {
    MessagePlugin.warning('请先选择要导出的标签')
    return
  }
  
  try {
    // 获取选中的标签数据
    const selectedTags = tags.value.filter(tag => selectedRowKeys.value.includes(tag.id))
    
    // 准备Excel数据
    const excelData = selectedTags.map(tag => ({
      'ID': tag.id,
      // 使用 formatTagLabel 生成导出文件中的显示值，仍保留别名/分类为独立列
      '标签名称': formatTagLabel(tag) || tag.name || '',
      '别名': tag.alias || '',
      '分类': tag.class || '',
      '备注': tag.remarks || '',
      '状态': tag.deleted_at ? '已删除' : '正常',
      '创建时间': tag.created_at || '',
      '更新时间': tag.updated_at || ''
    }))
    
    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // 设置列宽
    const columnWidths = [
      { wch: 8 },   // ID
      { wch: 20 },  // 标签名称
      { wch: 15 },  // 别名
      { wch: 15 },  // 分类
      { wch: 30 },  // 备注
      { wch: 10 },  // 状态
      { wch: 20 },  // 创建时间
      { wch: 20 }   // 更新时间
    ]
    worksheet['!cols'] = columnWidths
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '标签数据')
    
    // 生成文件名
    const fileName = `标签导出_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
    
    // 导出文件
    XLSX.writeFile(workbook, fileName)
    
    MessagePlugin.success(`成功导出 ${selectedRowKeys.value.length} 个标签到 ${fileName}`)
  } catch (error: any) {
    MessagePlugin.error('导出失败: ' + error.message)
  }
}

// 预载内置标签
async function preloadBuiltinTags() {
  // 从给定的 select 中提取出的内置标签分组
  const groups: { cls: string; items: string[] }[] = [
    {
      cls: '有效时间',
      items: [
        'A：开门较晚，上午10点后拜访',
        'B：中午门店没有人',
        'C：关门时间较晚',
      ],
    },
    {
      cls: '交通情况',
      items: [
        'A：附近学校，中午傍晚绕行',
        'B：上午有集市，建议下午拜访',
        'C：麦收期间道路拥堵',
        'D：周边道路施工',
      ],
    },
    {
      cls: '固定事件',
      items: [
        'A：老人家在家，订货人特定时间在店内',
        'B：下午麻将场，建议上午拜访',
        'C：门店装修',
      ],
    },
    {
      cls: '终端类型',
      items: [
        'A：加盟终端',
        'B：现代终端',
        'C：普通终端',
      ],
    },
    {
      cls: '特殊时段',
      items: [
        'A：大学周边，寒暑假期间营业时间不固定',
        'B：农忙季节',
        'C：周期性集市',
      ],
    },
  ]

  // 询问确认，等待用户操作
  const confirmed = await new Promise<boolean>((resolve) => {
    DialogPlugin.confirm({
      header: '预载内置标签',
      body: `确定要预载 ${groups.reduce((s, g) => s + g.items.length, 0)} 个内置标签吗？`,
      theme: 'info',
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
  if (!confirmed) return

  // 构建批量创建数据：解析出 alias（代码）和 name（描述），class 使用分组名称
  const tagData = [] as any[]
  groups.forEach(g => {
    g.items.forEach(item => {
      // 尝试用中文冒号或英文冒号分割
      const parts = item.split(/：|:/)
      const alias = parts[0] ? parts[0].trim() : ''
      const name = parts[1] ? parts[1].trim() : item
      tagData.push({ name, alias, class: g.cls, remarks: '' })
    })
  })

  try {
    // 与批量创建相同的去重逻辑：若匹配已存在则更新，否则批量创建
    const toCreate: any[] = []
    const updatePromises: Promise<any>[] = []
    tagData.forEach(t => {
      const existing = tags.value.find(ex => ex.name === t.name || ex.alias === t.alias || ex.name === t.alias || ex.alias === t.name)
      const payload = { name: t.name, alias: t.alias, class: t.class, remarks: t.remarks }
      if (existing) updatePromises.push(updateTag(existing.id, payload))
      else toCreate.push(payload)
    })

    await Promise.all(updatePromises)
    if (toCreate.length > 0) await batchCreateTags(toCreate)
    MessagePlugin.success(`已预载：新增 ${toCreate.length} 个，更新 ${updatePromises.length} 个内置标签`)
    // 刷新列表和分类选项
    await loadTags()
    await loadClassOptions()
  } catch (err: any) {
    MessagePlugin.error('预载失败: ' + (err?.message || err))
  }
}

async function batchDelete() {
  if (selectedRowKeys.value.length === 0) {
    MessagePlugin.warning('请先选择要删除的标签')
    return
  }
  
  // 使用 DialogPlugin.confirm 显示确认对话框
  // 使用 DialogPlugin.confirm 并通过回调包装 Promise，确保等待用户确认或取消
  const confirmed = await new Promise<boolean>((resolve) => {
    DialogPlugin.confirm({
      header: '批量删除确认',
      body: `确定要删除选中的 ${selectedRowKeys.value.length} 个标签吗？`,
      theme: 'warning',
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })

  if (!confirmed) return
  
  try {
    await Promise.all(selectedRowKeys.value.map(id => deleteTagApi(id)))
    MessagePlugin.success(`批量删除 ${selectedRowKeys.value.length} 个标签成功`)
    selectedRowKeys.value = []
    await loadTags()
  } catch (error: any) {
    MessagePlugin.error('批量删除失败: ' + error.message)
  }
}

async function batchRestore() {
  if (selectedRowKeys.value.length === 0) {
    MessagePlugin.warning('请先选择要恢复的标签')
    return
  }
  
  // 使用 DialogPlugin.confirm 显示确认对话框
  // 使用 DialogPlugin.confirm 并通过回调包装 Promise，确保等待用户确认或取消
  const confirmed = await new Promise<boolean>((resolve) => {
    DialogPlugin.confirm({
      header: '批量恢复确认',
      body: `确定要恢复选中的 ${selectedRowKeys.value.length} 个标签吗？`,
      theme: 'info',
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })

  if (!confirmed) return
  
  try {
    await Promise.all(selectedRowKeys.value.map(id => updateTag(id, { deleted_at: null })))
    MessagePlugin.success(`批量恢复 ${selectedRowKeys.value.length} 个标签成功`)
    selectedRowKeys.value = []
    await loadTags()
  } catch (error: any) {
    MessagePlugin.error('批量恢复失败: ' + error.message)
  }
}

function handlePageChange(pageInfo: any) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  loadTags()
}

onMounted(() => {
  ;(async () => {
    await loadClassOptions()
    await loadTags()
  })()
})
</script>

<style scoped>
.merchant-tags-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.tag-list {
  background: white;
  border-radius: 8px;
  padding: 24px;
}

.batch-actions {
  margin-top: 16px;
  padding: 16px;
  background: #f0f7ff;
  border: 1px solid #d0e5ff;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.batch-info {
  font-size: 14px;
  color: #555;
}

.batch-info strong {
  color: #0052d9;
  font-weight: 600;
}

.batch-buttons {
  display: flex;
  gap: 12px;
}

.batch-form p {
  margin-bottom: 8px;
  color: #666;
}

.batch-form ul {
  margin-bottom: 16px;
  padding-left: 20px;
  color: #666;
}
</style>