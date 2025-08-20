<template>
  <div class="profile-page">
    <!-- 用户头像卡片 -->
    <t-card class="user-header-card" :bordered="false" :shadow="true">
      <div class="user-header-content">
        <div class="user-avatar-section">
          <t-avatar 
            :size="64" 
            shape="circle"
            theme="primary"
            class="user-avatar"
          >
            {{ (currentUser?.full_name || currentUser?.username || 'U').charAt(0).toUpperCase() }}
          </t-avatar>
          <t-tag 
            :theme="currentUser?.active ? 'success' : 'danger'" 
            variant="light" 
            size="small"
            class="user-status-tag"
          >
            {{ currentUser?.active ? '激活' : '禁用' }}
          </t-tag>
        </div>
        <div class="user-info-section">
          <div class="user-main-info">
            <h3 class="user-name">{{ currentUser?.full_name || currentUser?.username || '未知用户' }}</h3>
            <div class="user-meta">
              <t-tag theme="default" variant="outline" size="small">ID: {{ currentUser?.id }}</t-tag>
              <span class="join-time">{{ formatJoinTime(currentUser?.created_at) }}</span>
            </div>
          </div>
          <div class="user-stats-grid">
            <div class="stat-card">
              <div class="stat-number">{{ currentUser?.roles?.length || 0 }}</div>
              <div class="stat-label">角色</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ currentUser?.permissions?.length || 0 }}</div>
              <div class="stat-label">权限</div>
            </div>
          </div>
        </div>
      </div>
    </t-card>

    <!-- 信息网格 -->
    <t-row :gutter="[12, 12]" class="info-grid">
      <!-- 基本信息 -->
      <t-col :span="24">
        <t-card title="基本信息" size="small" :header-bordered="true" class="info-card">
          <t-descriptions :column="1" size="small">
            <t-descriptions-item label="用户名">
              {{ currentUser?.username || '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="姓名">
              {{ currentUser?.full_name || '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="创建时间">
              {{ formatDate(currentUser?.created_at) }}
            </t-descriptions-item>
            <t-descriptions-item label="更新时间">
              {{ formatDate(currentUser?.updated_at) }}
            </t-descriptions-item>
          </t-descriptions>
        </t-card>
      </t-col>

      <!-- 角色信息 -->
      <t-col :span="24">
        <t-card title="角色信息" size="small" :header-bordered="true" class="info-card">
          <div class="roles-container">
            <t-space v-if="currentUser?.roles?.length" direction="vertical" size="4">
              <t-tag 
                v-for="role in currentUser.roles" 
                :key="role.ID"
                theme="primary"
                variant="light"
                size="small"
                class="role-tag"
              >
                {{ role.DisplayName || role.Name }}
              </t-tag>
            </t-space>
            <t-empty v-else size="small" description="暂无角色" />
          </div>
        </t-card>
      </t-col>

      <!-- 权限概览 -->
      <t-col :span="24">
        <t-card title="权限概览" size="small" :header-bordered="true" class="info-card">
          <div class="permissions-overview">
            <t-list v-if="permissionsByCategory && Object.keys(permissionsByCategory).length" size="small" :split="false">
              <t-list-item 
                v-for="(permissions, category) in Object.fromEntries(Object.entries(permissionsByCategory).slice(0, 3))" 
                :key="category"
                class="permission-category-item"
              >
                <t-list-item-meta>
                  <template #title>
                    <div class="category-title-row">
                      <span class="category-name">{{ getCategoryDisplayName(String(category)) }}</span>
                      <t-tag size="small" theme="default" variant="outline">{{ permissions.length }}</t-tag>
                    </div>
                  </template>
                  <template #description>
                    <t-space size="2">
                      <t-tag 
                        v-for="permission in permissions.slice(0, 2)" 
                        :key="permission.ID"
                        size="small"
                        theme="default"
                        variant="light"
                        class="permission-mini-tag"
                      >
                        {{ (permission.Description || permission.Name).substring(0, 6) }}
                      </t-tag>
                      <span v-if="permissions.length > 2" class="more-text">+{{ permissions.length - 2 }}</span>
                    </t-space>
                  </template>
                </t-list-item-meta>
              </t-list-item>
            </t-list>
            <t-empty v-else size="small" description="暂无权限" />
          </div>
        </t-card>
      </t-col>

      <!-- 安全设置 -->
      <t-col :span="24">
        <t-card title="安全设置" size="small" :header-bordered="true" class="info-card">
          <t-list size="small" :split="false">
            <t-list-item>
              <t-list-item-meta title="修改密码" description="定期更新密码保障安全" />
              <template #action>
                <t-button 
                  theme="primary" 
                  variant="outline" 
                  size="small"
                  @click="showPasswordDialog = true"
                >
                  修改
                </t-button>
              </template>
            </t-list-item>
          </t-list>
        </t-card>
      </t-col>

      <!-- 更多权限（如果存在） -->
      <t-col v-if="permissionsByCategory && Object.keys(permissionsByCategory).length > 3" :span="24">
        <t-card title="更多权限" size="small" :header-bordered="true" class="info-card">
          <div class="more-permissions-grid">
            <div 
              v-for="(permissions, category) in Object.fromEntries(Object.entries(permissionsByCategory).slice(3))" 
              :key="category"
              class="permission-category-mini"
            >
              <div class="category-mini-header">
                <span class="category-mini-name">{{ getCategoryDisplayName(String(category)) }}</span>
                <t-tag size="small" theme="default" variant="light">{{ permissions.length }}</t-tag>
              </div>
              <div class="permissions-mini-list">
                <t-tooltip 
                  v-for="permission in permissions.slice(0, 4)" 
                  :key="permission.ID"
                  :content="permission.Description || permission.Name"
                  placement="top"
                >
                  <div class="permission-mini-item">
                    {{ (permission.Description || permission.Name).substring(0, 8) }}...
                  </div>
                </t-tooltip>
                <div v-if="permissions.length > 4" class="more-mini-count">
                  +{{ permissions.length - 4 }}
                </div>
              </div>
            </div>
          </div>
        </t-card>
      </t-col>
    </t-row>
    
    <!-- 密码修改弹窗 -->
    <PasswordUpdateDialog 
      v-model:visible="showPasswordDialog"
      @success="onPasswordUpdateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAuthStore } from '../stores/auth'
import { fetchCurrentUser } from '../api/user'
import PasswordUpdateDialog from '../components/User/PasswordUpdateDialog.vue'

const authStore = useAuthStore()
const showPasswordDialog = ref(false)
const currentUser = ref<any>(null)

const userInfoItems = computed(() => {
  if (!currentUser.value) return []
  
  const user = currentUser.value
  
  // 格式化角色显示
  const rolesDisplay = user.roles && user.roles.length > 0 
    ? user.roles.map((role: any) => role.DisplayName || role.Name).join(', ')
    : (user.role || '-')
  
  // 格式化权限显示
  const permissionsDisplay = user.permissions && user.permissions.length > 0
    ? `${user.permissions.length} 项权限`
    : '-'
  
  return [
    { label: '用户名', content: user.username || '-' },
    { label: '姓名', content: user.full_name || '-' },
    { label: '状态', content: user.active ? '激活' : '禁用' },
    { label: '角色', content: rolesDisplay },
    { label: '权限', content: permissionsDisplay },
    { label: '创建时间', content: user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-' },
    { label: '更新时间', content: user.updated_at ? new Date(user.updated_at).toLocaleDateString('zh-CN') : '-' }
  ]
})

// 按类别分组权限
const permissionsByCategory = computed(() => {
  if (!currentUser.value?.permissions) return {}
  
  const grouped: Record<string, any[]> = {}
  currentUser.value.permissions.forEach((permission: any) => {
    const category = permission.Category || 'other'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(permission)
  })
  
  return grouped
})

// 获取分类显示名称
const getCategoryDisplayName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'user': '用户管理',
    'role': '角色管理',
    'auth': '认证授权',
    'task': '任务管理',
    'merchant': '商户管理',
    'tag': '标签管理',
    'other': '其他权限'
  }
  return categoryMap[category] || category
}

// 格式化日期
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  } catch {
    return dateStr
  }
}

// 格式化加入时间（更友好的显示）
const formatJoinTime = (dateStr?: string): string => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 7) {
      return `${diffDays} 天前加入`
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} 周前加入`
    } else if (diffDays <= 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} 个月前加入`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${years} 年前加入`
    }
  } catch {
    return formatDate(dateStr)
  }
}

const loadCurrentUser = async () => {
  try {
    currentUser.value = await fetchCurrentUser()
  } catch (error: any) {
    MessagePlugin.error(error.message || '获取用户信息失败')
  }
}

const onPasswordUpdateSuccess = () => {
  MessagePlugin.success('密码修改成功，请重新登录')
  // 可以选择是否强制用户重新登录
  // authStore.logout()
  // router.push('/login')
}

onMounted(() => {
  loadCurrentUser()
})
</script>

<style scoped>
.profile-page {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 用户头像卡片 */
.user-header-card {
  margin-bottom: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-header-card :deep(.t-card__body) {
  padding: 20px;
}

.user-header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-avatar-section {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-status-tag {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: white !important;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-info-section {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-main-info .user-name {
  margin: 0 0 8px 0;
  color: white;
  font-size: 20px;
  font-weight: 600;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.join-time {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.user-stats-grid {
  display: flex;
  gap: 16px;
}

.stat-card {
  text-align: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.stat-number {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}

/* 信息网格 */
.info-grid {
  margin-top: 0;
}

.info-card {
  height: 100%;
}

.info-card :deep(.t-card__body) {
  padding: 12px;
}

.info-card :deep(.t-card__header) {
  padding: 8px 12px;
  min-height: auto;
}

/* 角色容器 */
.roles-container {
  min-height: 60px;
  display: flex;
  align-items: center;
}

.role-tag {
  white-space: nowrap;
}

/* 权限概览 */
.permissions-overview {
  min-height: 80px;
}

.permission-category-item {
  padding: 4px 0 !important;
}

.category-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-name {
  font-size: 13px;
  font-weight: 500;
}

.permission-mini-tag {
  font-size: 11px !important;
  padding: 2px 6px !important;
  line-height: 1.2 !important;
}

.more-text {
  font-size: 11px;
  color: #999;
}

/* 更多权限网格 */
.more-permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.permission-category-mini {
  background: #fafafa;
  border-radius: 6px;
  padding: 8px;
  border: 1px solid #f0f0f0;
}

.category-mini-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.category-mini-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.permissions-mini-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.permission-mini-item {
  font-size: 10px;
  padding: 2px 4px;
  background: #e8f4fd;
  border-radius: 3px;
  color: #0052d9;
  cursor: pointer;
  transition: background-color 0.2s;
}

.permission-mini-item:hover {
  background: #d4edff;
}

.more-mini-count {
  font-size: 10px;
  color: #999;
  font-style: italic;
  align-self: center;
}

/* TDesign 组件样式覆盖 */
:deep(.t-descriptions-item__label) {
  color: #666;
  font-weight: 500;
  font-size: 13px;
}

:deep(.t-descriptions-item__content) {
  color: #333;
  font-size: 13px;
}

:deep(.t-list-item) {
  padding: 6px 0 !important;
}

:deep(.t-list-item__meta-title) {
  font-size: 13px !important;
  font-weight: 500 !important;
}

:deep(.t-list-item__meta-description) {
  font-size: 12px !important;
  color: #666 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-header-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .user-info-section {
    flex-direction: column;
    gap: 12px;
  }
  
  .user-stats-grid {
    gap: 12px;
  }
  
  .more-permissions-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .profile-page {
    padding: 12px;
  }
  
  .user-header-card :deep(.t-card__body) {
    padding: 16px;
  }
  
  .info-card :deep(.t-card__body) {
    padding: 8px;
  }
  
  .info-card :deep(.t-card__header) {
    padding: 6px 8px;
  }
}
</style>
