<template>
  <div class="merchants-page">
    <!-- 页面头部 -->
    <t-card :bordered="false" class="page-header-card">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">商家管理</h1>
          <p class="page-description">管理和维护商家信息，支持批量操作和数据导出</p>
        </div>
        <div class="header-actions">
          <t-space size="small">
            <t-button variant="outline" @click="handleExport">
              <template #icon><download-icon /></template>
              导出数据
            </t-button>
            <t-button theme="primary" @click="showCreateForm">
              <template #icon><add-icon /></template>
              新建商家
            </t-button>
            <input ref="importFileInput" type="file" accept=".xlsx,.xls" style="display:none"
              @change="onImportFileChange" />
            <t-button variant="outline" @click="triggerImportClick">
              <template #icon><download-icon /></template>
              批量导入
            </t-button>
          </t-space>
        </div>
      </div>
    </t-card>

    <!-- 表格顶部快捷操作区域 -->
    <t-card class="quick-actions-card">
      <div class="quick-actions">
        <t-space size="medium">
          <t-input v-model="globalSearchKeyword" placeholder="全局搜索商家名称、电话、地址..." clearable style="width: 320px;"
            @change="handleGlobalSearch">
            <template #prefix-icon>
              <search-icon />
            </template>
          </t-input>

          <t-button variant="outline" @click="resetAllFilters" v-if="hasAnyActiveFilter">
            <template #icon><refresh-icon /></template>
            重置所有筛选
          </t-button>
        </t-space>
      </div>
    </t-card>

    <!-- 数据统计卡片 -->
    <t-row :gutter="24" class="stats-row" justify="center">
      <t-col :span="6">
        <t-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ merchants.length }}</div>
            <div class="stat-label">总商家数</div>
          </div>
        </t-card>
      </t-col>
      <t-col :span="6">
        <t-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ averageAccuracy.toFixed(1) }}%</div>
            <div class="stat-label">
              平均定位精度
              <t-tooltip content="定位精度表示地理编码结果的可信度，100%为最准确。该数值反映了商家地址坐标的精确程度，精度越高位置越准确。" placement="top" show-arrow
                theme="default">
                <info-circle-icon style="margin-left: 4px; color: #999; cursor: help;" size="14px" />
              </t-tooltip>
            </div>
          </div>
        </t-card>
      </t-col>
    </t-row>

    <!-- 商家列表 -->
    <t-card class="table-card">
      <template #header>
        <div class="table-header">
          <div class="header-left">
            <h3>商家列表</h3>
            <!-- 选中状态提示 -->
            <div v-if="hasSelectedMerchants" class="selection-info">
              <t-tag theme="primary" variant="light" size="small">
                已选中 {{ selectedRowKeys.length }} 个商家
              </t-tag>
              <t-button theme="default" variant="text" size="small" @click="clearSelection">
                取消选择
              </t-button>
            </div>
          </div>
          <t-space size="small">
            <!-- 批量操作按钮 -->
            <t-dropdown v-if="hasSelectedMerchants" trigger="click" placement="bottom-right"
              :popup-props="{ attach: 'body' }">
              <t-button theme="primary" variant="outline">
                批量操作 ({{ selectedRowKeys.length }})
                <template #suffix><chevron-down-icon /></template>
              </t-button>
              <template #dropdown>
                <t-dropdown-menu>
                  <t-dropdown-item @click="handleBatchExport">
                    <template #prefixIcon><download-icon /></template>
                    批量导出
                  </t-dropdown-item>
                  <t-dropdown-item @click="handleBatchDelete" theme="danger">
                    <template #prefixIcon><delete-icon /></template>
                    批量删除
                  </t-dropdown-item>
                </t-dropdown-menu>
              </template>
            </t-dropdown>

            <t-tooltip content="刷新数据">
              <t-button variant="outline" @click="loadMerchants">
                <template #icon><refresh-icon /></template>
              </t-button>
            </t-tooltip>
          </t-space>
        </div>
      </template>

      <t-table :data="merchants" :columns="columns" row-key="id" :loading="loading" :pagination="pagination"
        :hover="true" :stripe="true" :bordered="true" :max-height="600" resizable :selected-row-keys="selectedRowKeys"
        :filter-value="filterValue" @page-change="handlePageChange" @filter-change="handleFilterChange"
        @change="handleTableChange" @row-click="handleRowClick" @select-change="handleSelectChange">
        <template #actions="{ row }">
          <t-space size="4px" direction="vertical" style="width: 100%;">
            <t-button theme="primary" variant="outline" size="small" style="width: 100%;"
              @click.stop="editMerchant(row)">
              <template #icon><edit-icon /></template>
              编辑
            </t-button>
            <t-button theme="danger" variant="outline" size="small" style="width: 100%;"
              @click.stop="deleteMerchant(row)">
              <template #icon><delete-icon /></template>
              删除
            </t-button>
            <t-dropdown trigger="click" placement="bottom-right" :popup-props="{ attach: 'body' }" style="width: 100%;">
              <t-button theme="default" variant="outline" size="small" style="width: 100%;">
                更多
                <template #suffix><chevron-down-icon /></template>
              </t-button>
              <template #dropdown>
                <t-dropdown-menu>
                  <t-dropdown-item @click="viewMerchantDetail(row)">
                    <template #prefixIcon><info-circle-icon /></template>
                    查看详情
                  </t-dropdown-item>
                  <t-dropdown-item @click="copyMerchantInfo(row)">
                    <template #prefixIcon><copy-icon /></template>
                    复制信息
                  </t-dropdown-item>
                  <t-dropdown-item @click="exportSingle(row)">
                    <template #prefixIcon><download-icon /></template>
                    导出数据
                  </t-dropdown-item>
                  <t-dropdown-item @click.stop="reparseMerchant(row)">
                    <template #prefixIcon><refresh-icon /></template>
                    重新解析
                  </t-dropdown-item>
                </t-dropdown-menu>
              </template>
            </t-dropdown>
          </t-space>
        </template>

        <!-- 空状态 -->
        <template #empty>
          <div class="empty-state">
            <browse-icon class="empty-icon" />
            <div class="empty-text">暂无商家数据</div>
            <t-button theme="primary" @click="showCreateForm">
              立即创建商家
            </t-button>
          </div>
        </template>
      </t-table>
    </t-card>

    <!-- Create/Edit Modal -->
    <t-dialog v-model:visible="showModal" :title="isEditing ? '编辑商户' : '创建商户'" width="600px" placement="center"
      :confirm-loading="submitting" @confirm="handleSubmit" @cancel="handleCancel" :confirm-on-enter="true">
      <t-form ref="formRef" :data="formData" :rules="formRules" label-width="100px" :colon="true"
        :required-mark="false">
        <!-- 基本信息 -->
        <t-divider>基本信息</t-divider>
        <t-row :gutter="16">
          <t-col :span="12">
            <t-form-item label="法人姓名" name="legal_name" :required-mark="true">
              <t-input v-model="formData.legal_name" placeholder="请输入法人姓名" clearable />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="联系电话" name="phone">
              <t-input v-model="formData.phone" placeholder="请输入联系电话" clearable />
            </t-form-item>
          </t-col>
        </t-row>

        <t-row :gutter="16">
          <t-col :span="12">
            <t-form-item label="城市" name="city">
              <t-input v-model="formData.city" placeholder="请输入城市" clearable />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="商圈" name="area">
              <t-select v-model="formData.area" placeholder="请选择商圈类型" clearable>
                <t-option value="居民区" label="居民区" />
                <t-option value="商业（集贸）区" label="商业（集贸）区" />
                <t-option value="其他" label="其他" />
              </t-select>
            </t-form-item>
          </t-col>
        </t-row>

        <!-- 地址信息 -->
        <t-divider>地址信息</t-divider>
        <t-form-item label="详细地址" name="address" :required-mark="true">
          <t-textarea v-model="formData.address" placeholder="请输入详细地址" :maxlength="200"
            :autosize="{ minRows: 2, maxRows: 4 }" />
          <template #help>
            <t-space size="8px" style="margin-top: 8px;">
              <t-button theme="primary" variant="outline" size="small" :loading="geocoding"
                :disabled="!formData.address?.trim()" @click="convertAddressToCoordinates">
                <template #icon v-if="!geocoding">
                  <location-icon />
                </template>
                {{ geocoding ? '转换中...' : '获取坐标' }}
              </t-button>
              <span style="color: #6b7280; font-size: 12px;">
                经纬度为可选项，可根据地址自动获取坐标
              </span>
              <t-space style="margin-left: 8px;" v-if="isEditing">
                <t-button variant="outline" size="small" @click="triggerReparse" :disabled="!formData.id">
                  重新解析
                </t-button>
              </t-space>
            </t-space>
          </template>
        </t-form-item>

        <!-- 坐标信息 -->
        <t-form-item v-if="formData.lng && formData.lat" label="坐标信息" name="coordinates">
          <t-card variant="outline" size="small">
            <t-space direction="vertical" size="4px">
              <t-space size="12px">
                <t-tag theme="primary" variant="light" size="small">
                  经度: {{ formData.lng.toFixed(6) }}
                </t-tag>
                <t-tag theme="primary" variant="light" size="small">
                  纬度: {{ formData.lat.toFixed(6) }}
                </t-tag>
              </t-space>
              <!-- 已移除坐标信息处的定位精度标签，避免重复显示 -->
            </t-space>
          </t-card>
        </t-form-item>

        <!-- 标签信息 -->
        <t-divider>标签信息</t-divider>
        <t-form-item label="关联标签" name="tags">
          <tag-select v-model="formData.tags" />
          <template #help>
            <span style="color: #6b7280; font-size: 12px;">
              可选择多个标签对商户进行分类
            </span>
          </template>
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- Merchant Detail Dialog: 显示商家详情、子任务与资产 -->
    <t-dialog v-model:visible="showDetailDialog" title="商家详情" width="800px" placement="center">
      <div v-if="detailMerchant">
        <t-row :gutter="16">
          <t-col :span="12">
            <t-card size="small" variant="outline">
              <div style="font-weight:600">基本信息</div>
              <div style="margin-top:8px">法人：{{ detailMerchant.legal_name }}</div>
              <div>电话：{{ detailMerchant.phone || '无' }}</div>
              <div>地址：{{ detailMerchant.address || '无' }}</div>
              <div>城市/商圈：{{ detailMerchant.city || '-' }} / {{ detailMerchant.area || '-' }}</div>
              <div v-if="detailMerchant.lng && detailMerchant.lat">坐标：{{ detailMerchant.lng }}, {{ detailMerchant.lat }}
              </div>
            </t-card>
          </t-col>
          <t-col :span="12">
            <t-card size="small" variant="outline">
              <div style="font-weight:600">统计</div>
              <div style="margin-top:8px">定位精度：{{ detailMerchant.geocode_description || '未知' }}</div>
              <div>精度分数：{{ detailMerchant.geocode_score ?? '-' }}</div>
            </t-card>
          </t-col>
        </t-row>

        <t-divider style="margin-top:12px">相关子任务</t-divider>
        <t-card size="small" variant="outline">
          <div v-if="loadingSubtasks">加载中...</div>
          <div v-else-if="merchantSubtasks.length === 0" style="color:#6b7280">暂无子任务</div>
          <t-list v-else>
            <t-list-item v-for="st in merchantSubtasks" :key="st.id">
              <div style="display:flex; justify-content:space-between; align-items:center; width:100%">
                <div>
                  <div style="font-weight:600">{{ st.content || st.title || ('子任务 #' + st.id) }}</div>
                  <div style="font-size:12px; color:#6b7280">提交人: {{ st.submitter_name || st.submitter_id || '-' }} · {{
                    st.submitted_at || st.created_at || '' }}</div>
                </div>
                <div style="display:flex; gap:8px; align-items:center">
                  <t-button size="small" variant="outline" @click="fetchAttachmentsForSubtask(st.id)">
                    查看资产
                  </t-button>
                </div>
              </div>

              <!-- 附件预览区 -->
              <div v-if="attachmentsCache[st.id] && attachmentsCache[st.id].length > 0" style="margin-top:8px">
                <t-space>
                  <a v-for="att in attachmentsCache[st.id]" :key="att.id || att.url" :href="att.url" target="_blank"
                    rel="noreferrer">
                    {{ att.file_name || att.url }}
                  </a>
                </t-space>
              </div>
            </t-list-item>
          </t-list>
        </t-card>
      </div>
      <template #footer>
        <t-button variant="outline" @click="showDetailDialog = false">关闭</t-button>
      </template>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Table, Button, Dialog, Form, FormItem, Input, MessagePlugin, Tag as TTag, Space,
  Divider, Card, Alert, Select, Option, DateRangePicker, RangeInput, Cascader as TCascader,
  Row, Col, Textarea, Tooltip, Dropdown, DropdownMenu, DropdownItem, DialogPlugin
} from 'tdesign-vue-next'
import {
  AddIcon, LocationIcon, SearchIcon, RefreshIcon, ChevronDownIcon, ChevronUpIcon,
  DownloadIcon, EditIcon, DeleteIcon, MoreIcon, BrowseIcon, InfoCircleIcon, CopyIcon
} from 'tdesign-icons-vue-next'
import * as XLSX from 'xlsx'
import TagSelect from '../components/Selectors/TagSelect.vue'
import { formatTagLabel } from '../utils/tags'
import { fetchMerchants, createMerchant, updateMerchant, deleteMerchant as deleteMerchantApi, batchDeleteMerchants } from '../api/merchant'
import { batchImportMerchants } from '../api/merchant'
import { listSubTasks, listSubtaskAttachments } from '../api/subtask'
import { fetchTags, createTag } from '../api/tag'
import { geocode } from '../api/geocode'
import type { Merchant, Tag } from '../types'
import { handleError } from '../utils/error-handler'
import { exportMerchantsToExcel } from '../utils/export'

