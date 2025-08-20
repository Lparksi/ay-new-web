<template>
  <t-dialog
    v-model:visible="visible"
    header="修改密码"
    :confirm-btn="{ content: '确认', loading: loading }"
    :cancel-btn="{ content: '取消' }"
    @confirm="handleSubmit"
    @cancel="handleCancel"
    width="500px"
  >
    <t-form
      ref="formRef"
      :data="formData"
      :rules="rules"
      layout="vertical"
      @submit="handleSubmit"
    >
      <t-form-item label="当前密码" name="oldPassword">
        <t-input
          v-model="formData.oldPassword"
          type="password"
          placeholder="请输入当前密码"
          clearable
        />
      </t-form-item>
      
      <t-form-item label="新密码" name="newPassword">
        <t-input
          v-model="formData.newPassword"
          type="password"
          placeholder="请输入新密码（至少6位）"
          clearable
        />
      </t-form-item>
      
      <t-form-item label="确认新密码" name="confirmPassword">
        <t-input
          v-model="formData.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          clearable
        />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { updatePassword } from '../../api/user'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const formRef = ref()

const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const rules = {
  oldPassword: [
    { required: true, message: '请输入当前密码' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 6, message: '密码至少6位' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码' },
    {
      validator: (val: string) => {
        if (val !== formData.newPassword) {
          return { result: false, message: '两次输入的密码不一致' }
        }
        return { result: true }
      }
    }
  ]
}

const visible = computed({
  get() {
    return props.visible
  },
  set(value: boolean) {
    emit('update:visible', value)
  }
})

// 重置表单
const resetForm = () => {
  formData.oldPassword = ''
  formData.newPassword = ''
  formData.confirmPassword = ''
  formRef.value?.clearValidate()
}

// 监听弹窗显示状态，重置表单
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

const handleCancel = () => {
  visible.value = false
}

const handleSubmit = async () => {
  try {
    // 表单验证
    const isValid = await formRef.value?.validate()
    if (!isValid) return

    loading.value = true
    
    await updatePassword({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword
    })
    
    MessagePlugin.success('密码修改成功')
    visible.value = false
    emit('success')
  } catch (error: any) {
    MessagePlugin.error(error.message || '密码修改失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.t-form-item {
  margin-bottom: 24px;
}
</style>
