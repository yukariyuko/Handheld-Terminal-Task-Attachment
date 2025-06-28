import { createRouter, createWebHistory } from 'vue-router';
import SettingsView from '../view/SettingsView.vue';
import TaskDetailView from '../view/TaskDetailView.vue';
import TaskExecuteView from '../view/TaskExecuteView.vue';
import TaskListView from '../view/TaskListView.vue';
import InitView from '../view/InitView.vue';
import TaskManagementView from '../TaskManagementView.vue';

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
        path: '/task-detail/:id',
        name: 'TaskDetail',
        component: TaskDetailView,
        props: true
    },
    {
        path: '/task-execute/:id',
        name: 'TaskExecute',
        component: TaskExecuteView,
        props: true
    },
    {
        path: '/task-list',
        name: 'TaskList',
        component: TaskListView
    },
  {
    path: '/:pathMatch(.*)*', // 404 页面
    name: 'NotFound',
    component: () => import('../view/NotFound.vue'),
    meta: { hidden: true }
  },
  {
    path: '/task-management',
    name: 'TaskManagement',
    component: TaskManagementView
  }
];

// 2. 创建路由实例
const router = createRouter({
    history: createWebHistory(), // 使用 HTML5 History 模式
    routes,
});

// 3. 导出路由实例，以便在 main.js 中使用
export default router;
