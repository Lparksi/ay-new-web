<template>
  <div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <t-input data-test="t-new-input" v-model:value="newName" placeholder="新建标签名称" />
      <t-button data-test="t-create-btn" theme="primary" size="small" @click="createNew" :loading="creating">创建</t-button>
    </div>

    <t-input clearable v-model:value="q" data-test="t-search" placeholder="搜索标签..." @input="onSearch" style="width:320px;margin-bottom:8px" />
    <t-select
      data-test="t-select"
      v-model:value="internalValueLocal"
      multiple
      :options="options"
      collapse-tags
      style="width:100%"
      @change="onChange"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch } from 'vue'
import { fetchTags, createTag } from '../../api/tag'
import { Input, Select, Button } from 'tdesign-vue-next'

export default defineComponent({
  name: 'TagSelect',
  components: { TInput: Input, TSelect: Select, TButton: Button },
  props: { modelValue: { type: Array, default: () => [] as number[] } },
  emits: ['update:modelValue', 'change'],
  setup(props: { modelValue?: number[] }, { emit }: { emit: (e: 'update:modelValue' | 'change', payload: any) => void }) {
    const q = ref('')
    const options = ref<{ label: string; value: string }[]>([])
    const internalValueLocal = ref<string[]>((props.modelValue || []).map(String))

    const newName = ref('')
    const creating = ref(false)

    async function load(qs = '') {
      const resp = await fetchTags({ q: qs, page: 1, pageSize: 50 })
      const items = Array.isArray(resp) ? resp : (resp.items || [])
      options.value = items.map((t: any) => ({ label: t.name, value: String(t.id) }))
    }

    function onSearch() {
      load(q.value)
    }

    async function createNew() {
      if (!newName.value || !newName.value.trim()) return
      creating.value = true
      try {
        const resp = await createTag({ name: newName.value.trim() })
        const tag = resp.data || resp
        const entry = { label: tag.name, value: String(tag.id) }
        // prepend new tag and select it
        options.value = [entry].concat(options.value)
        internalValueLocal.value = Array.from(new Set([...(internalValueLocal.value || []), entry.value]))
        emit('update:modelValue', internalValueLocal.value.map(Number))
        emit('change', internalValueLocal.value.map(Number))
        newName.value = ''
      } finally {
        creating.value = false
      }
    }

    function onChange(val: any) {
      const nums = (val || []).map((v: any) => Number(v))
      emit('update:modelValue', nums)
      emit('change', nums)
    }

    watch(() => props.modelValue, (v: number[] | undefined) => {
      internalValueLocal.value = (v || []).map(String)
    })

    onMounted(() => load())
    return { q, options, onSearch, onChange, internalValueLocal, newName, createNew, creating }
  },
})
</script>