const merchants = ref<Merchant[]>([])
const loading = ref(false)
const geocoding = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const formRef = ref()
const selectedRowKeys = ref<(string | number)[]>([])
const importFileInput = ref<HTMLInputElement | null>(null)

// 详情相关：用于显示商家详情并查看相关子任务与资产
const showDetailDialog = ref(false)
const detailMerchant = ref<Merchant | null>(null)
const merchantSubtasks = ref<any[]>([])
const loadingSubtasks = ref(false)
const attachmentsCache: Record<number, any[]> = reactive({})
const loadingAttachments: Record<number, boolean> = reactive({})

// 映射表头到请求字段
const headerMap: Record<string, string> = {
  '法人': 'legal_name',
  '经营地址': 'address',
  '商圈': 'area',
  '有效时间': 'valid_time',
  '交通情况': 'traffic',
  '固定事件': 'fixed_event',
  '终端类型': 'terminal_type',
  '特殊时段': 'special_periods',
  '自定义筛选': 'custom_filters',
}

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

// 用于跟踪编辑时的初始地址，便于检测地址是否被修改以触发重新解析
const originalAddress = ref('')

// 搜索参数
const searchParams = reactive({
  keyword: '',
  city: '',
  area: '',
  tags: [] as number[],
  hasCoordinates: '',
  dateRange: null as [string, string] | null,
  geocodeLevel: '',
  scoreRange: null as [number, number] | null,
})

