<template>
  <div class="my-tasks-page">
    <t-card title="我的任务" style="height:100%;">
        <div v-if="loadingAssigned || loadingManaged" class="loading">加载中...</div>
        <t-list v-else>
          <t-list-item v-for="task in combinedTasks" :key="task.id">
            <div class="task-item">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div class="task-title">{{ task.task_name }}</div>
                <t-tag size="small" theme="primary" variant="light">{{ task._sourceLabel }}</t-tag>
              </div>
              <div class="task-meta">执行人（被分配者）: {{ task.assignee_name || task.assignee_id || '未分配' }} · 状态: {{ task.status }} · 优先级: {{ task.priority }}</div>
              <div style="margin-top:8px;">
                <t-button size="small" variant="outline" @click="openTaskDetail(task)">查看详情</t-button>
                <t-button size="small" theme="primary" @click="openSubmitSubtask(task)">提交子任务</t-button>
              </div>
            </div>
          </t-list-item>
        </t-list>
        <div v-if="combinedTasks.length === 0 && !(loadingAssigned || loadingManaged)" class="empty">暂无相关任务</div>
      </t-card>
  <!-- 任务详情对话框 -->
  <t-dialog v-model:visible="showTaskDetail" header="任务详情" width="700px">
    <div v-if="currentTask">
      <h3>{{ currentTask.task_name }}</h3>
      <div>
        状态: {{ currentTask.status }} · 执行人: {{ currentTask.assignee_name || currentTask.assignee_id || '未分配' }}
        <span class="text-secondary" v-if="currentTask.assigner_name"> · 发布人: {{ currentTask.assigner_name }}</span>
      </div>
      <div style="margin-top:12px">
        <t-list>
          <t-list-item v-for="st in subtasks" :key="st.id">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div>{{ st.content || '(无内容)' }}</div>
                <div class="task-meta">提交人: {{ st.submitter_id }} · 提交时间: {{ st.submitted_at }}</div>
              </div>
              <div>
                <t-button size="small" theme="primary" @click="confirmSubtask(st.id, true)">确认</t-button>
                <t-button size="small" theme="default" @click="confirmSubtask(st.id, false)">取消确认</t-button>
              </div>
            </div>
          </t-list-item>
        </t-list>
      </div>
    </div>
  </t-dialog>

  <!-- 提交子任务对话框 -->
  <t-dialog v-model:visible="showSubmitSubtask" header="提交子任务" width="600px" @confirm="handleSubmitSubtask">
    <t-form>
      <t-form-item label="内容">
        <t-textarea v-model:value="subtaskContent" rows="4" />
      </t-form-item>
      <t-form-item label="上传附件">
        <input type="file" @change="onSubtaskFileChange" />
      </t-form-item>
    </t-form>
  </t-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchTasksPaged } from '../api/task'
import { submitSubTask, listSubTasks, presignSubtaskAttachment, confirmSubtaskAttachment, confirmSubTask } from '../api/subtask'
import { useAuthStore } from '../stores/auth'
import { computed } from 'vue'

const assignedTasks = ref<any[]>([])
const managedTasks = ref<any[]>([])
const loadingAssigned = ref(false)
const loadingManaged = ref(false)
const showTaskDetail = ref(false)
const currentTask = ref<any | null>(null)
const subtasks = ref<any[]>([])
const showSubmitSubtask = ref(false)
const subtaskForTask = ref<number | null>(null)
const subtaskContent = ref('')
const subtaskFile = ref<File | null>(null)

const auth = useAuthStore()

const loadAssigned = async () => {
  if (!auth.user || !auth.user.id) return
  loadingAssigned.value = true
  try {
    const data = await fetchTasksPaged({ assignee_id: auth.user.id, page: 1, pageSize: 50 })
    assignedTasks.value = data.items || data || []
  } catch (e) {
    assignedTasks.value = []
  } finally {
    loadingAssigned.value = false
  }
}

