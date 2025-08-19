export function validateTaskForm(data: any) {
  const errors: Record<string, string> = {}
  if (!data.task_name || String(data.task_name).trim() === '') {
    errors.task_name = '任务名称为必填项'
  } else if (String(data.task_name).length > 200) {
    errors.task_name = '任务名称不能超过200字符'
  }

  const priority = Number(data.priority || 0)
  if (isNaN(priority) || priority < 1 || priority > 5) {
    errors.priority = '优先级应为1到5之间的整数'
  }

  const start = data.plan_start_at ? new Date(data.plan_start_at) : null
  const end = data.plan_end_at ? new Date(data.plan_end_at) : null
  if (start && end && start.getTime() > end.getTime()) {
    errors.plan_end_at = '结束时间必须晚于或等于开始时间'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export default validateTaskForm
