import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
//引入路由实例
import router from './router'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)


app.use(ElementPlus)
app.use(router)
app.use(createPinia())
app.mount('#app')