// 全局搜索关键字
const globalSearchKeyword = ref('')

// 表格筛选值
const filterValue = ref<Record<string, any>>({})

// 搜索相关状态
const showAdvancedFilter = ref(false)

// 选项数据
const cityOptions = ref([
  { label: '安阳市', value: '安阳市' },
  { label: '郑州市', value: '郑州市' },
  { label: '洛阳市', value: '洛阳市' },
  { label: '开封市', value: '开封市' },
  { label: '南阳市', value: '南阳市' },
  { label: '许昌市', value: '许昌市' },
])

const areaOptions = computed(() => {
  if (!searchParams.city) return []

  // 根据城市返回对应的区域选项
  const areaMap: Record<string, Array<{ label: string, value: string }>> = {
    '安阳市': [
      { label: '文峰区', value: '文峰区' },
      { label: '北关区', value: '北关区' },
      { label: '殷都区', value: '殷都区' },
      { label: '龙安区', value: '龙安区' },
      { label: '安阳县', value: '安阳县' },
      { label: '林州市', value: '林州市' },
    ],
    '郑州市': [
      { label: '中原区', value: '中原区' },
      { label: '二七区', value: '二七区' },
      { label: '管城区', value: '管城区' },
      { label: '金水区', value: '金水区' },
      { label: '上街区', value: '上街区' },
      { label: '惠济区', value: '惠济区' },
    ]
  }

  return areaMap[searchParams.city] || []
})

const tagOptions = ref<Tag[]>([])

// 将所有标签按 class（类别）分组，供 Cascader 使用（每个类别为一级，标签为叶子）
const tagCascaderOptions = computed(() => {
  const groups: Record<string, Tag[]> = {}
  const allTags = tagOptions.value || []

  // 按类别分组标签
  allTags.forEach((t: Tag) => {
    const cls = (t.class && String(t.class).trim()) || '其他'
    if (!groups[cls]) groups[cls] = []
    groups[cls].push(t)
  })

  // 生成级联选择器的选项结构
  return Object.keys(groups)
    .sort() // 按类别名称排序
    .map((cls) => ({
      label: `${cls} (${groups[cls].length})`,
      value: `class:${cls}`,
      children: groups[cls]
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')) // 按标签名称排序
        .map((tg: Tag) => ({
          label: formatTagLabel(tg),
          value: tg.id,
          // 添加额外信息便于调试
          title: `ID: ${tg.id}, 类别: ${cls}`
        }))
    }))
})

// 计算属性：平均精度
const averageAccuracy = computed(() => {
  const withScore = merchants.value.filter(m => m.geocode_score !== null && m.geocode_score !== undefined)
  if (withScore.length === 0) return 0
  const sum = withScore.reduce((acc, m) => acc + (m.geocode_score || 0), 0)
  return sum / withScore.length
})

// 计算属性：是否有选中的商家
const hasSelectedMerchants = computed(() => {
  return selectedRowKeys.value.length > 0
})

// 计算属性：选中的商家数据
const selectedMerchants = computed(() => {
  return merchants.value.filter(merchant =>
    selectedRowKeys.value.includes(merchant.id)
  )
})

// 计算属性：是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return !!(
    searchParams.keyword ||
    searchParams.city ||
    searchParams.area ||
    searchParams.tags.length > 0 ||
    searchParams.hasCoordinates ||
    searchParams.dateRange ||
    searchParams.geocodeLevel ||
    searchParams.scoreRange
  )
})

// 计算属性：是否有任何活跃的筛选（包括表格内筛选和全局搜索）
const hasAnyActiveFilter = computed(() => {
  const hasTableFilter = Object.keys(filterValue.value).some(key => {
    const value = filterValue.value[key]
    return value !== undefined && value !== null && value !== '' &&
      (Array.isArray(value) ? value.length > 0 : true)
  })

  return hasActiveFilters.value || hasTableFilter || globalSearchKeyword.value.trim() !== ''
})

