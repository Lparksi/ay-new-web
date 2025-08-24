<template>
  <div class="tag-select-container">
    <!-- 新建标签改为使用标签管理弹窗 -->
      <div class="create-tag-section">
        <t-space size="small" style="width: 100%;">
          <t-input 
            v-model="newTagName" 
            placeholder="输入新标签名称" 
            clearable
            data-test="t-new-input"
            style="flex: 1;"
            @keyup.enter="openTagManagerDialog"
          />
          <t-button 
            theme="primary" 
            size="small" 
            @click="openTagManagerDialog" 
            data-test="t-create-btn"
          >
            <template #icon>
              <add-icon />
            </template>
            创建标签
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
      
      <t-cascader
        v-model="selectedTagIds"
        :options="tagCascaderOptions"
        multiple
        clearable
        collapse-tags
        style="width: 100%;"
        placeholder="选择标签（多选）"
        data-test="t-cascader"
        @change="handleCascaderChange"
        :loading="loading"
      />
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

    <!-- 标签管理弹窗（用于创建/编辑标签） -->
    <t-dialog v-model:visible="showManager" :header="'标签管理'">
      <div style="padding: 12px 0;">
        <t-input v-model="managerForm.name" placeholder="标签名称" style="margin-bottom:8px;" />
        <t-input v-model="managerForm.alias" placeholder="别名（可选）" style="margin-bottom:8px;" />
        <t-input v-model="managerForm.class" placeholder="类别（可选）" style="margin-bottom:8px;" />
  <t-textarea v-model="managerForm.remarks" placeholder="备注（可选）" />
      </div>
      <template #footer>
        <t-space>
          <t-button variant="text" @click="showManager = false">取消</t-button>
          <t-button theme="primary" :loading="managerSubmitting" @click="submitManagerCreate">创建</t-button>
        </t-space>
      </template>
    </t-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch } from 'vue'
import { fetchTags, createTag } from '../../api/tag'
import { Input, Select, Button, Space, Tag, Dialog, Textarea } from 'tdesign-vue-next'
import { AddIcon, SearchIcon } from 'tdesign-icons-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'
import { formatTagLabel } from '../../utils/tags'

interface TagOption {
  label: string
  value: string
}

