import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'tdesign-vue-next/dist/tdesign.css'
import TDesign from 'tdesign-vue-next'

const pinia = createPinia()
createApp(App).use(pinia).use(router).use(TDesign).mount('#app')