// 使用 TDesign 标准验证规则格式
const formRules = {
  legal_name: [
    { required: true, message: '请输入法人姓名', trigger: 'change' },
    { min: 2, message: '法人姓名至少2个字符', trigger: 'change' },
    { max: 100, message: '法人姓名最多100个字符', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入地址', trigger: 'change' },
    { min: 5, message: '地址至少5个字符', trigger: 'change' },
    { max: 200, message: '地址最多200个字符', trigger: 'change' }
  ],
  phone: [
    {
      validator: (val: string) => {
        // 如果为空，则通过验证（非必填）
        if (!val || val.trim() === '') return true
        // 如果有值，则验证手机号格式
        const phoneRegex = /^1[3-9]\d{9}$/
        return phoneRegex.test(val)
      },
      message: '请输入有效的手机号码',
      trigger: 'blur'
    }
  ],
  city: [
    { max: 50, message: '城市名称最多50个字符', trigger: 'change' }
  ],
  area: [
    { max: 50, message: '商圈名称最多50个字符', trigger: 'change' }
  ],
  tags: [
    {
      validator: (val: number[]) => {
        // 标签是可选的，但如果选择了标签，限制最多10个
        if (!val || !Array.isArray(val)) return true
        return val.length <= 10
      },
      message: '最多只能选择10个标签',
      trigger: 'change'
    }
  ]
}

const columns = computed(() => [
  {
    colKey: 'row-select',
    type: 'multiple',
  },
  {
    colKey: 'id',
    title: 'ID',
    width: 80,
    filter: {
      type: 'input' as const,
      resetValue: '',
      showConfirmAndReset: true,
      confirmEvents: ['onEnter']
    }
  },
  {
    colKey: 'legal_name',
    title: '法人姓名',
    width: 120,
    filter: {
      type: 'input' as const,
      resetValue: '',
      showConfirmAndReset: true,
      confirmEvents: ['onEnter']
    }
  },
  {
    colKey: 'phone',
    title: '联系电话',
    width: 130,
    filter: {
      type: 'input' as const,
      resetValue: '',
      showConfirmAndReset: true,
      confirmEvents: ['onEnter']
    }
  },
  {
    colKey: 'address',
    title: '详细地址',
    ellipsis: true,
    filter: {
      type: 'input' as const,
      resetValue: '',
      showConfirmAndReset: true,
      confirmEvents: ['onEnter']
    }
  },
  {
    colKey: 'area',
    title: '商圈',
    width: 120,
    filter: {
      type: 'single' as const,
      list: [
        { label: '居民区', value: '居民区' },
        { label: '商业（集贸）区', value: '商业（集贸）区' },
        { label: '其他', value: '其他' },
      ],
      resetValue: '',
      showConfirmAndReset: true
    }
  },
  {
    colKey: 'tags',
    title: '标签',
    width: 150,
    filter: {
      type: 'multiple',
      list: tagOptions,
      resetValue: [],
      showConfirmAndReset: true
    },
    cell: (h: any, { row }: { row: Merchant }) => {
      if (!row.tags || !Array.isArray(row.tags) || row.tags.length === 0) {
        return h('span', { class: 'text-placeholder' }, '无标签')
      }

      const tagElements = row.tags.map((tagId: number) => {
        const tag = tagOptions.value.find((t: Tag) => t.id === Number(tagId))
        if (!tag) {
          // 如果找不到标签，显示ID
          return h('span', {
            class: 'text-placeholder',
            style: 'font-size: 12px; color: #999;'
          }, `[未知标签:${tagId}]`)
        }

        const label = formatTagLabel(tag)
        return h(TTag, {
          theme: 'primary',
          variant: 'light',
          size: 'small',
          title: `ID: ${tag.id}, 类别: ${tag.class || '其他'}`,
          style: 'margin-right: 4px; margin-bottom: 2px;'
        }, () => label)
      }).filter(Boolean)

      return h('div', {
        class: 'tags-cell',
        style: 'max-width: 140px; line-height: 1.4;'
      }, tagElements)
    }
  },
  {
    colKey: 'coordinates',
    title: '坐标信息',
    width: 150,
    filter: {
      type: 'single' as const,
      list: [
        { label: '有坐标', value: 'has_coordinates' },
        { label: '无坐标', value: 'no_coordinates' },
      ],
      resetValue: '',
      showConfirmAndReset: true
    },
    cell: (h: any, { row }: { row: Merchant }) => {
      if (row.lng && row.lat) {
        const elements = [
          h('div', { class: 'coordinate-item' }, `经: ${row.lng.toFixed(4)}`),
          h('div', { class: 'coordinate-item' }, `纬: ${row.lat.toFixed(4)}`)
        ]

        return h('div', { class: 'coordinates-cell' }, elements)
      }
      return h('span', { class: 'text-placeholder' }, '未设置')
    }
  },
  {
    colKey: 'geocode_level',
    title: '定位精度',
    width: 130,
    filter: {
      type: 'single' as const,
      list: [
        { label: '非常精确', value: '非常精确' },
        { label: '精确定位', value: '精确定位' },
        { label: '中等定位', value: '中等定位' },
        { label: '粗略定位', value: '粗略定位' },
        { label: '未知精度', value: '未知精度' },
        { label: '等待解析', value: '等待解析' },
        { label: '解析失败', value: '解析失败' },
      ],
      resetValue: '',
      showConfirmAndReset: true
    },
    cell: (h: any, { row }: { row: Merchant }) => {
      if (!row.geocode_description) {
        return h('span', { class: 'text-placeholder' }, '未知')
      }

      return h(TTag, {
        theme: getAccuracyTheme(row.geocode_score),
        variant: 'light',
        size: 'small'
      }, () => row.geocode_description)
    }
  },
  { colKey: 'actions', title: '操作', width: 120, fixed: 'right' },
])

async function loadMerchants() {
  try {
    loading.value = true
    const response = await fetchMerchants({
      page: pagination.current,
      pageSize: pagination.pageSize,
    })

    let items: Merchant[] = []
    if (Array.isArray(response)) items = response
    else items = response.items || []

    // 应用客户端表格筛选（例如定位精度 / 是否有坐标），确保 UI 筛选项生效
    const filtered = applyClientFilters(items)
    merchants.value = filtered
    pagination.total = filtered.length

    // 调试：打印前几条商家及其 tags 字段，和当前前端加载的 tagOptions
    try {
      console.log('[loadMerchants] loaded merchants count:', merchants.value.length)
      console.log('[loadMerchants] first 5 merchants tags:', merchants.value.slice(0, 5).map(m => ({ id: m.id, tags: m.tags })))
      console.log('[loadMerchants] current tagOptions count:', (tagOptions.value || []).length, tagOptions.value.slice(0, 10))
    } catch (e) {
      // ignore logging errors
    }
  } catch (error: any) {
    handleError(error)
  } finally {
    loading.value = false
  }
}

// 在前端对表格过滤条件做一次本地筛选以保证与 UI 筛选一致
function applyClientFilters(items: Merchant[]): Merchant[] {
  const fv = filterValue.value || {}
  let out = items.slice()

  // 定位精度筛选：后端返回的主要是描述字符串（geocode_description），前端列中也展示描述，使用描述进行匹配
  const levelFilter = fv.geocode_level || fv.geocodeLevel || null
  if (levelFilter) {
    const selected = Array.isArray(levelFilter) ? levelFilter : [levelFilter]
    out = out.filter(m => {
      if (!m.geocode_description) return false
      return selected.includes(m.geocode_description)
    })
  }

  // 坐标存在/不存在筛选（列 key: 'coordinates'）
  const coordFilter = fv.coordinates || fv.hasCoordinates || null
  if (coordFilter) {
    if (coordFilter === 'has_coordinates') {
      out = out.filter(m => m.lng !== null && m.lat !== null && m.lng !== undefined && m.lat !== undefined)
    } else if (coordFilter === 'no_coordinates') {
      out = out.filter(m => !m.lng && !m.lat)
    }
  }

  // 标签筛选：支持级联筛选器返回的标签ID数组
  const tagFilter = fv.tags || []
  if (Array.isArray(tagFilter) && tagFilter.length > 0) {
    const selectedTagIds = tagFilter.map((v: any) => Number(v)).filter((n: number) => !Number.isNaN(n))
    if (selectedTagIds.length > 0) {
      out = out.filter(merchant => {
        if (!Array.isArray(merchant.tags) || merchant.tags.length === 0) return false
        // 检查商家是否包含任何一个选中的标签
        return merchant.tags.some((tagId: number) => selectedTagIds.includes(Number(tagId)))
      })
    }
  }

  return out
}

async function loadTags() {
  try {
    const response = await fetchTags({ page: 1, pageSize: 100 })
    if (Array.isArray(response)) {
      tagOptions.value = response
    } else {
      tagOptions.value = response.items || []
    }

    console.log('标签加载成功:', tagOptions.value.length, '个标签')
    console.log('标签类别分布:', tagCascaderOptions.value.map(opt => ({
      category: opt.label,
      count: opt.children?.length || 0
    })))
  } catch (error: any) {
    console.error('加载标签失败:', error)
    MessagePlugin.error('加载标签数据失败')
  }
}

// 监听标签数据变化，确保级联筛选器数据同步
watch(tagOptions, (newTags, oldTags) => {
  if (newTags.length !== oldTags.length) {
    console.log('标签数据已更新，级联筛选器选项:', tagCascaderOptions.value.length, '个类别')

    // 更新表格标签列的filter list
    const tagsColumn = columns.value.find(col => col.colKey === 'tags')
    if (tagsColumn && tagsColumn.filter && 'list' in tagsColumn.filter) {
      (tagsColumn.filter as any).list = tagOptions.value.map((tag: Tag) => ({
        label: formatTagLabel(tag),
        value: tag.id.toString()
      }))
      console.log('已更新标签筛选器选项，共', (tagsColumn.filter as any).list.length, '个标签')
    }
  }
}, { deep: true })

function triggerImportClick() {
  if (importFileInput.value) {
    (importFileInput.value as HTMLInputElement).click()
  }
}

// 文件选择处理
async function onImportFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input || !input.files || input.files.length === 0) return
  const file = input.files[0]
  try {
    // 确保已加载标签数据，以便将标签名称映射为 id
    await loadTags()
    console.log('[onImportFileChange] loaded tagOptions count:', (tagOptions.value || []).length, tagOptions.value)
    const items = await parseXlsxFile(file)
    try { console.log('[onImportFileChange] parsed items preview (json):', JSON.stringify(items && items.length ? items.slice(0, 5) : items, null, 2)) } catch (e) { console.log('[onImportFileChange] parsed items preview:', items && items.length ? items.slice(0, 5) : items) }
    if (!items || items.length === 0) {
      MessagePlugin.error('未解析到有效的数据')
      return
    }
    // 检查是否有自定义筛选占位符，需要先创建对应的标签
    const placeholders = new Set<string>()
    items.forEach(it => {
      if (Array.isArray(it.tags)) {
        it.tags.forEach((t: any) => {
          if (typeof t === 'string' && t.startsWith('__NEW_CF__:')) {
            const raw = t.split(':').slice(1).join(':')
            try { placeholders.add(decodeURIComponent(raw)) } catch (e) { placeholders.add(raw) }
          }
        })
      }
    })

    if (placeholders.size > 0) {
      // 为每个占位别名创建标签（class: 自定义筛选），若已存在则跳过
      const creates: Promise<any>[] = []
      for (const alias of Array.from(placeholders)) {
        const exists = tagOptions.value.find((tg: Tag) => (tg.alias && String(tg.alias).toLowerCase() === String(alias).toLowerCase()) || (tg.name && String(tg.name).toLowerCase() === String(alias).toLowerCase()))
        if (!exists) {
          creates.push(createTag({ name: alias, alias: alias, class: '自定义筛选' }))
        }
      }
      if (creates.length > 0) {
        await Promise.all(creates)
        // 重新加载标签表以获取新 tag 的 id
        await loadTags()
      }

      // 替换占位符为真实 id
      items.forEach(it => {
        if (Array.isArray(it.tags)) {
          it.tags = it.tags.map((t: any) => {
            if (typeof t === 'string' && t.startsWith('__NEW_CF__:')) {
              const raw = t.split(':').slice(1).join(':')
              let alias = raw
              try { alias = decodeURIComponent(raw) } catch (e) { /* ignore */ }
              const found = tagOptions.value.find((tg: Tag) => (tg.alias && String(tg.alias).toLowerCase() === String(alias).toLowerCase()) || (tg.name && String(tg.name).toLowerCase() === String(alias).toLowerCase()))
              return found ? found.id : null
            }
            return t
          }).filter((x: any) => x !== null)
        }
      })
    }

    await batchImportMerchants(items)
    MessagePlugin.success('批量导入提交成功')
    await loadMerchants()
  } catch (err: any) {
    console.error('批量导入出错', err)
    MessagePlugin.error('批量导入失败: ' + (err?.message || err))
  } finally {
    input.value = ''
  }
}

function parseXlsxFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 0 }) as any[]
        try { console.log('[parseXlsxFile] raw excel headers:', JSON.stringify(Object.keys(json[0] || {}), null, 2)) } catch (e) { console.log('[parseXlsxFile] raw excel headers:', Object.keys(json[0] || {})) }
        const mapped = json.map(row => {
          const out: any = {}
          for (const key in row) {
            const trimmed = String(key).trim()
            const field = headerMap[trimmed] || trimmed
            out[field] = row[key]
          }
          out.legal_name = out.legal_name || out['法人'] || ''
          out.address = out.address || out['经营地址'] || ''
          out.area = out.area || out['商圈'] || ''
          // 统一标签字段：尝试从标签名称或别名映射为 tag id 列表
          // 支持列名：tags, 标签
          const rawTags = out.tags || out['标签'] || ''
          const ids: any[] = []
          if (rawTags) {
            // 支持更多分隔符：逗号、分号、顿号、竖线、斜杠、换行等
            const names = String(rawTags).split(/[,\|\/;；，、\n]/).map((s: string) => s.trim()).filter((s: string) => s)
            for (const rawName of names) {
              console.log('[parseXlsxFile] rawTags token:', rawName)
              const name = String(rawName).trim()
              const nameLc = name.toLowerCase()
              // 尝试从别名/代码前缀匹配（例如 A: 描述）
              const aliasCandidateMatch = name.match(/^([^:：\s]+)/)
              const aliasCandidate = aliasCandidateMatch ? aliasCandidateMatch[1] : name
              const aliasLc = String(aliasCandidate).toLowerCase()

              // 优先按完全匹配 alias 或 name
              let found = tagOptions.value.find((t: Tag) => (t.alias && String(t.alias).toLowerCase() === aliasLc && (t.name || '')?.toString()) || (t.name && t.name.toLowerCase() === nameLc))
              if (!found) {
                // 再尝试按 alias 完整匹配（不拆分）或 name 完整匹配
                found = tagOptions.value.find((t: Tag) => (t.alias && String(t.alias).toLowerCase() === nameLc) || (t.name && t.name.toLowerCase() === nameLc))
              }

              if (!found) {
                // 最后尝试包含匹配（仅当 token 长度 >= 3 避免过短误匹配）
                if (name.length >= 3) {
                  found = tagOptions.value.find((t: Tag) => (t.name && t.name.toLowerCase().includes(nameLc)) || (t.alias && String(t.alias).toLowerCase().includes(nameLc)))
                }
              }

              if (found) {
                ids.push(found.id)
                console.log('[parseXlsxFile] rawTags matched:', rawName, '-> id', found.id)
              } else {
                console.log('[parseXlsxFile] rawTags no match for:', rawName)
              }
            }
          }

          // 处理按类别的标签列：动态识别 Excel 表头是否为已存在标签的 class（类别）
          // 例如表头为 '终端类型'、'特殊时段'、'自定义筛选' 等。
          // 只有当类别为 '自定义筛选' 时，才会对不存在的别名生成占位符以便后续创建标签。
          const seenClasses = new Set<string>()
          tagOptions.value.forEach((t: Tag) => { if (t.class) seenClasses.add(String(t.class).trim().toLowerCase()) })

          // 扫描当前行的原始表头（使用 row 的 key），找出被识别为 tag class 的列
          const dynamicCategoryFields: { field: string, className: string, createIfMissing?: boolean }[] = []
          for (const key in row) {
            const trimmedHeader = String(key).trim()
            if (!trimmedHeader) continue
            if (seenClasses.has(trimmedHeader.toLowerCase())) {
              const field = headerMap[trimmedHeader] || trimmedHeader
              const createIfMissing = trimmedHeader === '自定义筛选'
              // 防止重复加入相同 field
              if (!dynamicCategoryFields.some(d => d.field === field)) {
                dynamicCategoryFields.push({ field, className: trimmedHeader, createIfMissing })
              }
            }
          }

          // 调试输出：显示本行识别到的类别列
          if (dynamicCategoryFields.length > 0) {
            console.log('[parseXlsxFile] detected category columns for row:', dynamicCategoryFields.map(d => d.className))
          } else {
            console.log('[parseXlsxFile] no category columns detected for this row; available seenClasses count=', seenClasses.size)
          }

          // 处理发现的类别列
          for (const cf of dynamicCategoryFields) {
            const val = out[cf.field]
            if (!val) continue
            const parts = String(val).split(/[,;；，\n]/).map((s: string) => s.trim()).filter((s: string) => s)
            for (const pRaw of parts) {
              const p = String(pRaw)
              console.log('[parseXlsxFile] processing token:', p, 'for class:', cf.className)
              // 对非自定义类，优先按别名（冒号前的代码）匹配
              if (!cf.createIfMissing) {
                const m = p.match(/^([^:：\s]+)/)
                const aliasCandidate = m ? m[1] : p
                const found = tagOptions.value.find((t: Tag) => (String(t.alias || '').toLowerCase() === aliasCandidate.toLowerCase()) && (String(t.class || '').trim().toLowerCase() === cf.className.toLowerCase()))
                if (found) {
                  if (!ids.includes(found.id)) ids.push(found.id)
                  console.log('[parseXlsxFile] matched existing tag by alias:', aliasCandidate, '-> id', found.id)
                  continue
                }
                // fallback: match by full name or alias
                const fallback = tagOptions.value.find((t: Tag) => (t.name && t.name.toLowerCase() === p.toLowerCase()) || (t.alias && String(t.alias).toLowerCase() === p.toLowerCase()))
                if (fallback && !ids.includes(fallback.id)) {
                  ids.push(fallback.id)
                  console.log('[parseXlsxFile] matched existing tag by name/alias:', p, '-> id', fallback.id)
                  continue
                }
                // 若都未命中，则跳过（不会自动创建）
                continue
              }

              // 对于自定义筛选：以单元格原始值为 alias（不拆分），优先查找完全匹配的 alias
              const aliasToMatch = p
              const foundCf = tagOptions.value.find((t: Tag) => String(t.alias || '').toLowerCase() === aliasToMatch.toLowerCase() || (t.name && String(t.name).toLowerCase() === aliasToMatch.toLowerCase()))
              if (foundCf) {
                if (!ids.includes(foundCf.id)) ids.push(foundCf.id)
                console.log('[parseXlsxFile] matched existing custom-filter tag:', aliasToMatch, '-> id', foundCf.id)
                continue
              }
              // 未找到则生成占位符，使用 encodeURIComponent 避免分隔符问题
              const placeholder = `__NEW_CF__:${encodeURIComponent(aliasToMatch)}`
              console.log('[parseXlsxFile] creating placeholder for custom filter:', aliasToMatch, '->', placeholder)
              if (!ids.includes(placeholder)) ids.push(placeholder)
            }
          }

          out.tags = ids

          // 标记坐标为等待解析，清空经纬度，保留其他字段以便后端处理
          out.lng = null
          out.lat = null
          out.geocode_level = out.geocode_level || ''
          out.geocode_score = null
          out.geocode_description = out.geocode_description || '等待解析'

          return out
        })
        resolve(mapped)
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = (err) => reject(err)
    reader.readAsArrayBuffer(file)
  })
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
  originalAddress.value = merchant.address || ''
  showModal.value = true
}