export default defineComponent({
  name: 'TagSelect',
  components: { 
  TInput: Input, 
  TTextarea: Textarea,
    TSelect: Select, 
    TButton: Button, 
    TSpace: Space,
    TTag: Tag,
    TDialog: Dialog,
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
  const showManager = ref(false)
  const managerForm = ref({ name: '', alias: '', class: '', remarks: '' })
  const managerSubmitting = ref(false)

    // 原始标签列表（后端 Tag 对象）
    const tagList = ref<any[]>([])

    // 选中的标签ID列表（允许数字或字符串）
    const selectedTagIds = ref<Array<string|number>>([])

    // 根据搜索关键词过滤级联选项（如果有搜索则只保留匹配的子项）
    const tagCascaderOptions = computed(() => {
      const groups: Record<string, any[]> = {}
      const allTags = tagList.value || []
      allTags.forEach((t: any) => {
        const cls = (t.class && String(t.class).trim()) || '其他'
        if (!groups[cls]) groups[cls] = []
        groups[cls].push(t)
      })

      const opts = Object.keys(groups)
        .sort()
        .map((cls) => ({
          label: `${cls} (${groups[cls].length})`,
          value: `class:${cls}`,
          children: groups[cls]
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .map((tg: any) => ({ label: formatTagLabel(tg), value: tg.id, title: `ID: ${tg.id}, 类别: ${cls}` }))
        }))

      // 如果没有搜索词，直接返回完整结构
      if (!searchKeyword.value || !searchKeyword.value.trim()) return opts

      const kw = searchKeyword.value.toLowerCase()
      // 仅保留子项中有匹配的类别
      return opts.map((grp: any) => ({
        ...grp,
        children: (grp.children || []).filter((c: any) => String(c.label || '').toLowerCase().includes(kw))
      })).filter((g: any) => (g.children || []).length > 0)
    })

    // 已选标签的详细信息（从 tagList 中映射）
    const selectedTags = computed(() => {
      return (selectedTagIds.value || []).map(id => {
        const nid = Number(id)
        const found = tagList.value.find((t: any) => Number(t.id) === nid)
        if (found) return { label: formatTagLabel(found), value: String(found.id) }
        return { label: `标签${id}`, value: String(id) }
      })
    })

    // 加载标签数据
  async function loadTags(query = '') {
      try {
        loading.value = true
        const response = await fetchTags({ q: query, page: 1, pageSize: 100 })
    const items = Array.isArray(response) ? response : (response.items || [])
    // 保持原始 tag 对象用于级联构建与映射
    tagList.value = items
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
    // 打开标签管理弹窗（用于创建标签）
    function openTagManagerDialog() {
      const initialName = (newTagName.value || '').trim()
      // 触发全局 CustomEvent，供 MerchantTags.vue 监听并打开创建弹窗
      try {
        const ev = new CustomEvent('open-tag-manager', { detail: { name: initialName } })
        window.dispatchEvent(ev)
      } catch (err) {
        // 回退到组件内置的弹窗
        managerForm.value = { name: initialName, alias: '', class: '', remarks: '' }
        showManager.value = true
      }
    }

    async function submitManagerCreate() {
      const name = (managerForm.value.name || '').trim()
      if (!name) {
        MessagePlugin.warning('请输入标签名称')
        return
      }
      managerSubmitting.value = true
      try {
        const resp = await createTag({ name: managerForm.value.name, alias: managerForm.value.alias, class: managerForm.value.class, remarks: managerForm.value.remarks })
        const newTag = resp.data || resp
        const tagObj = {
          id: newTag.ID || newTag.id,
          name: newTag.tag_name || newTag.name || name,
          alias: newTag.alias || newTag.Alias || '',
          class: newTag.class || newTag.Class || ''
        }
        const newOption = { label: formatTagLabel(tagObj), value: String(tagObj.id) }
        allOptions.value = [newOption, ...allOptions.value]

        // 自动选中新建标签
        const newSelected = [...selectedTagIds.value, newOption.value]
        selectedTagIds.value = newSelected
        const numericIds = newSelected.map(id => Number(id))
        emit('update:modelValue', numericIds)
        emit('change', numericIds)

        // 关闭弹窗并清空输入
        showManager.value = false
        newTagName.value = ''
        MessagePlugin.success(`标签 "${tagObj.name}" 创建成功`)
      } catch (err) {
        console.error('创建标签失败', err)
        MessagePlugin.error('创建标签失败')
      } finally {
        managerSubmitting.value = false
      }
    }
  // 使用共享 util: formatTagLabel

    // 处理级联选择变化
    function handleCascaderChange(value: any) {
      const selected = Array.isArray(value) ? value : []
      // 过滤掉非叶子（类别节点）值（类别值以 'class:' 前缀开头）
      const leafIds = selected.filter((v: any) => !(typeof v === 'string' && String(v).startsWith('class:')))
      selectedTagIds.value = leafIds
      const numericIds = leafIds.map((id: any) => Number(id))
      emit('update:modelValue', numericIds)
      emit('change', numericIds)
    }

    // 移除标签
    function removeTag(tagId: string) {
      const newSelectedIds = (selectedTagIds.value || []).filter(id => String(id) !== String(tagId))
      // 更新并触发变更
      handleCascaderChange(newSelectedIds)
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
      tagCascaderOptions,
      // 兼容展示
      selectedTagIds,
      selectedTags,
      newTagName,
      loading,
      creating,
      showManager,
      managerForm,
      managerSubmitting,
      
      // 方法
  handleSearch,
  openTagManagerDialog,
  submitManagerCreate,
  handleCascaderChange,
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