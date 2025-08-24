<template>
  <div class="map-container">
    <t-card title="地图展示" style="height: 100%;">
      <template #actions>
        <t-space>
          <t-tag theme="primary" variant="light">
            商户总数: {{ merchants.length }}
          </t-tag>
          <t-tag theme="success" variant="light">
            已标注: {{ filteredMerchants.length }}
          </t-tag>
          <t-button size="small" @click="loadMerchants">
            <template #icon><t-icon name="refresh" /></template>
            刷新商户
          </t-button>
          <t-button size="small" theme="primary" @click="toggleSelectNewMerchant">
            <template #icon><t-icon name="add" /></template>
            在地图上选点新增商户
          </t-button>
        </t-space>
      </template>
      
      <!-- 筛选面板 -->
      <div class="filter-panel">
        <t-row :gutter="16">
          <t-col :span="3">
            <t-input 
              v-model="filters.keyword" 
              placeholder="搜索商户名称或地址"
              @change="applyFilters"
              clearable
            >
              <template #prefix-icon>
                <t-icon name="search" />
              </template>
            </t-input>
          </t-col>
          <!-- 城市筛选已移除 -->
          <t-col :span="2">
            <t-select 
              v-model="filters.area" 
              placeholder="选择区域"
              @change="applyFilters"
              clearable
            >
              <t-option
                v-for="area in availableAreas"
                :key="area"
                :value="area"
                :label="area"
              />
            </t-select>
          </t-col>
          <t-col :span="6">
            <t-row :gutter="8">
              <t-col :span="12">
                <!-- 正向：包含所选标签（级联多选） -->
                <t-cascader
                  v-model="filters.tags"
                  :options="tagOptions"
                  placeholder="包含标签"
                  @change="applyFilters"
                  multiple
                  clearable
                />
              </t-col>
              <t-col :span="12">
                <!-- 反向：排除所选标签（级联多选） -->
                <t-cascader
                  v-model="filters.excludeTagIds"
                  :options="tagOptions"
                  placeholder="排除标签"
                  @change="applyFilters"
                  multiple
                  clearable
                />
              </t-col>
            </t-row>
          </t-col>
          <t-col :span="2">
            <t-button @click="clearFilters" variant="outline">
              <template #icon><t-icon name="filter-clear" /></template>
              清除筛选
            </t-button>
          </t-col>
          <t-col :span="3">
            <t-space>
              <t-button @click="resetMapView" variant="outline" size="small">
                <template #icon><t-icon name="refresh" /></template>
                重置视野
              </t-button>
            </t-space>
          </t-col>
        </t-row>
      </div>
      
      <div class="map-wrapper">
        <div id="amap-container" ref="mapContainer"></div>
        
        <!-- 悬浮商户列表面板 -->
        <div class="floating-merchant-panel" :class="{ 'collapsed': isListCollapsed }">
          <div class="panel-header">
            <div class="panel-title">
              <t-space>
                <span>商户列表</span>
                <t-tag theme="primary" variant="light" size="small">
                  {{ filteredMerchants.length }}
                </t-tag>
              </t-space>
            </div>
            <div class="panel-actions">
              <t-space>
                <t-button 
                  size="small" 
                  variant="text"
                  @click="selectAll"
                  :disabled="filteredMerchants.length === 0"
                  v-if="!isListCollapsed"
                >
                  全选
                </t-button>
                <t-button 
                  size="small" 
                  variant="text"
                  @click="clearSelection"
                  :disabled="selectedMerchants.length === 0"
                  v-if="!isListCollapsed"
                >
                  清除选择
                </t-button>
                <t-button 
                  size="small" 
                  variant="text"
                  @click="toggleListPanel"
                >
                  {{ isListCollapsed ? '展开' : '收起' }}
                </t-button>
              </t-space>
            </div>
          </div>
          
          <div class="panel-content" v-if="!isListCollapsed">
            <!-- 选中商户统计 -->
            <div class="selection-summary" v-if="selectedMerchants.length > 0">
              <div class="compact-alert">
                <t-icon name="check-circle-filled" size="14px" style="color: #0052d9;" />
                <span class="alert-text">已选择 {{ selectedMerchants.length }} 个商户</span>
                <t-button size="small" theme="primary" variant="text" @click="showSelectedOnMap">
                  在地图上显示
                </t-button>
              </div>
            </div>
            
            <!-- 商户列表 -->
            <div class="merchant-list">
              <div 
                v-for="merchant in filteredMerchants" 
                :key="merchant.id"
                class="merchant-item"
                :class="{ 
                  'selected': selectedMerchants.includes(merchant.id),
                  'has-location': merchant.lng && merchant.lat,
                  'no-location': !merchant.lng || !merchant.lat
                }"
                @click="toggleMerchantSelection(merchant.id)"
              >
                <div class="merchant-checkbox">
                  <t-checkbox 
                    :checked="selectedMerchants.includes(merchant.id)"
                    @change="toggleMerchantSelection(merchant.id)"
                    @click.stop
                  />
                </div>
                
                <div class="merchant-info">
                  <div class="merchant-name">
                    {{ merchant.legal_name }}
                    <t-tag 
                      v-if="!merchant.lng || !merchant.lat" 
                      theme="warning" 
                      variant="light" 
                      size="small"
                    >
                      无坐标
                    </t-tag>
                  </div>
                  
                  <div class="merchant-details">
                    <div class="detail-row" v-if="merchant.phone">
                      <t-icon name="phone" size="14px" />
                      <span>{{ merchant.phone }}</span>
                    </div>
                    
                    <div class="detail-row">
                      <t-icon name="location" size="14px" />
                      <span>{{ merchant.address }}</span>
                    </div>
                    
                    <div class="detail-row" v-if="merchant.city || merchant.area">
                      <t-icon name="map" size="14px" />
                      <span>{{ [merchant.city, merchant.area].filter(Boolean).join(' - ') }}</span>
                    </div>
                    
                    <div class="detail-row" v-if="getMerchantTagNames(merchant).length > 0">
                      <t-icon name="tag" size="14px" />
                      <span>{{ getMerchantTagNames(merchant).join(', ') }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="merchant-actions">
                  <t-button 
                    size="small" 
                    variant="text"
                    @click.stop="locateOnMap(merchant)"
                    :disabled="!merchant.lng || !merchant.lat"
                  >
                    定位
                  </t-button>
                </div>
              </div>
              
              <!-- 空状态 -->
              <div v-if="filteredMerchants.length === 0" class="empty-state">
                <t-icon name="inbox" size="48px" style="color: #ddd;" />
                <p>暂无符合条件的商户</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 地图选点创建商户弹窗 -->
  <t-dialog v-model:visible="showCreateModal" title="在地图上创建商户" width="560px" :confirm-loading="createSubmitting" @confirm="submitCreateForm" @cancel="handleCreateCancel">
        <t-form ref="createFormRef" :data="createFormData">
          <t-row :gutter="12">
            <t-col :span="12">
              <t-form-item label="法人姓名">
                <t-input v-model="createFormData.legal_name" placeholder="请输入法人姓名" />
              </t-form-item>
            </t-col>
            <t-col :span="12">
              <t-form-item label="联系电话">
                <t-input v-model="createFormData.phone" placeholder="请输入联系电话" />
              </t-form-item>
            </t-col>
          </t-row>
          <t-form-item label="详细地址">
            <t-textarea v-model="createFormData.address" :autosize="{ minRows: 2, maxRows: 4 }" />
          </t-form-item>
          <t-row :gutter="12">
            <t-col :span="12">
              <t-form-item label="经度">
                <t-input v-model="createFormData.lng" readonly />
              </t-form-item>
            </t-col>
            <t-col :span="12">
              <t-form-item label="纬度">
                <t-input v-model="createFormData.lat" readonly />
              </t-form-item>
            </t-col>
          </t-row>
          <t-form-item label="关联标签">
            <tag-select v-model="createFormData.tags" />
          </t-form-item>
        </t-form>
      </t-dialog>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import TagSelect from '../components/Selectors/TagSelect.vue'
import { createMerchant } from '../api/merchant'
import { loadAMap, DEFAULT_MAP_OPTIONS } from '../utils/amap'
import { fetchMerchants } from '../api/merchant'
import { fetchTags } from '../api/tag'
import type { Merchant, Tag } from '../types'

// 地图相关数据
const mapContainer = ref<HTMLElement>()
const map = ref<any>(null)
const router = useRouter()
const isSelectingNewMerchant = ref(false)
const tempNewMarker = ref<any>(null)
// 鼠标跟随的临时图标元素（用于提示用户当前处于选点模式）
const cursorIconEl = ref<HTMLElement | null>(null)
let _mouseMoveHandler: ((e: MouseEvent) => void) | null = null
// 新增表单状态
const showCreateModal = ref(false)
const createFormRef = ref()
const createSubmitting = ref(false)
const createFormData = ref<any>({
  legal_name: '',
  phone: '',
  address: '',
  city: '',
  area: '',
  lng: null,
  lat: null,
  geocode_level: '',
  geocode_score: null,
  geocode_description: '',
  tags: [] as number[]
})

// 商户图标配置函数 - 使用官方推荐的自定义内容方式
const getMerchantMarkerContent = (merchant: any, isSelected = false, isHighlighted = false) => {
  // 获取商户的第一个标签来决定图标样式
  const firstTagId = merchant.tags?.[0]
  const firstTag = firstTagId ? availableTags.value.find(t => t.id === firstTagId) : null
  
  // 根据状态和标签类型选择不同的图标和颜色
  let iconUrl = '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png'
  let bgColor = '#FF6B6B'
  let textColor = '#FFFFFF'
  let size = 32
  
  if (isHighlighted) {
    iconUrl = '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-gold.png'
    bgColor = '#FFD700'
    size = 48
  } else if (isSelected) {
    iconUrl = '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-blue.png'
    bgColor = '#007AFF'
    size = 40
  } else if (firstTag) {
    const tagName = firstTag.name.toLowerCase()
    if (tagName.includes('餐厅') || tagName.includes('食品') || tagName.includes('美食')) {
      iconUrl = '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-orange.png'
      bgColor = '#FF9500'
    } else if (tagName.includes('商店') || tagName.includes('零售') || tagName.includes('购物')) {
      iconUrl = '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-blue.png'
      bgColor = '#007AFF'
    } else if (tagName.includes('服务') || tagName.includes('维修')) {
      iconUrl = '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-green.png'
      bgColor = '#34C759'
    } else if (tagName.includes('娱乐') || tagName.includes('休闲')) {
      iconUrl = '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-purple.png'
      bgColor = '#AF52DE'
    }
  }
  
  // 使用官方推荐的自定义HTML内容方式
  // 生成内联 SVG，避免外部图片加载问题
  const svg = buildMarkerSvg(bgColor, size)

  return `
    <div class="custom-merchant-marker" style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      cursor: pointer;
      display: inline-block;
    ">
  ${svg}
    </div>
  `
}

// 生成给定形状的标记 SVG（使用你提供的 path），color 为主体颜色，size 为宽度像素
const buildMarkerSvg = (color: string, size = 32) => {
  // 原始 viewBox 为 40x60，height = size * 1.5（按比例缩放）
  const width = size
  const height = Math.round(size * 1.5)
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;">
      <path d="M20 0C9.9 0 2 8 2 18.2C2 28.5 20 60 20 60C20 60 38 28.5 38 18.2C38 8 30.1 0 20 0Z" fill="${color}" />
      <circle cx="20" cy="18" r="8" fill="white" />
    </svg>
  `
}

// 创建商户标记的官方推荐方式
const createMerchantMarker = (merchant: any, AMap: any) => {
  const position = new AMap.LngLat(merchant.lng!, merchant.lat!)
  
  // 使用官方推荐的content方式创建自定义标记
  const marker = new AMap.Marker({
    position: position,
    content: getMerchantMarkerContent(merchant),
  offset: new AMap.Pixel(-16, -48), // 调整偏移以匹配 32x48 svg 标记底部尖端
    extData: merchant // 将商户数据存储在标记中，方便后续使用
  })
  
  return marker
}
const merchants = ref<Merchant[]>([])
const merchantMarkers = ref<any[]>([])
const availableTags = ref<Tag[]>([])

// 筛选相关数据
const filters = ref({
  keyword: '',
  area: '',
  tags: [] as number[],
  excludeTagIds: [] as number[]
})

// 列表面板和多选相关数据
const isListCollapsed = ref(false)
const selectedMerchants = ref<number[]>([])
const selectedMarkers = ref<any[]>([])

// 城市过滤已移除 — 保留区域过滤

// 计算属性：获取可用的区域列表
const availableAreas = computed(() => {
  const areas = merchants.value
    .map(m => m.area)
    .filter((area): area is string => Boolean(area))
  return [...new Set(areas)].sort()
})

// 计算属性：将平铺的标签列表转换为级联选择的 options
// 说明/假设：标签对象可能包含字段 `category` 或 `type` 来表示其所属分类。
// 我们优先读取这两个字段进行分组；没有分类的标签会被归为 '其他' 分组。
const tagOptions = computed(() => {
  const tags = availableTags.value || []

  // 根据可能的分类字段分组
  const groupMap: Record<string, { label: string; value: string; children: { label: string; value: number }[] }> = {}

  for (const tag of tags) {
    // use backend-mapped `class` field first (see src/api/tag.ts mapping),
    // then fall back to `category`, otherwise put into '其他'
    const cat = (tag as any).class || (tag as any).category || '其他'
    const key = String(cat || '其他')
    if (!groupMap[key]) {
      groupMap[key] = { label: key, value: key, children: [] }
    }
    // 子项使用 tag.id 作为 value，保持和原来 filters.tags 类型 compatible（number[]）
    groupMap[key].children.push({ label: tag.name, value: tag.id })
  }

  // 将分组转换为 cascader 的 options 数组
  const groups = Object.values(groupMap)

  // 如果只有一个分组并且分组名为 '其他'，直接返回其子项作为顶层
  if (groups.length === 1 && groups[0].value === '其他') {
    return [
      {
        label: '全部标签',
        value: 'all',
        children: groups[0].children
      }
    ]
  }

  return groups
})

// 计算属性：将 cascader 返回的选择值（可能包含分组 value）规范化为 tag id 的数组
const selectedIncludeTagIds = computed(() => {
  const raw = filters.value.tags as any[]
  if (!raw || raw.length === 0) return [] as number[]

  // cascader 的 multiple 模式下，选中的值可能是 tag id（number）或路径数组；我们提取所有数字值
  const ids: number[] = []
  const collect = (item: any) => {
    if (item == null) return
    if (typeof item === 'number') ids.push(item)
    else if (Array.isArray(item)) item.forEach(collect)
    else if (typeof item === 'string' && !isNaN(Number(item))) ids.push(Number(item))
  }
  raw.forEach(collect)
  return [...new Set(ids)]
})

const selectedExcludeTagIds = computed(() => {
  const raw = filters.value.excludeTagIds as any[]
  if (!raw || raw.length === 0) return [] as number[]

  const ids: number[] = []
  const collect = (item: any) => {
    if (item == null) return
    if (typeof item === 'number') ids.push(item)
    else if (Array.isArray(item)) item.forEach(collect)
    else if (typeof item === 'string' && !isNaN(Number(item))) ids.push(Number(item))
  }
  raw.forEach(collect)
  return [...new Set(ids)]
})

// 计算属性：筛选后的商户列表
const filteredMerchants = computed(() => {
  return merchants.value.filter(merchant => {
    // 关键词筛选
    if (filters.value.keyword) {
      const keyword = filters.value.keyword.toLowerCase()
      const matchName = merchant.legal_name.toLowerCase().includes(keyword)
      const matchAddress = merchant.address.toLowerCase().includes(keyword)
      if (!matchName && !matchAddress) return false
    }

  // （已移除城市筛选）

    // 区域筛选
    if (filters.value.area && merchant.area !== filters.value.area) {
      return false
    }

    // 标签筛选：同时支持包含（tags）和排除（excludeTagIds）列表
    const includeTags = selectedIncludeTagIds.value || []
    const excludeTags = selectedExcludeTagIds.value || []

    // 如果有包含标签，商户必须包含至少一个包含标签
    if (includeTags.length > 0) {
      const merchantTags = merchant.tags || []
      const hasInclude = includeTags.some(tagId => merchantTags.includes(tagId))
      if (!hasInclude) return false
    }

    // 如果有排除标签，商户不能包含任一排除标签
    if (excludeTags.length > 0) {
      const merchantTags = merchant.tags || []
      const hasExclude = excludeTags.some(tagId => merchantTags.includes(tagId))
      if (hasExclude) return false
    }

    return true
  })
})

// 初始化地图 - 使用最佳实践
const initMap = async () => {
  try {
    // 使用优化后的工具函数加载地图
    const AMap = await loadAMap({
      plugins: [
        'AMap.Scale',
        'AMap.Marker',
        'AMap.InfoWindow',
        'AMap.Icon',
        'AMap.Pixel',
        'AMap.LngLat',
        'AMap.Bounds'
      ]
    })

    // 创建地图实例，使用优化后的配置
    map.value = new AMap.Map('amap-container', {
      ...DEFAULT_MAP_OPTIONS,
      // 可以在这里覆盖默认配置
      zoom: 12,
      center: [114.392480, 36.098779]
    })

    // 地图加载完成事件
    map.value.on('complete', () => {
      console.log('地图加载完成')
    })

    // 地图加载错误事件
    map.value.on('error', (error: any) => {
      console.error('地图运行出错:', error)
      MessagePlugin.error('地图运行出现错误')
    })

    // 添加比例尺控件到左下角
    const scale = new AMap.Scale({
      position: 'LB' // 左下角
    })
    map.value.addControl(scale)

    // 并行加载标签和商户数据
    await Promise.all([
      loadTags(),
      loadMerchants()
    ])

    // 地图点击用于选点新增商户（仅在选点模式开启时）
    map.value.on('click', (e: any) => {
      try {
        if (!isSelectingNewMerchant.value) return
        const lng = e.lnglat.lng || (e.lnglat as any)[0]
        const lat = e.lnglat.lat || (e.lnglat as any)[1]

        // 移除已有临时标记
        if (tempNewMarker.value) {
          map.value.remove(tempNewMarker.value)
          tempNewMarker.value = null
        }

        // 创建临时高亮标记
        const AMap = (window as any).AMap
        const position = new AMap.LngLat(lng, lat)
        const marker = new AMap.Marker({
          position,
          content: `
            <div class="custom-merchant-marker" style="width:32px;height:48px;">
              ${buildMarkerSvg('#FFD700', 32)}
            </div>
          `,
          offset: new AMap.Pixel(-16, -48)
        })
        map.value.add(marker)
        tempNewMarker.value = marker

  // 在本页打开创建弹窗并传入经纬度
  openCreateModalWithCoords(lng, lat)
  // 退出选点模式
  isSelectingNewMerchant.value = false
  // 关闭鼠标跟随图标
  disableSelectCursor()
      } catch (err) {
        console.error('选点失败', err)
      }
    })

    MessagePlugin.success('地图加载成功')
  } catch (error) {
    console.error('地图初始化失败:', error)
    let errorMessage = '地图初始化失败'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    MessagePlugin.error(errorMessage)
  }
}

// 加载标签数据 - 优化版
const loadTags = async () => {
  try {
    const response = await fetchTags({})
    
    // 处理响应数据
    if (Array.isArray(response)) {
      availableTags.value = response
    } else if (response && Array.isArray(response.items)) {
      availableTags.value = response.items
    } else {
      availableTags.value = []
    }
    
    console.log(`成功加载 ${availableTags.value.length} 个标签`)
  } catch (error) {
    console.error('加载标签数据失败:', error)
    availableTags.value = []
    // 标签加载失败不阻止地图使用，只显示控制台警告
    console.warn('标签数据加载失败，将继续使用空标签列表')
  }
}

// 加载商户数据 - 优化版
const loadMerchants = async () => {
  try {
    const response = await fetchMerchants({})
    
    // 处理响应数据
    if (Array.isArray(response)) {
      merchants.value = response
    } else if (response && Array.isArray(response.items)) {
      merchants.value = response.items
    } else {
      merchants.value = []
    }

    // 在地图上标注商户
    await addMerchantMarkers()
    
    const merchantCount = merchants.value.length
    if (merchantCount > 0) {
      MessagePlugin.success(`成功加载 ${merchantCount} 个商户`)
      console.log(`商户数据加载完成，共 ${merchantCount} 个商户`)
    } else {
      MessagePlugin.info('暂无商户数据')
    }
  } catch (error) {
    console.error('加载商户数据失败:', error)
    merchants.value = []
    
    let errorMessage = '加载商户数据失败'
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`
    }
    MessagePlugin.error(errorMessage)
  }
}

