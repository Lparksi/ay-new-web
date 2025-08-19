<template>
  <div>
    <t-input clearable v-model:value="q" data-test="m-search" placeholder="搜索商家..." @input="onSearch" style="width:320px;margin-bottom:8px" />
    <t-select
      v-if="!useVirtualList"
      data-test="m-select"
      v-model:value="internalValueLocal"
      multiple
      :options="options"
      collapse-tags
      style="width:100%"
      @change="onChange"
    />
    <div v-else style="max-height:240px;overflow:auto;border:1px solid #f0f0f0;border-radius:4px">
      <div v-for="item in options" :key="item.value" style="padding:8px;cursor:pointer;display:flex;align-items:center" @click="onVirtualSelect(item.value)">
        <input type="checkbox" :checked="internalValueLocal.includes(item.value)" />
        <span style="margin-left:8px">{{ item.label }}</span>
      </div>
    </div>
    <div style="margin-top:8px;text-align:center">
  <t-button v-if="hasMore && !useInfiniteScroll" size="small" theme="primary" variant="outline" @click="loadNext">加载更多</t-button>
  <span v-else-if="!loading && !useInfiniteScroll" style="color:#888">没有更多</span>
  <!-- sentinel for infinite scroll -->
  <div v-if="useInfiniteScroll" ref="sentinelRef" data-test="m-sentinel" style="height:1px"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { fetchMerchants } from '../../api/merchant'
import { Input, Select } from 'tdesign-vue-next'

interface Props {
  modelValue?: number[]
  tags?: number[]
  autoLoad?: boolean
  maxAutoLoadPages?: number
  useInfiniteScroll?: boolean
  useVirtualList?: boolean
}

export default defineComponent({
  name: 'MerchantSelect',
  components: { TInput: Input, TSelect: Select },
  props: {
    modelValue: { type: Array, default: () => [] },
    tags: { type: Array, default: () => [] as number[] },
  autoLoad: { type: Boolean, default: true },
  maxAutoLoadPages: { type: Number, default: 5 },
  useInfiniteScroll: { type: Boolean, default: false },
  useVirtualList: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'change'],
  setup(props: Props, { emit }: { emit: (e: 'update:modelValue' | 'change', payload: any) => void }) {
    const q = ref('')
    const options = ref<{ label: string; value: string }[]>([])
    const internalValueLocal = ref<string[]>((props.modelValue || []).map(String))

    const loading = ref(false)
    let debounceTimer: any = null

    const page = ref(1)
    const pageSize = 50
    const hasMore = ref(false)
  const autoLoadedCount = ref(0)
  let observer: IntersectionObserver | null = null
  const sentinelRef = ref<HTMLElement | null>(null)

    async function load(qs = '', p = 1) {
      loading.value = true
      try {
        const resp = await fetchMerchants({ q: qs, page: p, pageSize, tags: props.tags })
        const items = Array.isArray(resp) ? resp : (resp.items || [])
        const mapped = items.map((m: any) => ({
          label: `${m.name}${m.address ? ' · ' + m.address : ''}${m.tags ? ' [' + (m.tags || []).map((t: any) => t.name || t).join(',') + ']' : ''}`,
          value: String(m.id),
        }))
        if (p > 1) {
          // append
          options.value = options.value.concat(mapped)
        } else {
          options.value = mapped
        }

        // determine if more pages likely exist
        if (!Array.isArray(resp) && typeof resp.total === 'number') {
          hasMore.value = p * pageSize < resp.total
        } else {
          // fallback: if returned length equals pageSize, assume there may be more
          hasMore.value = items.length === pageSize
        }
        page.value = p
        // if autoLoad enabled, schedule next page fetch (bounded)
        if ((props as any).autoLoad && hasMore.value) {
          // only auto-load up to configured max pages to avoid overfetch
          if (autoLoadedCount.value < (props as any).maxAutoLoadPages) {
            autoLoadedCount.value += 1
            // slight delay to yield to UI and avoid request storms
            setTimeout(() => {
              // don't await here so loads happen in background
              load(qs, p + 1)
            }, 200)
          }
        }
      } finally {
        loading.value = false
      }
    }

    function onSearch() {
      // debounce search to avoid flooding API
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        // reset to first page on new search
        load(q.value, 1)
      }, 200)
    }

    function loadNext() {
      if (loading.value) return
      // reset autoLoadedCount when user manually triggers more
      autoLoadedCount.value = 0
      load(q.value, page.value + 1)
    }

    function onChange(val: any) {
      // emit numbers to parent
      const nums = (val || []).map((v: any) => Number(v))
      emit('update:modelValue', nums)
      emit('change', nums)
    }

    function onVirtualSelect(val: string) {
      // toggle selection for multi-select
      const set = new Set(internalValueLocal.value || [])
      if (set.has(val)) set.delete(val)
      else set.add(val)
      internalValueLocal.value = Array.from(set)
      const nums = internalValueLocal.value.map((v: any) => Number(v))
      emit('update:modelValue', nums)
      emit('change', nums)
    }

    watch(() => props.modelValue, (v: number[] | undefined) => {
      internalValueLocal.value = (v || []).map(String)
    })

    watch(() => props.tags, () => {
      load(q.value)
    })

  onMounted(() => load())
    // setup intersection observer for infinite scroll when enabled
    onMounted(() => {
      if ((props as any).useInfiniteScroll && typeof window !== 'undefined' && 'IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && hasMore.value && !loading.value) {
              load(q.value, page.value + 1)
            }
          })
        }, { root: null, rootMargin: '200px', threshold: 0.1 })
        // attach when sentinel exists
        if (sentinelRef.value) observer.observe(sentinelRef.value)
      }
    })

    // re-observe when sentinel becomes available
    watch(sentinelRef, (el: HTMLElement | null) => {
      if (observer && el) observer.observe(el)
    })

    // cleanup
    onUnmounted(() => {
      if (observer) {
        observer.disconnect()
        observer = null
      }
    })
  return { q, options, onSearch, onChange, onVirtualSelect, internalValueLocal, hasMore, loading, loadNext, sentinelRef, useInfiniteScroll: props.useInfiniteScroll, useVirtualList: props.useVirtualList }
  },
})
</script>
