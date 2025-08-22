# 高德地图配置最佳实践

## 概述

本文档描述了在 Vue 3 项目中集成高德地图 JavaScript API 2.0 的最佳实践。

## 已实施的优化

### 1. 使用官方推荐的 AMapLoader

- 使用 `@amap/amap-jsapi-loader` 包进行地图加载
- 有效避免错误异步加载导致的资源加载不完整问题
- 支持插件加载和版本管理
- 允许多次执行加载操作，网络资源不会重复请求

### 2. 安全配置优化

- 支持代理服务器方式（生产环境推荐）
- 支持明文安全密钥方式（开发环境）
- 环境变量配置，避免密钥硬编码

### 3. 地图配置优化

- 优化了默认地图配置参数
- 禁用了不必要的交互功能（旋转、倾斜、键盘）
- 设置了合理的缩放级别范围（3-20）
- 启用了性能优化选项

### 4. 错误处理和生命周期管理

- 完善的错误处理机制
- 正确的组件生命周期管理
- 地图实例和标记点的清理

### 5. 工具函数

- `createMapInstance`: 创建地图实例
- `destroyMap`: 销毁地图实例
- `setMapCenter`: 设置地图中心点
- `getMapCenter`: 获取地图中心点

## 环境变量配置

在 `.env.local` 文件中配置以下变量：

```bash
# 高德地图 API Key（必填）
VITE_AMAP_KEY=your_amap_api_key_here

# 高德地图安全密钥（必填）
VITE_AMAP_SECURITY_CODE=your_security_code_here

# 代理服务器地址（可选，生产环境推荐）
VITE_AMAP_PROXY_HOST=http://your-proxy-server.com
```

## 使用示例

### 基本用法

```typescript
import { loadAMap, DEFAULT_MAP_OPTIONS } from '@/utils/amap'

// 加载地图
const AMap = await loadAMap()

// 创建地图实例
const map = new AMap.Map('container', DEFAULT_MAP_OPTIONS)
```

### 自定义配置

```typescript
// 自定义插件加载
const AMap = await loadAMap({
  plugins: ['AMap.Scale', 'AMap.Marker', 'AMap.InfoWindow']
})

// 自定义地图配置
const map = new AMap.Map('container', {
  ...DEFAULT_MAP_OPTIONS,
  zoom: 15,
  center: [116.397428, 39.90923]
})
```

## 最佳实践建议

### 1. 生产环境安全

- 使用代理服务器转发 API 请求
- 避免在前端代码中直接暴露安全密钥
- 配置域名白名单

### 2. 性能优化

- 合理设置地图缩放级别范围
- 按需加载插件
- 及时清理地图实例和标记点

### 3. 错误处理

- 监听地图加载错误事件
- 提供用户友好的错误提示
- 记录详细的错误日志

### 4. 组件化

- 将地图功能封装为可复用组件
- 使用 Vue 生命周期正确管理地图实例
- 提供清晰的 API 接口

## 常见问题

### Q: 地图加载失败怎么办？

1. 检查 API Key 和安全密钥是否正确
2. 检查网络连接
3. 查看浏览器控制台错误信息
4. 确认域名是否在白名单中

### Q: 如何提高地图加载速度？

1. 只加载必要的插件
2. 使用 CDN 加速
3. 合理设置地图初始化参数
4. 避免频繁重新创建地图实例

### Q: 生产环境部署注意事项？

1. 配置代理服务器
2. 设置正确的域名白名单
3. 使用 HTTPS
4. 监控 API 调用量

## 更新记录

- 2025-08-22: 完成高德地图最佳实践改造
  - 更新地图中心点坐标为 114.392480, 36.098779
  - 缩放级别设置为 12
  - 集成 AMapLoader 加载方式
  - 优化错误处理和生命周期管理
