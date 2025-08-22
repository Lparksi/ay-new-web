# 高德地图集成说明

本项目已集成高德地图 JavaScript API v2.0，提供地图展示、定位、标记等功能。

## 配置步骤

### 1. 申请高德地图 API Key

1. 访问 [高德开放平台控制台](https://console.amap.com/dev/key/app)
2. 注册并登录账号
3. 创建新应用，选择 Web 端（JS API）
4. 获取 API Key 和安全密钥

### 2. 配置环境变量

在项目根目录的 `.env` 文件中配置：

```env
# 高德地图 API Key
VITE_AMAP_KEY=你的API_KEY

# 高德地图安全密钥 (2021年12月02日后申请的Key需要配置)
VITE_AMAP_SECURITY_CODE=你的安全密钥
```

### 3. 启动项目

```bash
npm run dev
# 或
yarn dev
```

## 功能特性

### 基础功能
- ✅ 地图展示
- ✅ 地图缩放、拖拽、旋转
- ✅ 地图控件（比例尺、工具条、罗盘）
- ✅ 地图样式切换

### 定位功能
- ✅ 浏览器定位
- ✅ 定位结果展示
- ✅ 定位精度显示

### 标记功能
- ✅ 添加地图标记
- ✅ 标记信息窗体
- ✅ 批量清除标记

### 事件交互
- ✅ 地图点击事件
- ✅ 地图移动事件
- ✅ 缩放级别变化事件

## 技术实现

### 架构设计
- 使用官方推荐的 `AMapLoader` 动态加载
- 封装地图配置和工具函数
- 支持环境变量配置

### 核心文件
```
src/
├── pages/Map.vue           # 地图页面组件
├── utils/amap.ts          # 高德地图工具函数
└── .env                   # 环境变量配置
```

### 配置说明

#### 地图配置 (`src/utils/amap.ts`)
```typescript
export const DEFAULT_MAP_OPTIONS = {
  viewMode: '2D',                    // 2D/3D 模式
  zoom: 10,                          // 初始缩放级别
  center: [116.397428, 39.90923],    // 初始中心点
  mapStyle: 'amap://styles/normal',  // 地图样式
  resizeEnable: true,                // 允许容器大小调整
  rotateEnable: true,                // 允许旋转
  pitchEnable: true,                 // 允许倾斜
  zoomEnable: true,                  // 允许缩放
  dragEnable: true                   // 允许拖拽
}
```

#### 可用地图样式
```typescript
export const MAP_STYLES = {
  normal: 'amap://styles/normal',        // 标准
  grey: 'amap://styles/grey',            // 灰色
  whitesmoke: 'amap://styles/whitesmoke', // 白烟
  dark: 'amap://styles/dark',            // 深色
  light: 'amap://styles/light',          // 浅色
  graffiti: 'amap://styles/graffiti'     // 涂鸦
}
```

## 使用示例

### 基础地图使用
```vue
<template>
  <div id="map-container"></div>
</template>

<script setup>
import { loadAMap, DEFAULT_MAP_OPTIONS } from '@/utils/amap'

const initMap = async () => {
  const AMap = await loadAMap()
  const map = new AMap.Map('map-container', DEFAULT_MAP_OPTIONS)
}
</script>
```

### 添加标记
```javascript
const marker = new AMap.Marker({
  position: [116.39, 39.9],
  title: '标记标题'
})
map.add(marker)
```

### 定位功能
```javascript
const geolocation = new AMap.Geolocation({
  enableHighAccuracy: true,
  timeout: 10000
})
geolocation.getCurrentPosition()
```

## 注意事项

1. **安全密钥**: 2021年12月02日后申请的 Key 必须配置安全密钥
2. **HTTPS**: 定位功能需要在 HTTPS 环境下使用
3. **域名白名单**: 生产环境需要在控制台配置域名白名单
4. **配额限制**: 注意 API 调用频率和配额限制

## 相关链接

- [高德地图 JavaScript API v2.0 文档](https://lbs.amap.com/api/javascript-api-v2/summary)
- [高德开放平台控制台](https://console.amap.com/dev/key/app)
- [官方示例中心](https://lbs.amap.com/demo/center)
- [API 参考手册](https://lbs.amap.com/api/javascript-api-v2/documentation)

## 问题排查

### 常见问题

1. **地图无法显示**
   - 检查 API Key 是否正确
   - 检查安全密钥配置
   - 检查控制台错误信息

2. **定位失败**
   - 确保在 HTTPS 环境下使用
   - 检查浏览器权限设置
   - 确认网络连接正常

3. **样式问题**
   - 确保地图容器有明确的宽高
   - 检查 CSS 样式冲突

### 调试技巧
- 打开浏览器开发者工具查看控制台日志
- 使用官方示例对比功能实现
- 参考 API 文档检查参数配置
