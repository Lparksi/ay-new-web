/**
 * 高德地图配置 - 按照官方最佳实践优化
 */

// 高德地图配置接口
export interface AMapConfig {
  key: string
  version: string
  plugins?: string[]
  securityJsCode?: string
}

// 高德地图配置
export const AMAP_CONFIG: AMapConfig = {
  key: import.meta.env.VITE_AMAP_KEY || 'YOUR_API_KEY', // 从环境变量获取 API Key
  version: '2.0',
  plugins: [
    'AMap.Scale',
    'AMap.ToolBar', 
    'AMap.ControlBar',
    'AMap.Geolocation',
    'AMap.Marker',
    'AMap.InfoWindow',
    'AMap.Icon',
    'AMap.Pixel',
    'AMap.LngLat',
    'AMap.Bounds'
  ]
}

// 安全密钥
export const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE || 'YOUR_SECURITY_CODE'

// 默认地图配置 - 优化后的配置
export const DEFAULT_MAP_OPTIONS = {
  viewMode: '2D' as const,
  zoom: 12, // 缩放级别12
  center: [114.392480, 36.098779], // 默认中心点坐标：114.392480, 36.098779
  mapStyle: 'amap://styles/normal', // 使用标准地图样式
  resizeEnable: true, // 允许地图容器尺寸变化
  rotateEnable: false, // 禁用旋转功能
  pitchEnable: false, // 禁用倾斜功能
  zoomEnable: true, // 允许缩放
  dragEnable: true, // 允许拖拽
  keyboardEnable: false, // 禁用键盘交互
  doubleClickZoom: true, // 双击缩放
  scrollWheel: true, // 滚轮缩放
  touchZoom: true, // 移动端触摸缩放
  touchZoomCenter: 1, // 手势缩放以地图中心为基准点
  animateEnable: true, // 地图平移过程中是否使用动画
  jogEnable: false, // 是否允许设置俯仰角度
  buildingAnimation: false, // 楼块出现是否带动画
  expandZoomRange: true, // 是否支持可以扩展最大缩放级别
  zooms: [3, 20], // 缩放级别范围：最小3级，最大20级
  showLabel: true, // 是否显示地图文字标注
  defaultCursor: 'pointer' // 地图默认鼠标样式
}

// 地图样式选项
export const MAP_STYLES = {
  normal: 'amap://styles/normal',        // 标准
  grey: 'amap://styles/grey',            // 灰色
  whitesmoke: 'amap://styles/whitesmoke', // 白烟
  dark: 'amap://styles/dark',            // 深色
  light: 'amap://styles/light',          // 浅色
  graffiti: 'amap://styles/graffiti'     // 涂鸦
}

// 地图图层类型
export const MAP_LAYERS = {
  satellite: 'Satellite',    // 卫星图
  roadNet: 'RoadNet',       // 路网图
  traffic: 'Traffic',       // 实时交通图
  buildings: 'Buildings'    // 楼块图层
}

/**
 * 设置高德地图安全配置 - 优化版
 */
export const setupAMapSecurity = () => {
  if (typeof window !== 'undefined') {
    // 建议：优先使用代理服务器方式（更安全）
    if (import.meta.env.VITE_AMAP_PROXY_HOST) {
      window._AMapSecurityConfig = {
        serviceHost: import.meta.env.VITE_AMAP_PROXY_HOST + '/_AMapService'
      }
    } else {
      // 开发环境使用明文方式
      window._AMapSecurityConfig = {
        securityJsCode: AMAP_SECURITY_CODE
      }
    }
  }
}

/**
 * 使用 AMapLoader 加载高德地图（官方推荐方式）
 * 优势：
 * 1. 有效避免错误异步加载导致的资源加载不完整问题
 * 2. 对于加载混用多个版本给予报错处理
 * 3. 支持插件加载
 * 4. 允许多次执行加载操作，网络资源不会重复请求
 * @param config 地图配置
 * @returns Promise<AMap>
 */
export const loadAMap = async (config: Partial<AMapConfig> = {}): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 设置安全配置
      setupAMapSecurity()

      // 动态导入 AMapLoader
      const AMapLoader = (await import('@amap/amap-jsapi-loader')).default

      // 合并配置
      const finalConfig = { 
        ...AMAP_CONFIG, 
        ...config,
        plugins: config.plugins || AMAP_CONFIG.plugins
      }

      // 使用 AMapLoader 加载地图
      const AMap = await AMapLoader.load(finalConfig)
      
      // 验证 AMap 对象是否正确加载
      if (!AMap || !AMap.Map) {
        throw new Error('AMap 对象加载失败')
      }

      console.log('高德地图 JS API 加载成功，版本：', AMap.version || '2.0')
      resolve(AMap)
    } catch (error) {
      console.error('高德地图加载失败:', error)
      
      // 详细的错误信息
      let errorMessage = '地图加载失败'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      reject(new Error(`高德地图加载失败: ${errorMessage}`))
    }
  })
}

/**
 * 创建地图实例的工具函数
 * @param containerId 地图容器ID
 * @param options 地图配置选项
 * @returns Promise<AMap.Map>
 */
export const createMapInstance = async (
  containerId: string, 
  options: Partial<typeof DEFAULT_MAP_OPTIONS> = {}
): Promise<any> => {
  try {
    const AMap = await loadAMap()
    
    // 检查容器是否存在
    const container = document.getElementById(containerId)
    if (!container) {
      throw new Error(`地图容器 #${containerId} 不存在`)
    }

    const mapOptions = { ...DEFAULT_MAP_OPTIONS, ...options }
    const map = new AMap.Map(containerId, mapOptions)

    // 地图加载完成后的回调
    map.on('complete', () => {
      console.log('地图初始化完成')
    })

    // 地图加载错误的回调
    map.on('error', (error: any) => {
      console.error('地图加载出错:', error)
    })

    return map
  } catch (error) {
    console.error('创建地图实例失败:', error)
    throw error
  }
}

/**
 * 销毁地图实例
 * @param map 地图实例
 */
export const destroyMap = (map: any) => {
  if (map && typeof map.destroy === 'function') {
    try {
      map.destroy()
      console.log('地图实例已销毁')
    } catch (error) {
      console.error('销毁地图实例时出错:', error)
    }
  }
}

/**
 * 获取地图中心点
 * @param map 地图实例
 * @returns 中心点坐标
 */
export const getMapCenter = (map: any) => {
  if (map && typeof map.getCenter === 'function') {
    return map.getCenter()
  }
  return null
}

/**
 * 设置地图中心点
 * @param map 地图实例
 * @param lng 经度
 * @param lat 纬度
 * @param zoom 缩放级别（可选）
 */
export const setMapCenter = async (map: any, lng: number, lat: number, zoom?: number) => {
  if (!map) return
  
  try {
    const AMap = await loadAMap()
    const center = new AMap.LngLat(lng, lat)
    
    if (zoom !== undefined) {
      map.setZoomAndCenter(zoom, center, false)
    } else {
      map.setCenter(center, false)
    }
  } catch (error) {
    console.error('设置地图中心点失败:', error)
  }
}

// 导出类型声明
declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode?: string
      serviceHost?: string
    }
    AMapLoader?: any
    AMap?: any
  }
}
