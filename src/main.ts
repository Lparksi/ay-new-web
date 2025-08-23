import { createApp, reactive } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'tdesign-vue-next/dist/tdesign.css'
import TDesign, { ConfigProvider } from 'tdesign-vue-next'

const pinia = createPinia()

// 自动跟随系统暗色模式 (prefers-color-scheme)
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
const globalConfig = reactive({
	// 可以在此处添加更多全局配置项，按需覆盖
	// 目前不需要修改组件默认样式前缀，保留默认 classPrefix
	// theme 跟随系统：组件内部多数支持 theme prop，部分组件会响应 CSS 变量
	dark: prefersDark ? prefersDark.matches : false,
})

// 监听系统主题变化，实时更新（仅用于 JS 层状态，组件按需读取）
if (prefersDark && typeof prefersDark.addEventListener === 'function') {
	prefersDark.addEventListener('change', (e) => {
		globalConfig.dark = e.matches
		// 同步 body class，方便自定义样式或覆盖
		if (e.matches) document.documentElement.classList.add('td-theme-dark')
		else document.documentElement.classList.remove('td-theme-dark')
	})
} else if (prefersDark && typeof prefersDark.addListener === 'function') {
	// 兼容旧版浏览器
	prefersDark.addListener((e: MediaQueryListEvent) => {
		globalConfig.dark = e.matches
		if (e.matches) document.documentElement.classList.add('td-theme-dark')
		else document.documentElement.classList.remove('td-theme-dark')
	})
}

// 初始同步 class
if (globalConfig.dark) document.documentElement.classList.add('td-theme-dark')

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(TDesign)

// 全局注入 ConfigProvider，wrap App in template is another option; here we provide as global property
app.component('TConfigProvider', ConfigProvider)

// 将全局配置挂载到 app.config.globalProperties，组件可通过 provide/inject 或 t-config-provider 读取
app.provide('globalConfig', globalConfig)

app.mount('#app')