// 应用筛选条件 - 优化版
const applyFilters = async () => {
  try {
    await addMerchantMarkers()
    
    // 如果筛选后没有商户，显示提示并恢复默认视野
    if (filteredMerchants.value.length === 0) {
      const AMap = await loadAMap()
      const defaultCenter = new AMap.LngLat(114.392480, 36.098779)
      map.value.setZoomAndCenter(12, defaultCenter, false)
      MessagePlugin.info('没有符合筛选条件的商户')
    } else {
      console.log(`筛选后显示 ${filteredMerchants.value.length} 个商户`)
    }
  } catch (error) {
    console.error('应用筛选条件失败:', error)
    MessagePlugin.error('筛选条件应用失败')
  }
}

// 清除筛选条件
const clearFilters = async () => {
  filters.value = {
    keyword: '',
    area: '',
    tags: [],
    excludeTagIds: []
  }
  await addMerchantMarkers()
}

// ...existing code...

// 重置地图到默认视野
const resetMapView = async () => {
  if (!map.value) return
  
  try {
    // 清理可能残留的临时选点标记，避免在重绘时出现残留
    if (tempNewMarker.value && map.value) {
      try { map.value.remove(tempNewMarker.value) } catch (e) { /* ignore */ }
      tempNewMarker.value = null
    }

    const AMap = await loadAMap()
    const defaultCenter = new AMap.LngLat(114.392480, 36.098779)
    map.value.setZoomAndCenter(12, defaultCenter, false)
    MessagePlugin.success('已重置地图到默认视野')
  } catch (error) {
    console.error('重置地图视野失败:', error)
    MessagePlugin.error('重置地图视野失败')
  }
}

