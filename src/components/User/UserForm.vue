<template>
  <t-dialog 
    v-model:visible="visible" 
    :header="isEdit ? '编辑用户' : '新建用户'"
    width="600px"
    :confirm-btn="null"
    :cancel-btn="null"
    @close="onCancel"
  >
    <t-form 
      ref="formRef"
      :data="form" 
      :rules="rules"
      layout="vertical"
      @submit="handleSubmit"
    >
      <t-form-item label="用户名" name="username">
        <t-input 
          v-model="form.username" 
          placeholder="请输入用户名"
          :disabled="isEdit"
        />
      </t-form-item>

      <t-form-item v-if="!isEdit" label="密码" name="password">
        <t-input 
          v-model="form.password" 
          placeholder="请输入密码"
          type="password"
        />
      </t-form-item>

      <t-form-item label="姓名" name="full_name">
        <t-input 
          v-model="form.full_name" 
          placeholder="请输入真实姓名"
        />
      </t-form-item>

      <t-form-item label="状态" name="active">
        <t-radio-group v-model="form.active">
          <t-radio :value="true">激活</t-radio>
          <t-radio :value="false">禁用</t-radio>
        </t-radio-group>
      </t-form-item>

      <t-form-item label="角色" name="role">
        <t-select 
          v-model="form.role" 
          :options="roleOptions"
          placeholder="请选择角色"
          clearable
        />
      </t-form-item>
    </t-form>

    <template #footer>
      <t-space>
        <t-button @click="onCancel">取消</t-button>
        <t-button 
          theme="primary" 
          :loading="submitting"
          @click="handleSubmit"
        >
          {{ isEdit ? '更新' : '创建' }}
        </t-button>
      </t-space>
    </template>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import type { User } from '../../types'
import type { FormInstanceFunctions } from 'tdesign-vue-next'

const props = defineProps<{ 
  modelValue?: User | null
  visible?: boolean
}>()

const emit = defineEmits<{
  (e: 'created', user: any): void
  (e: 'updated', payload: { id: number | string; data: any }): void
  (e: 'cancel'): void
  (e: 'update:visible', visible: boolean): void
}>()

const formRef = ref<FormInstanceFunctions>()
const submitting = ref(false)

// 角色选项 - 使用向后兼容的字符串值
const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '用户', value: 'user' },
  { label: '编辑者', value: 'editor' },
  { label: '观察者', value: 'viewer' }
]

// 表单数据
const form = ref<any>({
  username: '',
  password: '',
  full_name: '',
  active: true,
  role: 'user'
})

// 表单验证规则
const rules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, message: '用户名至少3个字符' },
    { max: 20, message: '用户名不能超过20个字符' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
  ],
  password: isEdit.value ? [] : [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少6个字符' },
    { max: 50, message: '密码不能超过50个字符' }
  ],
  full_name: [
    { max: 50, message: '姓名不能超过50个字符' }
  ]
}))

const isEdit = computed(() => !!props.modelValue)
const visible = computed({
  get: () => props.visible || false,
  set: (value) => emit('update:visible', value)
})

// 监听modelValue变化，更新表单数据
watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      form.value = {
        username: v.username || '',
        password: '', // 编辑时不显示密码
        full_name: v.full_name || '',
        active: v.active !== undefined ? v.active : true,
        role: v.role || 'user'
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function resetForm() {
  form.value = {
    username: '',
    password: '',
    full_name: '',
    active: true,
    role: 'user'
  }
}

async function handleSubmit() {
  try {
    // 验证表单
    const valid = await formRef.value?.validate()
    if (valid !== true) {
      return
    }

    submitting.value = true

    const formData = { ...form.value }
    
    if (isEdit.value && props.modelValue) {
      emit('updated', { id: props.modelValue.id, data: formData })
      MessagePlugin.success('用户更新成功')
    } else {
      emit('created', formData)
      MessagePlugin.success('用户创建成功')
    }

    // 关闭对话框
    visible.value = false
  } catch (error) {
    console.error('表单提交失败:', error)
    MessagePlugin.error('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

function onCancel() {
  visible.value = false
  emit('cancel')
  // 清空表单验证状态
  formRef.value?.clearValidate()
  resetForm()
}
</script>

<style scoped>
:deep(.t-form-item__label) {
  font-weight: 500;
}
</style>
