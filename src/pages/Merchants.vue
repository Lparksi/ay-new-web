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
        <t-form-item label="法人姓名" name="legal_name">
          <t-input v-model:value="formData.legal_name" placeholder="请输入法人姓名" />
        </t-form-item>
        
        <t-form-item label="联系电话" name="phone">
          <t-input v-model:value="formData.phone" placeholder="请输入联系电话（可选）" />
        </t-form-item>
        
        <t-form-item label="城市" name="city">
          <t-input v-model:value="formData.city" placeholder="请输入城市（默认：安阳市）" />
        </t-form-item>
        
        <t-form-item label="地址" name="address">
          <div class="address-input-group">
            <t-input 
              v-model:value="formData.address" 
              placeholder="请输入详细地址" 
              style="flex: 1;"
            />
            <t-button 
              theme="primary" 
              variant="outline"
              :loading="geocoding"
              @click="convertAddressToCoordinates"
              style="margin-left: 8px;"
            >
              {{ geocoding ? '转换中...' : '转换为经纬度' }}
            </t-button>
          </div>
        </t-form-item>
        
        <t-form-item label="经纬度" name="coordinates" v-if="formData.lng && formData.lat">
          <div class="coordinates-display">
            <t-tag theme="success" variant="light">
              经度: {{ formData.lng.toFixed(6) }}
            </t-tag>
            <t-tag theme="success" variant="light" style="margin-left: 8px;">
              纬度: {{ formData.lat.toFixed(6) }}
            </t-tag>
            <t-tag 
              :theme="getAccuracyTheme(formData.geocode_score)" 
              variant="light" 
              style="margin-left: 8px;"
              v-if="formData.geocode_description"
            >
              {{ formData.geocode_description }}
            </t-tag>
          </div>
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
import { Table, Button, Dialog, Form, FormItem, Input, MessagePlugin, Tag } from 'tdesign-vue-next'
import { AddIcon } from 'tdesign-icons-vue-next'
import TagSelect from '../components/Selectors/TagSelect.vue'
import { fetchMerchants, createMerchant, updateMerchant, deleteMerchant as deleteMerchantApi } from '../api/merchant'
import { geocode } from '../api/geocode'
import type { Merchant } from '../types'
import { formValidationRules } from '../utils/form-validation'
import { handleError } from '../utils/error-handler'

const merchants = ref<Merchant[]>([])
const loading = ref(false)
const geocoding = ref(false)
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
  legal_name: '',
  phone: '',
  address: '',
  city: '安阳市', // 默认值
  area: '',
  lng: null as number | null,
  lat: null as number | null,
  geocode_level: '',
  geocode_score: null as number | null,
  geocode_description: '',
  tags: [] as number[],
})

const formRules = formValidationRules.merchant

const columns = [
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'legal_name', title: '法人姓名' },
  { colKey: 'phone', title: '联系电话' },
  { colKey: 'address', title: '地址' },
  { 
    colKey: 'coordinates', 
    title: '经纬度', 
    width: 180,
    cell: (h: any, { row }: { row: Merchant }) => {
      if (row.lng && row.lat) {
        return h('div', { class: 'coordinates-cell' }, [
          h('div', { class: 'coordinate-item' }, `经: ${row.lng.toFixed(4)}`),
          h('div', { class: 'coordinate-item' }, `纬: ${row.lat.toFixed(4)}`),
          row.geocode_description ? h('div', { 
            class: `accuracy-badge accuracy-${getAccuracyTheme(row.geocode_score)}` 
          }, row.geocode_description) : null
        ])
      }
      return h('span', { class: 'text-placeholder' }, '未设置')
    }
  },
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
  formData.legal_name = merchant.legal_name || ''
  formData.phone = merchant.phone || ''
  formData.address = merchant.address || ''
  formData.city = merchant.city || '安阳市'
  formData.area = merchant.area || ''
  formData.lng = merchant.lng || null
  formData.lat = merchant.lat || null
  formData.geocode_level = merchant.geocode_level || ''
  formData.geocode_score = merchant.geocode_score || null
  formData.geocode_description = merchant.geocode_description || ''
  formData.tags = merchant.tags || []
  isEditing.value = true
  showModal.value = true
}

async function handleSubmit() {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return

    const payload: Partial<Merchant> = {
      legal_name: formData.legal_name,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      area: formData.area,
      tags: formData.tags,
    }
    
    // 只有当经纬度有值时才添加到payload中
    if (formData.lng !== null) payload.lng = formData.lng
    if (formData.lat !== null) payload.lat = formData.lat
    if (formData.geocode_level) payload.geocode_level = formData.geocode_level
    if (formData.geocode_score !== null) payload.geocode_score = formData.geocode_score
    if (formData.geocode_description) payload.geocode_description = formData.geocode_description

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
  formData.legal_name = ''
  formData.phone = ''
  formData.address = ''
  formData.city = '安阳市'
  formData.area = ''
  formData.lng = null
  formData.lat = null
  formData.geocode_level = ''
  formData.geocode_score = null
  formData.geocode_description = ''
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

// 地址转换为经纬度
async function convertAddressToCoordinates() {
  if (!formData.address.trim()) {
    MessagePlugin.warning('请先输入地址')
    return
  }
  
  try {
    geocoding.value = true
    const result = await geocode({
      address: formData.address,
      city: formData.city || '安阳市'
    })
    
    formData.lng = result.lng
    formData.lat = result.lat
    formData.geocode_level = result.level || ''
    formData.geocode_score = result.level_score || null
    formData.geocode_description = result.level_description || ''
    
    MessagePlugin.success(`地址转换成功！精度：${result.level_description || '未知'}`)
  } catch (error: any) {
    handleError(error)
    MessagePlugin.error('地址转换失败：' + error.message)
  } finally {
    geocoding.value = false
  }
}

// 根据精度分数获取主题颜色
function getAccuracyTheme(score?: number | null): string {
  if (!score) return 'default'
  if (score <= 20) return 'danger'    // 粗略定位 - 红色
  if (score <= 50) return 'warning'   // 中等定位 - 橙色
  if (score <= 85) return 'success'   // 精确定位 - 绿色
  return 'primary'                    // 非常精确 - 蓝色
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

.address-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.coordinates-display {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.coordinates-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.coordinate-item {
  font-size: 12px;
  color: #666;
}

.accuracy-badge {
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
  margin-top: 2px;
}

.accuracy-danger {
  background: #fef0f0;
  color: #f56565;
}

.accuracy-warning {
  background: #fffbf0;
  color: #ed8936;
}

.accuracy-success {
  background: #f0fff4;
  color: #38a169;
}

.accuracy-primary {
  background: #eff6ff;
  color: #3182ce;
}

.text-placeholder {
  color: #999;
  font-style: italic;
}
</style>