// 列表面板控制方法
const toggleListPanel = () => {
  isListCollapsed.value = !isListCollapsed.value
}

// 切换地图选点新增商户模式
const toggleSelectNewMerchant = () => {
  isSelectingNewMerchant.value = !isSelectingNewMerchant.value
  if (!isSelectingNewMerchant.value && tempNewMarker.value && map.value) {
    try { map.value.remove(tempNewMarker.value) } catch (e) { /* ignore */ }
    tempNewMarker.value = null
  }
  // 开启/关闭鼠标跟随图标以提示用户
  if (isSelectingNewMerchant.value) {
    enableSelectCursor()
  } else {
    disableSelectCursor()
  }

  MessagePlugin.info(isSelectingNewMerchant.value ? '请在地图上点击选点以创建新商户' : '已取消选点模式')
}

// 创建并启用一个跟随鼠标的图标，方便用户察觉处于选点模式
const enableSelectCursor = () => {
  // 避免重复创建
  if (cursorIconEl.value) return

  // 创建 DOM 元素并附加到地图容器上层
  const el = document.createElement('div')
  el.className = 'select-cursor-icon'
  el.style.position = 'absolute'
  el.style.pointerEvents = 'none'
  el.style.zIndex = '2000'
  // 使用与地图标记同样的水滴形 SVG，但尺寸更小以作为鼠标提示
  const cursorSvg = buildMarkerSvg('#ff4d4f', 28)
  el.innerHTML = cursorSvg
  // 为元素设定与 svg 相匹配的尺寸（宽28，高约42）
  el.style.width = '28px'
  el.style.height = '42px'

  const container = document.getElementById('amap-container')
  if (container) {
    // 确保容器有定位上下文（不会破坏地图渲染）
    const computed = window.getComputedStyle(container)
    if (computed.position === 'static' || !computed.position) {
      container.style.position = 'relative'
    }

    // 保证图标位于地图最上层
    el.style.zIndex = '99999'
    el.style.transform = 'translate(-50%, -50%)'
    el.style.display = 'block'

    container.appendChild(el)
    cursorIconEl.value = el

    // 鼠标移动时更新位置，使用容器边界做为基准
    _mouseMoveHandler = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      // 保证坐标为数字
      el.style.left = `${Math.round(x)}px`
      el.style.top = `${Math.round(y)}px`
    }
    // 绑定到文档以保证在地图拖拽时也能跟随
    document.addEventListener('mousemove', _mouseMoveHandler)
  }
}

