<template>
  <div style="max-width:800px;margin:40px auto;padding:24px;border:1px solid #eee;border-radius:8px">
    <h2>新建任务</h2>
    <t-form label-width="120px" v-model:value="form">
      <t-form-item label="任务类型">
        <t-select v-model:value="form.type" :options="typeOptions" style="width:320px" />
      </t-form-item>

      <t-form-item label="任务名称">
        <t-input v-model:value="form.task_name" style="width:480px" />
      </t-form-item>

      <t-form-item label="备注">
        <t-textarea v-model:value="form.remarks" rows="4" style="width:480px" />
      </t-form-item>

      <t-form-item label="优先级">
        <t-input-number v-model:value="form.priority" :min="1" :max="5" />
      </t-form-item>

      <t-form-item label="计划开始">
        <date-picker v-model:value="form.plan_start_at" type="datetime" style="width:320px" />
      </t-form-item>

      <t-form-item label="计划结束">
        <date-picker v-model:value="form.plan_end_at" type="datetime" style="width:320px" />
      </t-form-item>

      <t-form-item label="指派人">
        <UserSelect v-model="form.selectedUsers" :multiple="false" />
      </t-form-item>
      
      <t-form-item label="商户">
        <MerchantSelect v-model="form.selectedMerchants" />
      </t-form-item>

      <t-form-item label="标签">
        <TagSelect v-model="form.selectedTags" />
      </t-form-item>

      <t-form-item>
        <t-button theme="primary" @click="onSubmit">创建</t-button>
      </t-form-item>
    </t-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { createTask } from '../api/task'
import { ref } from 'vue'
import { Form, FormItem, Input, Textarea, Button, Select, InputNumber, DatePicker } from 'tdesign-vue-next'
import UserSelect from '../components/Selectors/UserSelect.vue'
import MerchantSelect from '../components/Selectors/MerchantSelect.vue'
import TagSelect from '../components/Selectors/TagSelect.vue'
import { buildScopeJson } from '../utils/scope'
import { toISOStringOrNull } from '../utils/date'
import { validateTaskForm } from '../utils/validation'
import { notifyError, notifySuccess } from '../utils/notification'
import { formValidationRules, validateDateRange } from '../utils/form-validation'
import { handleError } from '../utils/error-handler'

const form = reactive({
  type: 'general',
  task_name: '',
  remarks: '',
  priority: 1,
  scope_json: '',
  plan_start_at: undefined,
  plan_end_at: undefined,
  assigner_id: null,
  group_id: null,
  selectedUsers: [] as number[],
  selectedMerchants: [] as number[],
  selectedTags: [] as number[],
})

const typeOptions = [
  { label: '通用', value: 'general' },
  { label: '巡检', value: 'inspection' },
  { label: '市场', value: 'marketing' },
]

const isSubmitting = ref(false)

async function onSubmit() {
  const { valid, errors } = validateTaskForm(form)
  if (!valid) {
    // show first error simply
  const first = Object.values(errors)[0]
  notifyError(first as string)
    return
  }
  try {
  isSubmitting.value = true
  // build scope_json from selected selectors
  form.scope_json = buildScopeJson({ users: (form as any).selectedUsers })
  form.scope_json = buildScopeJson({ users: (form as any).selectedUsers, merchants: (form as any).selectedMerchants, tags: (form as any).selectedTags })

  const payload = {
      type: form.type,
      task_name: form.task_name,
      remarks: form.remarks,
      priority: form.priority,
      scope_json: form.scope_json,
      plan_start_at: toISOStringOrNull(form.plan_start_at),
      plan_end_at: toISOStringOrNull(form.plan_end_at),
      assigner_id: form.assigner_id,
      group_id: form.group_id,
    }
    const r = await createTask(payload)
    // 后端返回结构为 resp.OkWithData(task,...)
  notifySuccess('创建成功: id = ' + (r.data && r.data.id ? r.data.id : JSON.stringify(r)))
  isSubmitting.value = false
  } catch (err: any) {
  isSubmitting.value = false
  notifyError('创建失败: ' + (err?.response?.data?.message || err.message))
  }
}
</script>

<style scoped>
</style>
