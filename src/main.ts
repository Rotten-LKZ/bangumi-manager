import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import App from './App.vue'
import { i18n } from './locales'
import 'element-plus/dist/index.css'

createApp(App)
  .use(i18n)
  .use(ElementPlus)
  .mount('#app')