const loadManaged = async () => {
  if (!auth.user || !auth.user.id) return
  loadingManaged.value = true
  try {
    // 以 assigner_id 作为“我管理的任务”判定
    const data = await fetchTasksPaged({ assigner_id: auth.user.id, page: 1, pageSize: 50 })
    managedTasks.value = data.items || data || []
  } catch (e) {
    managedTasks.value = []
  } finally {
    loadingManaged.value = false
  }
}

onMounted(() => {
  loadAssigned()
  loadManaged()
})

// 合并并去重：优先保留 assignedTasks 中的数据，如果同一 id 同时存在于两者，则标记来源为 "分配给我/我管理"
const combinedTasks = computed(() => {
  const map = new Map<number, any>()
  for (const t of assignedTasks.value) {
    const copy = { ...t, _sourceLabel: '分配给我的' }
    map.set(t.id, copy)
  }
  for (const t of managedTasks.value) {
    if (map.has(t.id)) {
      const existing = map.get(t.id)
      existing._sourceLabel = '分配给我的/我管理'
      map.set(t.id, existing)
    } else {
      const copy = { ...t, _sourceLabel: '我管理的' }
      map.set(t.id, copy)
    }
  }
  return Array.from(map.values())
})

const openTaskDetail = async (task: any) => {
  currentTask.value = task
  showTaskDetail.value = true
  // load subtasks
  try {
    const resp = await listSubTasks({ taskId: task.id, page: 1, size: 50 })
    subtasks.value = resp.data?.list || resp.data?.items || resp.data || []
  } catch (e) {
    subtasks.value = []
  }
}

const openSubmitSubtask = (task: any) => {
  subtaskForTask.value = task.id
  subtaskContent.value = ''
  subtaskFile.value = null
  showSubmitSubtask.value = true
}

const onSubtaskFileChange = (e: any) => {
  const f = e.target.files && e.target.files[0]
  if (f) subtaskFile.value = f
}

const handleSubmitSubtask = async () => {
  if (!subtaskForTask.value) {
    return
  }
  try {
    // 使用当前登录用户作为 submitter
    const submitterId = auth.user?.id || 0
    const payload: any = {
      task_id: subtaskForTask.value,
      submitter_id: submitterId,
      content: subtaskContent.value,
      attachments: []
    }
    const resp = await submitSubTask(payload)
    const created = resp.data || {}
    const stId = created.id || created.subtask_id || created.data?.id
    if (subtaskFile.value && stId) {
      // presign
      const presign = await presignSubtaskAttachment(stId, {
        file_name: subtaskFile.value.name,
        size: subtaskFile.value.size,
        mime: subtaskFile.value.type || 'application/octet-stream',
        biz_type: 'attachment'
      } as any)
      const p = presign.data
      // upload
      const fd = new FormData()
      if (p.headers) Object.keys(p.headers).forEach(k => fd.append(k, p.headers[k]))
      fd.append('file', subtaskFile.value)
      await fetch(p.host, { method: 'POST', body: fd })
      // confirm
      await confirmSubtaskAttachment(stId, {
        key: p.key,
        file_name: subtaskFile.value.name,
        size: subtaskFile.value.size,
        mime: subtaskFile.value.type || 'application/octet-stream'
      } as any)
    }
    showSubmitSubtask.value = false
    // reload subtasks if detail open
    if (currentTask.value && currentTask.value.id === subtaskForTask.value) {
      await openTaskDetail(currentTask.value)
    }
  } catch (e) {
    console.error('submit subtask failed', e)
  }
}

const confirmSubtask = async (subtaskId: number, confirm: boolean) => {
  try {
    await confirmSubTask(subtaskId, confirm)
    // refresh list
    if (currentTask.value) {
      await openTaskDetail(currentTask.value)
    }
  } catch (e) {
    console.error('confirmSubtask failed', e)
  }
}
</script>

<style scoped>
.task-item { display:flex; flex-direction:column }
.task-title { font-weight:600 }
.task-meta { font-size:12px; color:#666 }
.empty { padding:12px; color:#999 }
.loading { padding:12px; color:#666 }
</style>
