<template>
  <div class="user-select">
    <input data-test="search" v-model="q" @input="onSearch" placeholder="搜索用户..." />
    <select
      data-test="select"
      :multiple="multiple"
      @change="onChange($event)"
      :value="internalValue"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, computed } from 'vue'
import { fetchUsers } from '../../api/user'

export default defineComponent({
  name: 'UserSelect',
  props: {
    modelValue: { type: [Number, Array], default: null },
    multiple: { type: Boolean, default: false },
    pageSize: { type: Number, default: 10 },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const q = ref('')
    const options = ref<{ label: string; value: number }[]>([])
    const loading = ref(false)

    const internalValue = computed(() => props.modelValue)

    async function load(qs = '') {
      loading.value = true
      try {
        const resp = await fetchUsers({ q: qs, page: 1, pageSize: props.pageSize })
        const raw = Array.isArray(resp) ? resp : (resp.items || [])
        options.value = raw.map((u: any) => ({ label: u.username || u.full_name || (`user-${u.id}`), value: u.id }))
      } finally {
        loading.value = false
      }
    }

    function onSearch() {
      load(q.value)
    }

    function onChange(event: Event) {
      const target = event.target as HTMLSelectElement
      if (props.multiple) {
        const vals = Array.from(target.selectedOptions).map((o) => Number(o.value))
        emit('update:modelValue', vals)
        emit('change', vals)
      } else {
        const val = target.value ? Number(target.value) : null
        emit('update:modelValue', val)
        emit('change', val)
      }
    }

    onMounted(() => load())

    watch(() => props.pageSize, () => load(q.value))

    return { q, options, onSearch, onChange, internalValue, loading }
  },
})
</script>

<style scoped>
.user-select input {
  display: block;
  margin-bottom: 8px;
  padding: 6px;
  width: 100%;
}
.user-select select {
  width: 100%;
  padding: 6px;
}
</style>
