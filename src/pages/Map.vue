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
          <t-col :span="2">
            <t-select 
              v-model="filters.city" 
              placeholder="选择城市"
              @change="applyFilters"
              clearable
            >
              <t-option
                v-for="city in availableCities"
                :key="city"
                :value="city"
                :label="city"
              />
            </t-select>
          </t-col>
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
          <t-col :span="3">
            <t-select 
              v-model="filters.tags" 
              placeholder="选择标签"
              @change="applyFilters"
              multiple
              clearable
            >
              <t-option
                v-for="tag in availableTags"
                :key="tag.id"
                :value="tag.id"
                :label="tag.name"
              />
            </t-select>
          </t-col>
          <t-col :span="2">
            <t-button @click="clearFilters" variant="outline">
              <template #icon><t-icon name="filter-clear" /></template>
              清除筛选
            </t-button>
          </t-col>
          <t-col :span="3">
            <t-space>
              <t-button @click="fitViewToShowAllMerchants" variant="outline" size="small">
                <template #icon><t-icon name="view-in-ar" /></template>
                显示所有商户
              </t-button>
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
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { loadAMap, DEFAULT_MAP_OPTIONS } from '../utils/amap'
import { fetchMerchants } from '../api/merchant'
import { fetchTags } from '../api/tag'
import type { Merchant, Tag } from '../types'

// 地图相关数据
const mapContainer = ref<HTMLElement>()
const map = ref<any>(null)

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
  return `
    <div class="custom-merchant-marker" style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      cursor: pointer;
    ">
      <img src="${iconUrl}" style="
        width: 100%;
        height: 100%;
        display: block;
      " alt="${merchant.address}" />
      <div class="merchant-label" style="
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
        color: ${textColor};
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        ${isHighlighted || isSelected ? 'display: block;' : 'display: none;'}
      ">
        ${merchant.address}
      </div>
    </div>
  `
}

// 创建商户标记的官方推荐方式
const createMerchantMarker = (merchant: any, AMap: any) => {
  const position = new AMap.LngLat(merchant.lng!, merchant.lat!)
  
  // 使用官方推荐的content方式创建自定义标记
  const marker = new AMap.Marker({
    position: position,
    content: getMerchantMarkerContent(merchant),
    offset: new AMap.Pixel(-16, -32), // 官方推荐的偏移量，让图标底部中心对准坐标点
    title: merchant.address,
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
  city: '',
  area: '',
  tags: [] as number[]
})

// 列表面板和多选相关数据
const isListCollapsed = ref(false)
const selectedMerchants = ref<number[]>([])
const selectedMarkers = ref<any[]>([])

// 计算属性：获取可用的城市列表
const availableCities = computed(() => {
  const cities = merchants.value
    .map(m => m.city)
    .filter((city): city is string => Boolean(city))
  return [...new Set(cities)].sort()
})

// 计算属性：获取可用的区域列表
const availableAreas = computed(() => {
  const areas = merchants.value
    .map(m => m.area)
    .filter((area): area is string => Boolean(area))
  return [...new Set(areas)].sort()
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

    // 城市筛选
    if (filters.value.city && merchant.city !== filters.value.city) {
      return false
    }

    // 区域筛选
    if (filters.value.area && merchant.area !== filters.value.area) {
      return false
    }

    // 标签筛选
    if (filters.value.tags.length > 0 && merchant.tags) {
      const merchantTags = merchant.tags
      const hasMatchingTag = filters.value.tags.some(tagId => 
        merchantTags.includes(tagId)
      )
      if (!hasMatchingTag) return false
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
    city: '',
    area: '',
    tags: []
  }
  await addMerchantMarkers()
}

// 调整地图视野以显示所有商户
const fitViewToShowAllMerchants = async () => {
  if (!map.value || filteredMerchants.value.length === 0) return
  
  try {
    const AMap = await loadAMap()
    const validMerchants = filteredMerchants.value.filter(m => m.lng && m.lat)
    
    if (validMerchants.length === 0) {
      MessagePlugin.warning('没有包含坐标信息的商户')
      return
    }

    if (validMerchants.length === 1) {
      // 只有一个商户时，以该商户为中心，设置合适的缩放级别
      const merchant = validMerchants[0]
      const targetPosition = new AMap.LngLat(merchant.lng!, merchant.lat!)
      map.value.setZoomAndCenter(14, targetPosition, false)
      MessagePlugin.success('已定位到商户位置')
    } else {
      // 多个商户时，使用官方方法计算最佳视野
      const bounds = new AMap.Bounds()
      validMerchants.forEach(merchant => {
        bounds.extend(new AMap.LngLat(merchant.lng!, merchant.lat!))
      })
      
      // 设置地图视野以包含所有商户，限制缩放级别范围
      map.value.setBounds(bounds, false, [80, 80, 80, 80], 15, 8) // 最大缩放15，最小缩放8
      MessagePlugin.success(`已调整视野显示所有 ${validMerchants.length} 个商户`)
    }
  } catch (error) {
    console.error('调整地图视野失败:', error)
    MessagePlugin.error('调整地图视野失败')
  }
}

// 重置地图到默认视野
const resetMapView = async () => {
  if (!map.value) return
  
  try {
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
        offset: new AMap.Pixel(-16, -32),
        title: merchant.address
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
</style>