const disableSelectCursor = () => {
  if (cursorIconEl.value) {
    try {
      cursorIconEl.value.remove()
    } catch (e) { /* ignore */ }
    cursorIconEl.value = null
  }
  if (_mouseMoveHandler) {
    document.removeEventListener('mousemove', _mouseMoveHandler)
    _mouseMoveHandler = null
  }
}

// 打开创建弹窗并填充坐标
const openCreateModalWithCoords = (lng: number, lat: number) => {
  createFormData.value = {
    legal_name: '',
    phone: '',
    address: '',
    city: '',
    area: '',
    lng,
    lat,
    geocode_level: 'precise',
    geocode_score: 90,
    geocode_description: '精确定位（用户手动选点）',
    tags: []
  }
  showCreateModal.value = true
}

// 提交创建表单
const submitCreateForm = async () => {
  try {
    createSubmitting.value = true
    // 简单校验
    if (!createFormData.value.legal_name || !createFormData.value.address) {
      MessagePlugin.warning('请填写法人姓名和详细地址')
      createSubmitting.value = false
      return
    }

    const payload = { ...createFormData.value }
    await createMerchant(payload)
    MessagePlugin.success('已创建商户（来自地图选点）')
    showCreateModal.value = false
    // 创建成功后移除临时标记并退出选点模式
    if (tempNewMarker.value && map.value) {
      try { map.value.remove(tempNewMarker.value) } catch (e) { /* ignore */ }
      tempNewMarker.value = null
    }
    isSelectingNewMerchant.value = false
    // 重新加载商户并刷新标注
    await loadMerchants()
  } catch (err: any) {
    console.error('创建商户失败', err)
    MessagePlugin.error(err?.message || '创建商户失败')
  } finally {
    createSubmitting.value = false
  }
}

