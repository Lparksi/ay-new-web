<template>
  <div style="max-width:420px;margin:80px auto;padding:24px;border:1px solid #eee;border-radius:8px">
    <h2>登录</h2>
    <t-form label-width="100px" v-model:value="form">
      <t-form-item label="用户名">
        <t-input v-model:value="form.username" style="width:100%" />
      </t-form-item>
      <t-form-item label="密码">
        <t-input v-model:value="form.password" type="password" style="width:100%" />
      </t-form-item>
      <t-form-item>
        <t-button theme="primary" @click="onLogin">登录</t-button>
      </t-form-item>
    </t-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { notifyError, notifySuccess } from '../utils/notification'

const form = reactive({ username: '', password: '' })
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

async function onLogin() {
  if (!form.username || !form.password) {
    notifyError('请输入用户名和密码')
    return
  }
  try {
    const r = await auth.login(form.username, form.password)
    if (auth.isAuthenticated()) {
      notifySuccess('登录成功！')
      const redirect = (route.query.redirect as string) || '/'
      router.replace(redirect)
    } else {
      notifyError('登录失败，未返回有效的认证信息')
    }
  } catch (err: any) {
    notifyError('登录失败: ' + (err?.response?.data?.message || err.message))
  }
}
</script>

<style scoped>
</style>
