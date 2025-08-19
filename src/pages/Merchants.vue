<template>
  <div class="merchants-page">
    <div class="page-header">
      <h2>商家管理</h2>
      <t-button theme="primary" @click="showCreateForm">
        <template #icon><add-icon /></template>
        新建商家
      </t-button>
    </div>

    <!-- Merchant List -->
    <div class="merchant-list">
      <t-table
        :data="merchants"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        @page-change="handlePageChange"
      >
        <template #actions="{ row }">
          <t-button theme="primary" variant="text" @click="editMerchant(row)">
            编辑
          </t-button>
          <t-button theme="danger" variant="text" @click="deleteMerchant(row)">
            删除
          </t-button>
        </template>
      </t-table>
    </div>

    <!-- Create/Edit Modal -->
    <t-dialog
      v-model:visible="showModal"
      :title="isEditing ? '编辑商家' : '新建商家'"
      width="600px"
      @confirm="handleSubmit"
      @cancel="handleCancel"
    >
      <t-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <t-form-item label="商家名称" name="name">
          <t-input v-model:value="formData.name" placeholder="请输入商家名称" />
        </t-form-item>
        
        <t-form-item label="联系电话" name="phone">
          <t-input v-model:value="formData.phone" placeholder="请输入联系电话" />
        </t-form-item>
        
        <t-form-item label="地址" name="address">
          <t-input v-model:value="formData.address" placeholder="请输入地址" />
        </t-form-item>
        
        <t-form-item label="关联标签" name="tags">
          <tag-select v-model="formData.tags" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Table, Button, Dialog, Form, FormItem, Input, MessagePlugin } from 'tdesign-vue-next'
import { AddIcon } from 'tdesign-icons-vue-next'
import TagSelect from '../components/Selectors/TagSelect.vue'
import { fetchMerchants, createMerchant, updateMerchant, deleteMerchant as deleteMerchantApi } from '../api/merchant'
import type { Merchant } from '../types'
import { formValidationRules } from '../utils/form-validation'
import { handleError } from '../utils/error-handler'

const merchants = ref<Merchant[]>([])
const loading = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const formRef = ref()

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const formData = reactive({
  id: null as number | null,
  name: '',
  phone: '',
  address: '',
  tags: [] as number[],
})

const formRules = formValidationRules.merchant

const columns = [
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'name', title: '商家名称' },
  { colKey: 'phone', title: '联系电话' },
  { colKey: 'address', title: '地址' },
  { colKey: 'actions', title: '操作', width: 150 },
]

async function loadMerchants() {
  try {
    loading.value = true
    const response = await fetchMerchants({
      page: pagination.current,
      pageSize: pagination.pageSize,
    })
    
    if (Array.isArray(response)) {
      merchants.value = response
      pagination.total = response.length
    } else {
      merchants.value = response.items || []
      pagination.total = response.total || 0
    }
  } catch (error: any) {
    handleError(error)
  } finally {
    loading.value = false
  }
}

function showCreateForm() {
  resetForm()
  isEditing.value = false
  showModal.value = true
}

function editMerchant(merchant: Merchant) {
  formData.id = merchant.id
  formData.name = merchant.name || ''
  formData.phone = merchant.phone || ''
  formData.address = merchant.address || ''
  formData.tags = merchant.tags || []
  isEditing.value = true
  showModal.value = true
}

async function handleSubmit() {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return

    const payload = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      tags: formData.tags,
    }

    if (isEditing.value && formData.id) {
      await updateMerchant(formData.id, payload)
      MessagePlugin.success('更新商家成功')
    } else {
      await createMerchant(payload)
      MessagePlugin.success('创建商家成功')
    }

    showModal.value = false
    await loadMerchants()
  } catch (error: any) {
    handleError(error)
  }
}

function handleCancel() {
  showModal.value = false
  resetForm()
}

function resetForm() {
  formData.id = null
  formData.name = ''
  formData.phone = ''
  formData.address = ''
  formData.tags = []
}

async function deleteMerchant(merchant: Merchant) {
  try {
    await deleteMerchantApi(merchant.id)
    MessagePlugin.success('删除商家成功')
    await loadMerchants()
  } catch (error: any) {
    handleError(error)
  }
}

function handlePageChange(pageInfo: any) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  loadMerchants()
}

onMounted(() => {
  loadMerchants()
})
</script>

<style scoped>
.merchants-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.merchant-list {
  background: white;
  border-radius: 8px;
  padding: 24px;
}
</style>