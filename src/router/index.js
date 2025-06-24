import { createRouter, createWebHistory } from 'vue-router';
import SettingsView from '../view/SettingsView.vue';
import TaskDetailView from '../view/TaskDetailView.vue';

// 1. 定义路由规则
const routes = [
    {
        path: '/',
        name: 'Settings',
        component: SettingsView
    },
    {
        path: '/task-detail/:taskId',
        name: 'TaskDetail',
        component: TaskDetailView,
        props: true
    },
];

// 2. 创建路由实例
const router = createRouter({
    history: createWebHistory(), // 使用 HTML5 History 模式
    routes,
});

// 3. 导出路由实例，以便在 main.js 中使用
export default router;