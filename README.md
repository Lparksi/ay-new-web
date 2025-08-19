# AY New Web - 任务管理系统前端

基于 Vue 3 + TypeScript + TDesign 的现代化任务管理系统前端应用。

## 🚀 功能特性

- **用户认证** - 完整的登录/登出系统，支持 JWT token 管理
- **任务管理** - 创建、编辑任务，支持优先级、时间范围、范围选择
- **用户管理** - 用户 CRUD 操作，支持分页和搜索
- **商家管理** - 商家信息管理，支持标签关联
- **标签管理** - 标签 CRUD，支持批量操作和软删除
- **响应式设计** - 适配桌面和移动端
- **类型安全** - 完整的 TypeScript 支持
- **测试覆盖** - 单元测试和端到端测试

## 🛠 技术栈

- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI 组件库**: TDesign Vue Next
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **测试框架**: Vitest (单元测试) + Playwright (E2E 测试)

## 📦 项目结构

```
src/
├── api/              # API 接口层
├── components/       # 可复用组件
│   ├── Layout/      # 布局组件
│   ├── Selectors/   # 选择器组件
│   └── User/        # 用户相关组件
├── pages/           # 页面组件
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
│   ├── validation.ts    # 表单验证
│   ├── notification.ts  # 通知系统
│   ├── error-handler.ts # 错误处理
│   └── form-validation.ts # 统一表单验证
└── test/            # 测试配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- Yarn >= 1.22

### 安装依赖

```bash
yarn install
```

### 开发环境

```bash
yarn dev
```

应用将在 http://localhost:5173 启动

### 环境变量配置

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:9001/api/v1
```

## 🧪 测试

### 单元测试

```bash
# 运行所有单元测试
yarn test:run

# 监听模式运行测试
yarn test

# 测试 UI 界面
yarn test:ui
```

### 端到端测试

```bash
# 运行 E2E 测试
yarn test:e2e

# E2E 测试 UI 模式
yarn test:e2e:ui

# 查看测试报告
yarn test:e2e:report
```

## 🏗 构建部署

### 类型检查

```bash
yarn type-check
```

### 生产构建

```bash
yarn build
```

### 预览构建结果

```bash
yarn preview
```

## 📋 开发指南

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 Composition API 最佳实践
- 组件命名使用 PascalCase
- 文件命名使用 kebab-case

### 表单验证

使用统一的表单验证系统：

```typescript
import { formValidationRules } from '@/utils/form-validation'

// 使用预定义规则
const rules = formValidationRules.user

// 或自定义规则
import { commonRules } from '@/utils/form-validation'
const customRules = {
  name: [
    commonRules.required('请输入姓名'),
    commonRules.maxLength(50)
  ]
}
```

### 错误处理

使用统一的错误处理系统：

```typescript
import { handleError } from '@/utils/error-handler'

try {
  await apiCall()
} catch (error) {
  handleError(error) // 自动显示用户友好的错误消息
}
```

### API 调用

所有 API 调用都通过 `src/api/` 目录下的模块进行：

```typescript
import { fetchUsers, createUser } from '@/api/user'

// 获取用户列表
const users = await fetchUsers({ page: 1, pageSize: 10 })

// 创建用户
const newUser = await createUser({ username: 'test', email: 'test@example.com' })
```

## 🔧 配置说明

### Vite 配置

- 支持路径别名 `@` 指向 `src` 目录
- 自动导入 Vue 相关 API
- 开发环境代理配置

### 路由配置

- 基于文件的路由结构
- 路由守卫进行权限控制
- 懒加载优化

### 状态管理

使用 Pinia 进行状态管理：

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  
  const login = async (credentials) => {
    // 登录逻辑
  }
  
  return { user, token, login }
})
```

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   yarn dev --port 3000
   ```

2. **依赖安装失败**
   ```bash
   rm -rf node_modules yarn.lock
   yarn install
   ```

3. **类型错误**
   ```bash
   yarn type-check
   ```

### 开发工具推荐

- **VSCode** + Volar 插件
- **Vue DevTools** 浏览器扩展
- **TypeScript Vue Plugin**

## 🔗 后端联调

确保后端服务运行在 http://localhost:9001：

```bash
cd ../ay-newbackend
go run ./cmd/server
```

## 📄 许可证

MIT License

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 支持

如有问题，请创建 Issue 或联系开发团队。