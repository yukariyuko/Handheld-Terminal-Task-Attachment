import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
//引入路由实例
import router from './router'

const app = createApp(App)


app.use(router)
app.use(createPinia())
app.mount('#app')