async function handleSubmit() {
  try {
    submitting.value = true
    const valid = await formRef.value?.validate()
    if (!valid) return

    const payload: Partial<Merchant> = {
      legal_name: formData.legal_name,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      area: formData.area,
      tags: formData.tags || [], // 包含标签数据
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
      // 新建前按 法人姓名 + 详细地址 查重：若命中则更新而非新建
      const legal = (formData.legal_name || '').trim().toLowerCase()
      const addr = (formData.address || '').trim().toLowerCase()
      const existing = merchants.value.find(m => {
        const mLegal = (m.legal_name || '').trim().toLowerCase()
        const mAddr = (m.address || '').trim().toLowerCase()
        return mLegal === legal && mAddr === addr
      })

      if (existing && existing.id) {
        // 如果有命中，更新该记录
        await updateMerchant(existing.id, payload)
        MessagePlugin.success('匹配到已有商家，已执行更新')
      } else {
        await createMerchant(payload)
        MessagePlugin.success('创建商家成功')
      }
    }

    showModal.value = false
    await loadMerchants()
    await loadTags() // 重新加载标签以更新可能新创建的标签
  } catch (error: any) {
    handleError(error)
  } finally {
    submitting.value = false
  }
}

// 在编辑 modal 中触发重新解析按钮使用的函数
async function triggerReparse() {
  if (!formData.id) return
  const dialog = DialogPlugin.confirm({
    header: '重新解析确认',
    body: '确定要对该商户重新触发地址解析吗？这会将解析状态置为等待解析并由后端重新处理。',
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async ({ e }) => {
      dialog.destroy()
      await doReparse(formData.id as number)
    },
    onCancel: ({ e }) => {
      dialog.destroy()
    }
  })
}

// 表格行“重新解析”操作
async function reparseMerchant(row: Merchant) {
  const dialog = DialogPlugin.confirm({
    header: '重新解析确认',
    body: `确定要对商户 "${row.legal_name}" 重新触发地址解析吗？`,
    confirmBtn: '确定',
    cancelBtn: '取消',
    onConfirm: async ({ e }) => {
      dialog.destroy()
      await doReparse(row.id)
    },
    onCancel: ({ e }) => {
      dialog.destroy()
    }
  })
}