// 取消创建弹窗时的清理逻辑
const handleCreateCancel = () => {
  showCreateModal.value = false
  // 移除临时标记并退出选点模式
  if (tempNewMarker.value && map.value) {
    try { map.value.remove(tempNewMarker.value) } catch (e) { /* ignore */ }
    tempNewMarker.value = null
  }
  isSelectingNewMerchant.value = false
}

// 商户多选相关方法
const toggleMerchantSelection = (merchantId: number) => {
  const index = selectedMerchants.value.indexOf(merchantId)
  if (index > -1) {
    selectedMerchants.value.splice(index, 1)
  } else {
    selectedMerchants.value.push(merchantId)
  }
}

const selectAll = () => {
  selectedMerchants.value = filteredMerchants.value.map(m => m.id)
}

const clearSelection = () => {
  selectedMerchants.value = []
}

// 在地图上显示选中的商户
const showSelectedOnMap = async () => {
  if (!map.value || selectedMerchants.value.length === 0) return

  try {
    const AMap = await loadAMap()
    const selectedMerchantData = merchants.value.filter(m => 
      selectedMerchants.value.includes(m.id) && m.lng && m.lat
    )

    if (selectedMerchantData.length === 0) {
      MessagePlugin.warning('选中的商户中没有包含坐标信息的商户')
      return
    }

    // 清除之前的选中标记样式，恢复到原始状态
    selectedMarkers.value.forEach(marker => {
      const merchantData = marker.getExtData() // 从标记中获取商户数据
      if (merchantData) {
        marker.setContent(getMerchantMarkerContent(merchantData))
      }
    })
    selectedMarkers.value = []

    // 为选中的商户设置特殊标记样式
    for (const merchantData of selectedMerchantData) {
      const targetPosition = new AMap.LngLat(merchantData.lng!, merchantData.lat!)
      
      // 找到对应的标记
      for (const marker of merchantMarkers.value) {
        const markerPos = marker.getPosition()
        const distance = targetPosition.distance(markerPos)
        
        if (distance < 1) { // 1米内认为是同一个位置
          marker.setContent(getMerchantMarkerContent(merchantData, true)) // 使用选中状态的内容
          selectedMarkers.value.push(marker)
          break
        }
      }
    }

    // 调整地图视野以显示选中的商户
    if (selectedMerchantData.length === 1) {
      const merchant = selectedMerchantData[0]
      const targetPosition = new AMap.LngLat(merchant.lng!, merchant.lat!)
      map.value.setZoomAndCenter(15, targetPosition, false)
    } else {
      // 使用官方方法计算最佳视野
      const bounds = new AMap.Bounds()
      selectedMerchantData.forEach(merchant => {
        bounds.extend(new AMap.LngLat(merchant.lng!, merchant.lat!))
      })
      
      // 设置地图视野以包含所有选中的商户，限制最小和最大缩放级别
      map.value.setBounds(bounds, false, [50, 50, 50, 50], 13, 8) // 最大缩放13，最小缩放8
    }

    MessagePlugin.success(`已在地图上突出显示 ${selectedMerchantData.length} 个选中商户`)
  } catch (error) {
    console.error('显示选中商户失败:', error)
    MessagePlugin.error('显示选中商户失败')
  }
}

