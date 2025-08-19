<template>
  <t-form :data="form" @submit="handleSubmit">
    <t-form-item label="用户名" name="username">
      <t-input v-model="form.username" placeholder="请输入用户名" />
    </t-form-item>

    <t-space>
      <t-button theme="primary" type="submit">{{ isEdit ? '更新' : '创建' }}</t-button>
      <t-button type="button" v-if="isEdit" @click="onCancel">取消</t-button>
    </t-space>
  </t-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { User } from '../../types'

const props = defineProps<{ modelValue?: User | null }>()
const emit = defineEmits<{
  (e: 'created', user: any): void
  (e: 'updated', payload: { id: number | string; data: any }): void
  (e: 'cancel'): void
}>()

const form = ref<any>({ username: '' })
const isEdit = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      form.value = { ...v }
      isEdit.value = true
    } else {
      form.value = { username: '' }
      isEdit.value = false
    }
  },
  { immediate: true }
)

function handleSubmit(ctx: any) {
  // t-form 的 submit 会返回校验结果，如果没有 rules 则直接通过
  const validateResult = ctx?.validateResult
  if (typeof validateResult !== 'undefined' && validateResult !== true) {
    // 如果有校验并不通过，则不继续提交（原表单无校验规则，此分支一般不执行）
    return
  }

  if (isEdit.value && props.modelValue) {
    emit('updated', { id: props.modelValue.id as any, data: { ...form.value } })
  } else {
    emit('created', { ...form.value })
  }

  // 重置表单为初始新建状态
  form.value = { username: '' }
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped></style>