async function doReparse(id: number) {
  try {
    submitting.value = true
    // 只更新解析状态，后端会重置 attempts 并将记录置为等待解析
    await updateMerchant(id, { geocode_description: '等待解析' })
    // 如果当前 modal 正在编辑且是同一条记录，更新本地表单显示
    if (isEditing.value && formData.id === id) {
      formData.geocode_description = '等待解析'
      formData.geocode_score = null
      formData.geocode_level = ''
      formData.lng = null
      formData.lat = null
    }
    MessagePlugin.success('已标记为等待解析，后台将尽快处理')
    await loadMerchants()
  } catch (err: any) {
    handleError(err)
  } finally {
    submitting.value = false
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
  originalAddress.value = ''
}

// 监听地址变化：在编辑已有商户时，如果地址被修改，自动把 geocode_description 标记为等待解析
watch(() => formData.address, (newVal, oldVal) => {
  try {
    if (isEditing.value && originalAddress.value && (String(newVal || '').trim() !== String(originalAddress.value || '').trim())) {
      if (formData.geocode_description !== '等待解析') {
        formData.geocode_description = '等待解析'
      }
    }
  } catch (e) {
    // ignore
  }
})

async function deleteMerchant(merchant: Merchant) {
  // 显示确认对话框
  const dialog = DialogPlugin.confirm({
    header: '确认删除',
    body: `您确定要删除商家"${merchant.legal_name}"吗？此操作不可撤销。`,
    theme: 'danger',
    confirmBtn: '确定删除',
    cancelBtn: '取消',
    onConfirm: async ({ e }) => {
      try {
        await deleteMerchantApi(merchant.id)
        MessagePlugin.success('删除商家成功')
        await loadMerchants()
        dialog.destroy() // 销毁对话框
      } catch (error: any) {
        handleError(error)
        dialog.destroy() // 即使出错也要销毁对话框
      }
    },
    onCancel: ({ e }) => {
      dialog.destroy() // 取消时销毁对话框
    }
  })
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
function getAccuracyTheme(score?: number | null): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  if (!score) return 'default'
  if (score <= 20) return 'danger'    // 粗略定位 - 红色
  if (score <= 50) return 'warning'   // 中等定位 - 橙色
  if (score <= 85) return 'success'   // 精确定位 - 绿色
  return 'primary'                    // 非常精确 - 蓝色
}

// 处理筛选变化
function handleFilterChange(filters: any, context: any) {
  console.log('Filter changed:', filters, context)

  // 特别处理标签筛选器的值
  if (filters.tags && Array.isArray(filters.tags)) {
    console.log('Tags filter values:', filters.tags)

    // 验证标签ID的有效性
    const validTagIds = filters.tags.filter((id: any) => {
      const numId = Number(id)
      return !isNaN(numId) && tagOptions.value.some((tag: Tag) => tag.id === numId)
    })

    if (validTagIds.length !== filters.tags.length) {
      console.warn('Some tag IDs are invalid:', filters.tags.filter((id: any) => !validTagIds.includes(id)))
    }

    filters.tags = validTagIds
  }

  // 更新全局筛选值状态
  filterValue.value = { ...filters }

  // 重置到第一页
  pagination.current = 1

  // 清空选中状态
  selectedRowKeys.value = []

  // 重新加载数据
  loadMerchants()
}

// 全局搜索处理
function handleGlobalSearch() {
  // 重置到第一页
  pagination.current = 1
  selectedRowKeys.value = [] // 搜索时清空选中状态
  loadMerchants()
}

// 重置所有筛选
function resetAllFilters() {
  // 重置表格筛选
  filterValue.value = {}

  // 重置全局搜索
  globalSearchKeyword.value = ''

  // 重置其他搜索参数
  Object.assign(searchParams, {
    keyword: '',
    city: '',
    area: '',
    tags: [],
    hasCoordinates: '',
    dateRange: null,
    geocodeLevel: '',
    scoreRange: null,
  })

  selectedRowKeys.value = [] // 重置筛选时清空选中状态
  pagination.current = 1 // 重置到第一页
  loadMerchants()
}

// 处理表格变化（排序、筛选、分页等）
function handleTableChange(data: any, context: any) {
  console.log('Table changed:', data, context)
  if (context.trigger === 'pagination') {
    // 分页变化已经由 handlePageChange 处理
    return
  }
  // 处理其他变化（排序、筛选等）
  loadMerchants()
}

function handlePageChange(pageInfo: any) {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
  selectedRowKeys.value = [] // 分页时清空选中状态
  loadMerchants()
}

// 搜索处理
function handleSearch() {
  // 重置到第一页
  pagination.current = 1
  selectedRowKeys.value = [] // 搜索时清空选中状态
  loadMerchants()
}

// 重置筛选
function resetFilters() {
  Object.assign(searchParams, {
    keyword: '',
    city: '',
    area: '',
    tags: [],
    hasCoordinates: '',
    dateRange: null,
    geocodeLevel: '',
    scoreRange: null,
  })
  selectedRowKeys.value = [] // 重置筛选时清空选中状态
  handleSearch()
}

// 导出数据
function handleExport() {
  try {
    // 导出所有商家数据
    if (merchants.value.length === 0) {
      MessagePlugin.warning('暂无数据可导出')
      return
    }

    // 导出为Excel格式
    exportMerchantsToExcel(merchants.value, '商家列表')
    MessagePlugin.success(`成功导出 ${merchants.value.length} 条商家数据`)
  } catch (error) {
    console.error('导出失败:', error)
    MessagePlugin.error('导出失败，请重试')
  }
}

// 多选相关函数
function handleSelectChange(selectedKeys: (string | number)[], options: any) {
  selectedRowKeys.value = selectedKeys
  console.log('Selected rows:', selectedKeys, options)
}

// 清空选择
function clearSelection() {
  selectedRowKeys.value = []
  MessagePlugin.success('已清空选择')
}

// 批量导出
function handleBatchExport() {
  if (selectedMerchants.value.length === 0) {
    MessagePlugin.warning('请先选择要导出的商家')
    return
  }

  try {
    // 导出选中的商家数据
    exportMerchantsToExcel(selectedMerchants.value, '选中商家列表')
    MessagePlugin.success(`成功导出 ${selectedMerchants.value.length} 条选中商家数据`)

    // 清空选择状态
    clearSelection()
  } catch (error) {
    console.error('批量导出失败:', error)
    MessagePlugin.error('批量导出失败，请重试')
  }
}

// 批量删除
async function handleBatchDelete() {
  if (selectedMerchants.value.length === 0) {
    MessagePlugin.warning('请先选择要删除的商家')
    return
  }

  // 显示确认对话框
  const dialog = DialogPlugin.confirm({
    header: '确认批量删除',
    body: `您确定要删除所选的 ${selectedMerchants.value.length} 个商家吗？此操作不可撤销。`,
    theme: 'danger',
    confirmBtn: '确定删除',
    cancelBtn: '取消',
    onConfirm: async ({ e }) => {
      try {
        // 调用批量删除API
        await batchDeleteMerchants(selectedRowKeys.value.map(Number))

        MessagePlugin.success(`批量删除 ${selectedMerchants.value.length} 个商家成功`)
        selectedRowKeys.value = [] // 清空选中状态
        await loadMerchants() // 重新加载数据
        dialog.destroy() // 销毁对话框
      } catch (error: any) {
        handleError(error)
        dialog.destroy() // 即使出错也要销毁对话框
      }
    },
    onCancel: ({ e }) => {
      dialog.destroy() // 取消时销毁对话框
    }
  })
}

// 行点击处理
function handleRowClick(context: any) {
  console.log('Row clicked:', context)
}

// 查看商家详情
function viewMerchantDetail(merchant: Merchant) {
  detailMerchant.value = merchant
  showDetailDialog.value = true
  // 异步加载该商家的子任务
  fetchMerchantSubtasks(merchant.id)
}

async function fetchMerchantSubtasks(merchantId: number) {
  try {
    loadingSubtasks.value = true
    const resp = await listSubTasks({ merchantId, page: 1, size: 50 })
    // 兼容不同后端返回结构
    const items = resp?.data?.items || resp?.data?.list || resp?.data || resp
    merchantSubtasks.value = Array.isArray(items) ? items : (items?.items || [])
  } catch (err: any) {
    handleError(err)
    merchantSubtasks.value = []
  } finally {
    loadingSubtasks.value = false
  }
}

async function fetchAttachmentsForSubtask(subtaskId: number) {
  try {
    loadingAttachments[subtaskId] = true
    const resp = await listSubtaskAttachments(subtaskId, 1, 50)
    const items = resp?.data?.items || resp?.data?.list || resp?.data || resp
    attachmentsCache[subtaskId] = Array.isArray(items) ? items : (items?.items || [])
  } catch (err: any) {
    console.error('load attachments failed', err)
    attachmentsCache[subtaskId] = []
  } finally {
    loadingAttachments[subtaskId] = false
  }
}

// 复制商家信息
function copyMerchantInfo(merchant: Merchant) {
  const info = `商家信息：
法人姓名：${merchant.legal_name}
联系电话：${merchant.phone}
详细地址：${merchant.address}
城市：${merchant.city}
商圈：${merchant.area}
${merchant.lng && merchant.lat ? `坐标：${merchant.lng}, ${merchant.lat}` : '无坐标信息'}`

  navigator.clipboard.writeText(info).then(() => {
    MessagePlugin.success('商家信息已复制到剪贴板')
  }).catch(() => {
    MessagePlugin.error('复制失败')
  })
}

// 导出单个商家
function exportSingle(merchant: Merchant) {
  try {
    // 导出单个商家数据
    exportMerchantsToExcel([merchant], `商家_${merchant.legal_name}`)
    MessagePlugin.success(`成功导出商家：${merchant.legal_name}`)
  } catch (error) {
    console.error('导出失败:', error)
    MessagePlugin.error('导出失败，请重试')
  }
}

onMounted(async () => {
  try {
    // 首先加载标签数据，为级联筛选器提供选项
    await loadTags()
    console.log('标签数据加载完成:', tagOptions.value.length)

    // 然后加载商家数据
    await loadMerchants()
    console.log('商家数据加载完成:', merchants.value.length)
    // 处理路由传入的新建商户坐标（来自地图选点）
    const route = useRoute()
    const q = route.query || {}
    const newLng = q.newLng ? Number(q.newLng) : null
    const newLat = q.newLat ? Number(q.newLat) : null
    if (newLng && newLat) {
      resetForm()
      formData.lng = newLng
      formData.lat = newLat
      // 标记为精确定位
      formData.geocode_level = 'precise'
      formData.geocode_score = 90
      formData.geocode_description = '精确定位（用户手动选点）'
      showModal.value = true
      isEditing.value = false
      MessagePlugin.success('已从地图加载坐标，正在创建新商户')
    }
  } catch (error) {
    console.error('页面初始化失败:', error)
    handleError(error)
  }
})
</script>

<style scoped>
.merchants-page {
  padding: 0;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 页面头部样式 */
.page-header-card {
  margin-bottom: 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.page-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.header-actions {
  margin-left: 24px;
}

/* 快速操作区域样式 */
.quick-actions-card {
  margin-bottom: 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.quick-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

/* 筛选区域样式 - 移除原有的筛选卡片样式，保留在表格中 */

/* 统计卡片样式 */
.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-content {
  padding: 16px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--td-brand-color);
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

/* 表格区域样式 */
.table-card {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
}

.header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.table-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 表格内容样式 */
.coordinates-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.coordinate-item {
  font-size: 12px;
  color: #666;
}

.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 140px;
}

.accuracy-tag {
  font-size: 11px !important;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.text-placeholder {
  color: #9ca3af;
  font-style: italic;
  font-size: 13px;
}

.coordinate-item {
  font-size: 12px;
  color: #6b7280;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.accuracy-tag {
  margin-top: 4px;
  font-weight: 500;
  border-radius: 12px;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  margin-bottom: 16px;
  color: #6b7280;
}

/* TDesign 组件自定义样式 */
:deep(.t-card) {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

:deep(.t-card__header) {
  padding: 20px 24px 0 24px;
  border-bottom: none;
}

:deep(.t-card__body) {
  padding: 20px 24px 24px 24px;
}

:deep(.t-table) {
  border-radius: 6px;
  table-layout: auto;
  /* 启用自动列宽 */
  width: 100%;
}

:deep(.t-table__header) {
  background: #f9fafb;
}

:deep(.t-table__header th) {
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
  /* 防止表头文字换行 */
}

:deep(.t-table__body tr:hover) {
  background: #f9fafb;
}

:deep(.t-table__body td) {
  border-bottom: 1px solid #f3f4f6;
}

/* 特定列的样式优化 */
:deep(.t-table__body td:first-child) {
  width: 1%;
  /* 选择列最小宽度 */
}

:deep(.t-table__body td:nth-child(2)) {
  width: 1%;
  /* ID列最小宽度 */
  white-space: nowrap;
}

:deep(.t-table__body td:nth-child(3)) {
  width: 10%;
  /* 法人姓名列 */
  white-space: nowrap;
}

:deep(.t-table__body td:nth-child(4)) {
  width: 12%;
  /* 联系电话列 */
  white-space: nowrap;
}

:deep(.t-table__body td:nth-child(5)) {
  width: 25%;
  /* 详细地址列 - 重新增加一些空间 */
  word-break: break-word;
  max-width: 200px;
}

:deep(.t-table__body td:nth-child(6)) {
  width: 8%;
  /* 城市列 */
  white-space: nowrap;
}

:deep(.t-table__body td:nth-child(7)) {
  width: 10%;
  /* 商圈列 - 恢复一些空间 */
  white-space: nowrap;
}

:deep(.t-table__body td:nth-child(8)) {
  width: 15%;
  /* 经纬度列 - 恢复一些空间 */
}

:deep(.t-table__body td:last-child) {
  width: 20%;
  /* 操作列减少宽度，因为竖向排列更紧凑 */
  white-space: nowrap;
}

:deep(.t-pagination) {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

/* 表单样式优化 */
:deep(.t-form-item__label) {
  font-weight: 500;
  color: #374151;
}

:deep(.t-divider__content) {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

:deep(.t-input) {
  border-radius: 6px;
}

:deep(.t-select) {
  border-radius: 6px;
}

:deep(.t-button) {
  border-radius: 6px;
  font-weight: 500;
}

:deep(.t-button--theme-primary) {
  box-shadow: 0 1px 2px 0 rgba(var(--td-brand-color-rgb), 0.1);
}

:deep(.t-button--variant-outline) {
  border-color: #d1d5db;
  color: #374151;
}

:deep(.t-button--variant-outline:hover) {
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
}

/* 标签样式 */
:deep(.t-tag) {
  border-radius: 12px;
  font-weight: 500;
}

/* 表格操作按钮样式 */
:deep(.t-table .t-space) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  gap: 4px;
}

:deep(.t-table .t-button--size-small) {
  min-width: auto;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  width: 100%;
  justify-content: center;
}

:deep(.t-table .t-button--variant-outline) {
  border-width: 1px;
  transition: all 0.2s ease;
}

:deep(.t-table .t-button--theme-primary.t-button--variant-outline) {
  color: #3b82f6;
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

:deep(.t-table .t-button--theme-primary.t-button--variant-outline:hover) {
  background: #3b82f6;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

:deep(.t-table .t-button--theme-danger.t-button--variant-outline) {
  color: #ef4444;
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

:deep(.t-table .t-button--theme-danger.t-button--variant-outline:hover) {
  background: #ef4444;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

:deep(.t-table .t-button--theme-default.t-button--variant-outline) {
  color: #6b7280;
  border-color: #d1d5db;
  background: rgba(107, 114, 128, 0.05);
}

:deep(.t-table .t-button--theme-default.t-button--variant-outline:hover) {
  background: #6b7280;
  color: white;
  border-color: #6b7280;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);
}

/* 操作按钮图标样式 */
:deep(.t-table .t-button .t-icon) {
  font-size: 14px;
  margin-right: 4px;
}

/* 下拉菜单样式 */
:deep(.t-dropdown) {
  display: inline-block;
}

:deep(.t-dropdown-menu) {
  min-width: 120px;
}

:deep(.t-dropdown-item) {
  padding: 8px 12px;
  font-size: 13px;
}

:deep(.t-dropdown-item:hover) {
  background: #f3f4f6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .merchants-page {
    padding: 0 8px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    margin-left: 0;
  }

  .basic-filters :deep(.t-space) {
    flex-direction: column;
    align-items: stretch;
  }

  .basic-filters :deep(.t-space > *) {
    width: 100% !important;
  }

  .stats-row :deep(.t-col) {
    margin-bottom: 16px;
  }

  /* 中等屏幕下的操作列优化 */
  :deep(.t-table .t-space) {
    gap: 3px !important;
  }

  :deep(.t-table .t-button--size-small) {
    padding: 3px 6px;
    font-size: 11px;
  }

  /* 中等屏幕下的列宽调整 */
  :deep(.t-table__body td:nth-child(5)) {
    max-width: 150px;
    /* 地址列在中等屏幕适当缩小 */
  }

  :deep(.t-table__body td:last-child) {
    width: 25%;
    /* 操作列在中等屏幕稍微增加空间 */
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 18px;
  }

  .stat-number {
    font-size: 20px;
  }

  :deep(.t-table) {
    font-size: 12px;
  }

  /* 移动端列宽调整 */
  :deep(.t-table__body td:nth-child(5)) {
    max-width: 120px;
    /* 地址列在移动端缩小 */
  }

  :deep(.t-table__body td:nth-child(8)) {
    width: 12%;
    /* 经纬度列在移动端缩小 */
  }

  :deep(.t-table__body td:last-child) {
    width: 30%;
    /* 操作列在移动端保持合适空间 */
  }

  /* 表格操作列优化 */
  :deep(.t-table .t-space) {
    gap: 3px !important;
  }

  :deep(.t-table .t-button--size-small) {
    padding: 3px 6px;
    font-size: 11px;
    width: 100%;
    justify-content: center;
  }

  /* 下拉菜单在移动端优化 */
  :deep(.t-table .t-dropdown) {
    width: 100%;
  }
}
</style>