// 定位到指定商户 - 使用官方推荐的最佳实践
const locateOnMap = async (merchant: Merchant) => {
  if (!map.value || !merchant.lng || !merchant.lat) return

  try {
    const AMap = await loadAMap()
    
    // 创建目标位置对象
    const targetPosition = new AMap.LngLat(merchant.lng, merchant.lat)
    
    // 使用官方推荐的 setZoomAndCenter 方法，同时设置中心点和缩放级别
    // 添加平滑动画过渡效果，提升用户体验
    map.value.setZoomAndCenter(16, targetPosition, false, 500) // 16级缩放，0.5秒动画

    // 找到对应的标记 - 使用更精确的匹配方法
    let targetMarker = null
    for (const marker of merchantMarkers.value) {
      const markerPos = marker.getPosition()
      // 使用官方的距离计算方法，允许小的误差
      const distance = targetPosition.distance(markerPos)
      if (distance < 1) { // 1米内认为是同一个位置
        targetMarker = marker
        break
      }
    }

    if (targetMarker) {
      // 临时改变标记样式以突出显示
      targetMarker.setContent(getMerchantMarkerContent(merchant, false, true)) // 使用高亮状态的内容

      // 使用官方推荐的信息窗体创建方式
      const infoWindow = new AMap.InfoWindow({
        content: `
          <div style="padding: 16px; min-width: 240px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h4 style="margin: 0 0 12px 0; color: #333; font-size: 16px; font-weight: 600;">${merchant.legal_name}</h4>
            ${merchant.phone ? `<p style="margin: 6px 0; color: #666;"><strong style="color: #333;">电话:</strong> ${merchant.phone}</p>` : ''}
            <p style="margin: 6px 0; color: #666;"><strong style="color: #333;">地址:</strong> ${merchant.address}</p>
            ${merchant.city ? `<p style="margin: 6px 0; color: #666;"><strong style="color: #333;">城市:</strong> ${merchant.city}</p>` : ''}
            ${merchant.area ? `<p style="margin: 6px 0; color: #666;"><strong style="color: #333;">区域:</strong> ${merchant.area}</p>` : ''}
            ${getMerchantTagNames(merchant).length > 0 ? `<p style="margin: 6px 0; color: #666;"><strong style="color: #333;">标签:</strong> ${getMerchantTagNames(merchant).join(', ')}</p>` : ''}
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 8px;">
              坐标: ${merchant.lng.toFixed(6)}, ${merchant.lat.toFixed(6)}
            </p>
          </div>
        `,
        offset: new AMap.Pixel(0, -45), // 优化偏移量，确保信息窗体不被遮挡
        closeWhenClickMap: true,
        autoMove: true // 自动移动以确保信息窗体完全可见
      })

      // 监听地图移动完成事件后再显示信息窗体，确保视角已经切换到位
      const moveEndHandler = () => {
        infoWindow.open(map.value, targetPosition)
        map.value.off('moveend', moveEndHandler) // 移除事件监听
      }
      map.value.on('moveend', moveEndHandler)

      // 2秒后恢复原来的内容
      setTimeout(() => {
        if (targetMarker) {
          targetMarker.setContent(getMerchantMarkerContent(merchant)) // 恢复到原始状态
        }
      }, 2000) // 延长高亮时间
    } else {
      // 如果没找到对应的标记，创建一个临时标记
      const tempMarker = new AMap.Marker({
        position: targetPosition,
  content: getMerchantMarkerContent(merchant, false, true), // 使用高亮内容
  offset: new AMap.Pixel(-20, -60)
      })
      
      map.value.add(tempMarker)
      
      // 创建信息窗体
      const infoWindow = new AMap.InfoWindow({
        content: `
          <div style="padding: 16px; min-width: 240px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h4 style="margin: 0 0 12px 0; color: #333; font-size: 16px; font-weight: 600;">${merchant.legal_name}</h4>
            <p style="margin: 6px 0; color: #666;"><strong style="color: #333;">地址:</strong> ${merchant.address}</p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 8px;">
              坐标: ${merchant.lng.toFixed(6)}, ${merchant.lat.toFixed(6)}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #ff6b6b;">
              ⚠️ 此商户暂未在地图上显示
            </p>
          </div>
        `,
        offset: new AMap.Pixel(0, -45),
        closeWhenClickMap: true,
        autoMove: true
      })
      
      // 监听地图移动完成事件后再显示信息窗体和临时标记
      const moveEndHandler = () => {
        infoWindow.open(map.value, targetPosition)
        map.value.off('moveend', moveEndHandler)
      }
      map.value.on('moveend', moveEndHandler)
      
      // 3秒后移除临时标记
      setTimeout(() => {
        map.value.remove(tempMarker)
        infoWindow.close()
      }, 3000)
    }

    // 显示成功消息
    MessagePlugin.success(`已定位到商户：${merchant.legal_name}`)
  } catch (error) {
    console.error('定位到商户失败:', error)
    MessagePlugin.error('定位失败，请稍后重试')
  }
}

