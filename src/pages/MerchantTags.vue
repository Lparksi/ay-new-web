<template>
  <div class="merchant-tags-page">
    <div class="page-header">
      <h2>标签管理</h2>
      <div class="header-actions">
        <t-button theme="primary" @click="showCreateForm">
          <template #icon><add-icon /></template>
          新建标签
        </t-button>
        <t-button theme="default" @click="showBatchCreateForm">
          <template #icon><add-icon /></template>
          批量创建
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
      >
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
        <t-button theme="danger" @click="batchDelete">
          批量删除 ({{ selectedRowKeys.length }})
        </t-button>
        <t-button theme="success" @click="batchRestore">
          批量恢复 ({{ selectedRowKeys.length }})
        </t-button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <t-dialog
      v-model:visible="showModal"
      :title="isEditing ? '编辑标签' : '新建标签'"
      width="500px"
      @confirm="handleSubmit"
      @cancel="handleCancel"
    >
      <t-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <t-form-item label="标签名称" name="name">
          <t-input v-model:value="formData.name" placeholder="请输入标签名称" />
        </t-form-item>
        
        <t-form-item label="标签颜色" name="color">
          <t-input v-model:value="formData.color" placeholder="请输入颜色代码，如 #FF0000" />
        </t-form-item>
        
        <t-form-item label="描述" name="description">
          <t-textarea v-model:value="formData.description" placeholder="请输入标签描述" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- Batch Create Modal -->
    <t-dialog
      v-model:visible="showBatchModal"
      title="批量创建标签"
      width="600px"
      @confirm="handleBatchSubmit"
      @cancel="handleBatchCancel"
    >
      <div class="batch-form">
        <p>每行一个标签名称，支持格式：</p>
        <ul>
          <li>标签名称</li>
          <li>标签名称,#颜色代码</li>
          <li>标签名称,#颜色代码,描述</li>
        </ul>
        <t-textarea
          v-model:value="batchText"
          placeholder="示例：&#10;餐饮&#10;零售,#FF0000&#10;服务,#00FF00,服务行业标签"
          :autosize="{ minRows: 6, maxRows: 12 }"
        />
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Table, Button, Dialog, Form, FormItem, Input, Textarea, Tag, MessagePlugin } from 'tdesign-vue-next'
import { AddIcon } from 'tdesign-icons-vue-next'
import { fetchTags, createTag, updateTag, deleteTag as deleteTagApi, batchCreateTags } from '../api/tag'
import type { Tag as TagType } from '../types'
import { formValidationRules } from '../utils/form-validation'
import { handleError } from '../utils/error-handler'

const tags = ref<TagType[]>([])
const loading = ref(false)
const showModal = ref(false)
const showBatchModal = ref(false)
const isEditing = ref(false)
const formRef = ref()
const selectedRowKeys = ref<number[]>([])
const batchText = ref('')

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const formData = reactive({
  id: null as number | null,
  name: '',
  color: '',
  description: '',
})

const formRules = formValidationRules.tag

const columns = [
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'name', title: '标签名称' },
  { colKey: 'color', title: '颜色', width: 100 },
  { colKey: 'description', title: '描述' },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'actions', title: '操作', width: 150 },
]

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

function showBatchCreateForm() {
  batchText.value = ''
  showBatchModal.value = true
}

function editTag(tag: TagType) {
  formData.id = tag.id
  formData.name = tag.name || ''
  formData.color = tag.color || ''
  formData.description = tag.description || ''
  isEditing.value = true
  showModal.value = true
}

async function handleSubmit() {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return

    const payload = {
      name: formData.name,
      color: formData.color,
      description: formData.description,
    }

    if (isEditing.value && formData.id) {
      await updateTag(formData.id, payload)
      MessagePlugin.success('更新标签成功')
    } else {
      await createTag(payload)
      MessagePlugin.success('创建标签成功')
    }

    showModal.value = false
    await loadTags()
  } catch (error: any) {
    MessagePlugin.error('操作失败: ' + error.message)
  }
}

async function handleBatchSubmit() {
  try {
    if (!batchText.value.trim()) {
      MessagePlugin.warning('请输入标签内容')
      return
    }

    const lines = batchText.value.trim().split('\n')
    const tagData = lines.map(line => {
      const parts = line.split(',').map(p => p.trim())
      return {
        name: parts[0],
        color: parts[1] || '',
        description: parts[2] || '',
      }
    }).filter(tag => tag.name)

    if (tagData.length === 0) {
      MessagePlugin.warning('没有有效的标签数据')
      return
    }

    await batchCreateTags(tagData)
    MessagePlugin.success(`批量创建 ${tagData.length} 个标签成功`)
    
    showBatchModal.value = false
    await loadTags()
  } catch (error: any) {
    MessagePlugin.error('批量创建失败: ' + error.message)
  }
}

function handleCancel() {
  showModal.value = false
  resetForm()
}

function handleBatchCancel() {
  showBatchModal.value = false
  batchText.value = ''
}

function resetForm() {
  formData.id = null
  formData.name = ''
  formData.color = ''
  formData.description = ''
}

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

async function batchDelete() {
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
  loadTags()
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
  background: #f5f5f5;
  border-radius: 4px;
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