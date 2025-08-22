<template>
  <div class="tag-select-container">
    <!-- 新建标签输入区域 -->
    <div class="create-tag-section">
      <t-space size="small" style="width: 100%;">
        <t-input 
          v-model="newTagName" 
          placeholder="输入新标签名称" 
          clearable
          data-test="t-new-input"
          style="flex: 1;"
          @keyup.enter="createNewTag"
        />
        <t-button 
          theme="primary" 
          size="small" 
          @click="createNewTag" 
          :loading="creating"
          :disabled="!newTagName.trim()"
          data-test="t-create-btn"
        >
          <template #icon v-if="!creating">
            <add-icon />
          </template>
          {{ creating ? '创建中...' : '创建标签' }}
        </t-button>
      </t-space>
    </div>

    <!-- 搜索和选择区域 -->
    <div class="select-tag-section">
      <t-input 
        v-model="searchKeyword" 
        placeholder="搜索已有标签..." 
        clearable
        data-test="t-search"
        @input="handleSearch"
        style="margin-bottom: 8px;"
      >
        <template #prefix-icon>
          <search-icon />
        </template>
      </t-input>
      
      <t-select
        v-model="selectedTagIds"
        multiple
        :options="filteredOptions"
        collapse-tags
        style="width: 100%;"
        placeholder="选择已有标签"
        data-test="t-select"
        @change="handleSelectionChange"
        :loading="loading"
      >
        <template #empty>
          <div style="text-align: center; padding: 16px; color: #999;">
            {{ searchKeyword ? '未找到匹配的标签' : '暂无可选标签' }}
          </div>
        </template>
      </t-select>
    </div>

    <!-- 已选标签展示 -->
    <div v-if="selectedTags.length > 0" class="selected-tags-display">
      <div class="selected-tags-title">已选标签:</div>
      <t-space size="small" break-line>
        <t-tag
          v-for="tag in selectedTags"
          :key="tag.value"
          closable
          @close="removeTag(tag.value)"
          theme="primary"
          variant="light"
        >
          {{ tag.label }}
        </t-tag>
      </t-space>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch } from 'vue'
import { fetchTags, createTag } from '../../api/tag'
import { Input, Select, Button, Space, Tag } from 'tdesign-vue-next'
import { AddIcon, SearchIcon } from 'tdesign-icons-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'

interface TagOption {
  label: string
  value: string
}

export default defineComponent({
  name: 'TagSelect',
  components: { 
    TInput: Input, 
    TSelect: Select, 
    TButton: Button, 
    TSpace: Space,
    TTag: Tag,
    AddIcon,
    SearchIcon
  },
  props: { 
    modelValue: { 
      type: Array as () => number[], 
      default: () => [] 
    } 
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    // 搜索和选项相关
    const searchKeyword = ref('')
    const allOptions = ref<TagOption[]>([])
    const loading = ref(false)
    
    // 新建标签相关
    const newTagName = ref('')
    const creating = ref(false)

    // 选中的标签ID列表（字符串格式，与Select组件兼容）
    const selectedTagIds = ref<string[]>([])

    // 根据搜索关键词过滤选项
    const filteredOptions = computed(() => {
      if (!searchKeyword.value.trim()) {
        return allOptions.value
      }
      const keyword = searchKeyword.value.toLowerCase()
      return allOptions.value.filter(option => 
        option.label.toLowerCase().includes(keyword)
      )
    })

    // 已选标签的详细信息
    const selectedTags = computed(() => {
      return selectedTagIds.value.map(id => {
        const option = allOptions.value.find(opt => opt.value === id)
        return option || { label: `标签${id}`, value: id }
      })
    })

    // 加载标签数据
    async function loadTags(query = '') {
      try {
        loading.value = true
        const response = await fetchTags({ q: query, page: 1, pageSize: 100 })
        const items = Array.isArray(response) ? response : (response.items || [])
        allOptions.value = items.map((tag: any) => ({
          label: tag.name,
          value: String(tag.id)
        }))
      } catch (error) {
        console.error('加载标签失败:', error)
        MessagePlugin.error('加载标签失败')
      } finally {
        loading.value = false
      }
    }

    // 处理搜索
    function handleSearch() {
      loadTags(searchKeyword.value)
    }

    // 创建新标签
    async function createNewTag() {
      const name = newTagName.value.trim()
      if (!name) return

      creating.value = true
      try {
        const response = await createTag({ name })
        const newTag = response.data || response
        
        // 映射后端字段到前端期望的格式
        const tagName = newTag.tag_name || newTag.name || name
        const tagId = newTag.ID || newTag.id
        
        // 添加新标签到选项列表
        const newOption = { label: tagName, value: String(tagId) }
        allOptions.value = [newOption, ...allOptions.value]
        
        // 自动选中新创建的标签
        const newSelectedIds = [...selectedTagIds.value, newOption.value]
        selectedTagIds.value = newSelectedIds
        
        // 发出更新事件
        const numericIds = newSelectedIds.map(id => Number(id))
        emit('update:modelValue', numericIds)
        emit('change', numericIds)
        
        // 清空输入框
        newTagName.value = ''
        MessagePlugin.success(`标签"${tagName}"创建成功`)
      } catch (error) {
        console.error('创建标签失败:', error)
        MessagePlugin.error('创建标签失败')
      } finally {
        creating.value = false
      }
    }

    // 处理选择变化
    function handleSelectionChange(value: any) {
      const selectedIds = Array.isArray(value) ? value : []
      selectedTagIds.value = selectedIds
      const numericIds = selectedIds.map((id: any) => Number(id))
      emit('update:modelValue', numericIds)
      emit('change', numericIds)
    }

    // 移除标签
    function removeTag(tagId: string) {
      const newSelectedIds = selectedTagIds.value.filter(id => id !== tagId)
      handleSelectionChange(newSelectedIds)
    }

    // 监听props变化，同步内部状态
    watch(() => props.modelValue, (newValue) => {
      selectedTagIds.value = (newValue || []).map(id => String(id))
    }, { immediate: true })

    // 组件挂载时加载数据
    onMounted(() => {
      loadTags()
    })

    return {
      // 数据
      searchKeyword,
      allOptions,
      filteredOptions,
      selectedTagIds,
      selectedTags,
      newTagName,
      loading,
      creating,
      
      // 方法
      handleSearch,
      createNewTag,
      handleSelectionChange,
      removeTag
    }
  },
})
</script>

<style scoped>
.tag-select-container {
  width: 100%;
}

.create-tag-section {
  margin-bottom: 12px;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.select-tag-section {
  margin-bottom: 12px;
}

.selected-tags-display {
  margin-top: 12px;
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
}

.selected-tags-title {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

/* 优化按钮样式 */
:deep(.t-button--size-small) {
  padding: 4px 12px;
  font-weight: 500;
}

/* 优化输入框样式 */
:deep(.t-input) {
  border-radius: 4px;
}

:deep(.t-select) {
  border-radius: 4px;
}

/* 标签样式优化 */
:deep(.t-tag) {
  border-radius: 12px;
  font-weight: 500;
}

:deep(.t-tag--theme-primary.t-tag--variant-light) {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #1d4ed8;
}
</style>