// 获取商户的标签名称
const getMerchantTagNames = (merchant: Merchant): string[] => {
  if (!merchant.tags || merchant.tags.length === 0) return []
  
  return merchant.tags.map(tagId => {
    const tag = availableTags.value.find(t => t.id === tagId)
    return tag ? tag.name : ''
  }).filter(Boolean)
}

// 在地图上添加商户标记
const addMerchantMarkers = async () => {
  if (!map.value) return

  try {
    const AMap = await loadAMap()

    // 清除之前的标记
    if (merchantMarkers.value.length > 0) {
      map.value.remove(merchantMarkers.value)
      merchantMarkers.value = []
    }

    // 使用筛选后的商户数据
    const validMerchants = filteredMerchants.value.filter(m => m.lng && m.lat)
    
    // 为每个有坐标的商户添加标记
    for (const merchant of validMerchants) {
      // 创建精确的位置对象
      const position = new AMap.LngLat(merchant.lng!, merchant.lat!)
      
      // 创建商户标记 - 使用官方推荐的方式
      const marker = createMerchantMarker(merchant, AMap)

      // 获取商户标签名称
      const merchantTagNames = merchant.tags 
        ? merchant.tags.map(tagId => {
            const tag = availableTags.value.find(t => t.id === tagId)
            return tag ? tag.name : ''
          }).filter(Boolean)
        : []

      // 创建信息窗体 - 使用官方推荐的样式
      const infoWindow = new AMap.InfoWindow({
        content: `
          <div style="padding: 16px; min-width: 240px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h4 style="margin: 0 0 12px 0; color: #333; font-size: 16px; font-weight: 600;">${merchant.legal_name}</h4>
            ${merchant.phone ? `<p style="margin: 6px 0; color: #666;"><strong style="color: #333;">电话:</strong> ${merchant.phone}</p>` : ''}
            <p style="margin: 6px 0; color: #666;"><strong style="color: #333;">地址:</strong> ${merchant.address}</p>
            ${merchant.city ? `<p style="margin: 6px 0; color: #666;"><strong style="color: #333;">城市:</strong> ${merchant.city}</p>` : ''}
            ${merchant.area ? `<p style="margin: 6px 0; color: #666;"><strong style="color: #333;">区域:</strong> ${merchant.area}</p>` : ''}
            ${merchantTagNames.length > 0 ? `<p style="margin: 6px 0; color: #666;"><strong style="color: #333;">标签:</strong> ${merchantTagNames.join(', ')}</p>` : ''}
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 8px;">
              坐标: ${merchant.lng!.toFixed(6)}, ${merchant.lat!.toFixed(6)}
            </p>
          </div>
        `,
        offset: new AMap.Pixel(0, -45), // 统一偏移量
        closeWhenClickMap: true,
        autoMove: true // 自动移动以确保信息窗体完全可见
      })

      // 优化点击标记事件，增加居中和高亮效果
      marker.on('click', () => {
        // 将地图中心移动到点击的标记位置，并设置合适的缩放级别
        map.value.setZoomAndCenter(16, position, false, 500) // 平滑移动到标记位置，0.5秒动画
        
        // 临时高亮标记
        marker.setContent(getMerchantMarkerContent(merchant, false, true))
        
        // 显示信息窗体
        infoWindow.open(map.value, position)
        
        // 2秒后恢复标记样式
        setTimeout(() => {
          marker.setContent(getMerchantMarkerContent(merchant))
        }, 2000)
      })

      // 添加到地图
      map.value.add(marker)
      merchantMarkers.value.push(marker)
    }

    // 如果有商户标记，可选择是否自动调整地图视野
    if (merchantMarkers.value.length > 0) {
      // 注释掉自动调整视野的代码，保持用户设定的初始中心点和缩放级别
      // 如果需要自动调整，可以取消注释下面的代码
      
      /*
      if (merchantMarkers.value.length === 1) {
        // 只有一个商户时，以该商户为中心，设置合适的缩放级别
        const merchant = validMerchants[0]
        const targetPosition = new AMap.LngLat(merchant.lng!, merchant.lat!)
        map.value.setZoomAndCenter(14, targetPosition, false)
      } else {
        // 多个商户时，使用官方方法计算最佳视野
        const bounds = new AMap.Bounds()
        validMerchants.forEach(merchant => {
          bounds.extend(new AMap.LngLat(merchant.lng!, merchant.lat!))
        })
        
        // 设置地图视野以包含所有商户，限制缩放级别范围
        map.value.setBounds(bounds, false, [80, 80, 80, 80], 12, 6) // 最大缩放12，最小缩放6
      }
      */
    } else {
      // 没有商户时，使用默认的中心点和缩放级别
      const defaultCenter = new AMap.LngLat(114.392480, 36.098779)
      map.value.setZoomAndCenter(12, defaultCenter, false)
    }

    console.log(`已添加 ${merchantMarkers.value.length} 个商户标记`)
  } catch (error) {
    console.error('添加商户标记失败:', error)
    MessagePlugin.error('添加商户标记失败')
  }
}

