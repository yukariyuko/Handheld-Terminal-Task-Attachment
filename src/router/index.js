import { createRouter, createWebHistory } from 'vue-router';
import SettingsView from '../view/SettingsView.vue';
<<<<<<< HEAD
import TaskDetailView from '../view/TaskDetailView.vue';
=======
import InitView from '../view/InitView.vue';
>>>>>>> c87b67e (initView框架差不多完成 仍需添加跳转和变量同步等任务)

// 1. 定义路由规则
const routes = [
    {
        path: '/',
        name: 'Init',
        component: InitView
    },
    {
        path: '/settings',
        name: 'Settings',
        component: SettingsView
    },
    {
        path: '/task-detail/:taskId',
        name: 'TaskDetail',
        component: TaskDetailView,
        props: true
    },
  {
    path: '/:pathMatch(.*)*', // 404 页面
    name: 'NotFound',
    component: () => import('../view/NotFound.vue'),
    meta: { hidden: true }
  }
];

// 2. 创建路由实例
const router = createRouter({
    history: createWebHistory(), // 使用 HTML5 History 模式
    routes,
});

// 3. 导出路由实例，以便在 main.js 中使用
export default router;