// 组件挂载时初始化地图
onMounted(() => {
  initMap()
})

// 组件卸载时清理地图 - 使用最佳实践
onUnmounted(() => {
  // 清理地图实例
  if (map.value) {
    try {
      // 清理标记点
      if (merchantMarkers.value.length > 0) {
        merchantMarkers.value.forEach(marker => {
          if (marker && typeof marker.destroy === 'function') {
            marker.destroy()
          }
        })
        merchantMarkers.value = []
      }

      // 清理选中的标记点
      if (selectedMarkers.value.length > 0) {
        selectedMarkers.value.forEach(marker => {
          if (marker && typeof marker.destroy === 'function') {
            marker.destroy()
          }
        })
        selectedMarkers.value = []
      }

      // 销毁地图实例
      map.value.destroy()
      map.value = null
      console.log('地图组件清理完成')
    } catch (error) {
      console.error('地图组件清理时出错:', error)
    }
  }
  // 清理鼠标跟随图标
  try { disableSelectCursor() } catch (e) { /* ignore */ }
})
</script>

<style scoped>
.map-container {
  height: calc(100vh - 120px);
}

.filter-panel {
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.map-wrapper {
  position: relative;
  height: calc(100vh - 280px); /* 调整高度以适应筛选面板 */
  border-radius: 6px;
  overflow: hidden;
}

#amap-container {
  width: 100%;
  height: 100%;
}

/* 悬浮商户列表面板样式 */
.floating-merchant-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 320px;
  max-height: calc(100% - 32px);
  background: white;
  border: 1px solid #e7e7e7;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  z-index: 1000;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
}

.floating-merchant-panel.collapsed {
  width: 140px;
  height: 56px;
  max-height: 56px;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e7e7e7;
  background: rgba(250, 250, 250, 0.9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px 8px 0 0;
  backdrop-filter: blur(4px);
}

.panel-title {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.panel-actions {
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.selection-summary {
  padding: 6px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.compact-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(0, 82, 217, 0.08);
  border: 1px solid rgba(0, 82, 217, 0.2);
  border-radius: 4px;
  font-size: 11px;
}

.alert-text {
  flex: 1;
  color: #0052d9;
  font-weight: 500;
}

.merchant-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  min-height: 0;
  max-height: 400px;
}

/* 自定义滚动条 */
.merchant-list::-webkit-scrollbar {
  width: 6px;
}

.merchant-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.merchant-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.merchant-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.merchant-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.merchant-item:hover {
  background: rgba(248, 249, 255, 0.8);
}

.merchant-item.selected {
  background: rgba(230, 243, 255, 0.9);
  border-left: 3px solid #0052d9;
}

.merchant-item.no-location {
  opacity: 0.6;
}

.merchant-checkbox {
  margin-right: 8px;
  margin-top: 1px;
  flex-shrink: 0;
}

.merchant-info {
  flex: 1;
  min-width: 0;
}

.merchant-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  line-height: 1.3;
}

.merchant-details {
  color: #666;
  font-size: 11px;
  line-height: 1.3;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.merchant-actions {
  margin-left: 8px;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  color: #999;
  text-align: center;
}

.empty-state p {
  margin: 8px 0 0 0;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .map-wrapper {
    height: 400px;
  }
  
  .floating-merchant-panel {
    position: fixed;
    top: auto;
    bottom: 16px;
    right: 16px;
    left: 16px;
    width: auto;
    max-height: 50vh;
    z-index: 1001;
  }
  
  .floating-merchant-panel.collapsed {
    width: auto;
    height: 56px;
    max-height: 56px;
    left: auto;
    right: 16px;
    width: 140px;
  }
  
  .map-container {
    height: auto;
  }
  
  .filter-panel {
    padding: 12px;
  }
  
  .panel-header {
    padding: 10px 12px;
  }
  
  .merchant-item {
    padding: 6px 10px;
  }
  
  .merchant-name {
    font-size: 12px;
  }
  
  .merchant-details {
    font-size: 10px;
  }
  
  .merchant-list {
    max-height: 300px;
  }
}

/* 更小屏幕适配 */
@media (max-width: 480px) {
  .floating-merchant-panel {
    bottom: 8px;
    left: 8px;
    right: 8px;
    max-height: 40vh;
  }
  
  .floating-merchant-panel.collapsed {
    left: auto;
    right: 8px;
    width: 120px;
  }
}

/* 商户标记自定义样式 - 官方推荐方式 */
:deep(.custom-merchant-marker) {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

:deep(.custom-merchant-marker:hover) {
  transform: scale(1.1);
  z-index: 999;
}

:deep(.custom-merchant-marker:hover .merchant-label) {
  display: block !important;
  animation: fadeInUp 0.3s ease;
}

:deep(.merchant-label) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 500;
  transition: all 0.3s ease;
  z-index: 1000;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 信息窗体样式优化 */
:deep(.amap-info-content) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

:deep(.amap-info-content h4) {
  color: #333;
  font-weight: 600;
  margin-bottom: 8px;
}

/* 选点时鼠标跟随的图标 */
.select-cursor-icon {
  width: 28px;
  height: 42px;
  transform: translate(-50%, -50%);
  transition: transform 0.08s linear;
  will-change: left, top;
}


/* marker fallback removed */
</style>
