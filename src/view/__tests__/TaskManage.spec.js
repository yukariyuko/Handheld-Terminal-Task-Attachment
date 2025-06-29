import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import ElementPlus from 'element-plus';
import TaskManageView from '../TaskManageView.vue';
import { listTask, addTask, delTask, uploadTask } from '../../api/taskmanagee.js';

// 模拟 API 函数
vi.mock('../../api/taskmanagee.js', () => ({
    listTask: vi.fn(),
    addTask: vi.fn(),
    delTask: vi.fn(),
    uploadTask: vi.fn()
}));

describe('TaskManageView.vue', () => {
    let router;
    let wrapper;

    beforeEach(async () => {
        vi.clearAllMocks();
        listTask.mockResolvedValue({ code: 200, rows: [], total: 0 });

        router = createRouter({
            history: createWebHistory(),
            routes: [
                { path: '/', name: 'TaskManage', component: TaskManageView }
            ]
        });
        await router.push('/');
        await router.isReady();

        wrapper = mount(TaskManageView, {
            global: {
                plugins: [router, ElementPlus],
                stubs: {
                    // 可以根据需要 stub 其他组件
                }
            }
        });
        await flushPromises();
    });

    // 测试组件是否正确渲染
    it('should render the component', () => {
        expect(wrapper.exists()).toBe(true);
    });

    // 测试组件挂载时是否调用 listTask 方法
    it('should call listTask on mount', () => {
        expect(listTask).toHaveBeenCalledTimes(1);
    });

    // 测试搜索功能
    it('should call listTask when search button is clicked', async () => {
        const searchButton = wrapper.find('.btn.btn-primary');
        if (searchButton.exists()) {
            await searchButton.trigger('click');
            await flushPromises();
            expect(listTask).toHaveBeenCalledTimes(2);
        } else {
            console.error('Search button not found');
        }
    });

    // 测试新增任务功能
    it('should call addTask when adding a new task', async () => {
        const addButton = wrapper.find('.btn.btn-primary.add-task-btn');
        if (addButton.exists()) {
            await addButton.trigger('click');

            // 模拟填写表单数据
            const taskNameInput = wrapper.find('input[placeholder="请输入任务名称"]');
            await taskNameInput.setValue('Test Task');

            const taskNumberInput = wrapper.find('input[placeholder="请输入任务编号"]');
            await taskNumberInput.setValue('Test Number');

            const startLocationInput = wrapper.find('input[placeholder="请输入起始地点"]');
            await startLocationInput.setValue('Test Location');

            const taskDistanceInput = wrapper.find('input[placeholder="请输入任务距离"]');
            await taskDistanceInput.setValue('Test Distance');

            const creatorInput = wrapper.find('input[placeholder="请输入创建人"]');
            await creatorInput.setValue('Test Creator');

            const executorInput = wrapper.find('input[placeholder="请输入执行人"]');
            await executorInput.setValue('Test Executor');

            const submitButton = wrapper.find('.modal-footer .btn.btn-primary');
            await submitButton.trigger('click');
            await flushPromises();

            expect(addTask).toHaveBeenCalledTimes(1);
            expect(listTask).toHaveBeenCalledTimes(2);
        } else {
            console.error('Add button not found');
        }
    });

    // 测试删除任务功能
    it('should call delTask when deleting a task', async () => {
        const mockTask = { id: 1, status: '待巡检' };
        delTask.mockResolvedValue({ code: 200 });

        // 模拟表格中出现待删除任务
        listTask.mockResolvedValue({ code: 200, rows: [mockTask], total: 1 });
        await flushPromises();

        const deleteButton = wrapper.find('.action-btn.delete-btn');
        if (deleteButton.exists()) {
            await deleteButton.trigger('click');
            await flushPromises();

            expect(delTask).toHaveBeenCalledTimes(1);
            expect(listTask).toHaveBeenCalledTimes(2);
        } else {
            console.error('Delete button not found');
        }
    });

    // 测试上传任务功能
    it('should call uploadTask when uploading a task', async () => {
        const mockTask = { id: 1, status: '待上传' };
        uploadTask.mockResolvedValue({ code: 200 });

        // 模拟表格中出现待上传任务
        listTask.mockResolvedValue({ code: 200, rows: [mockTask], total: 1 });
        await flushPromises();

        const uploadButton = wrapper.find('.action-btn.upload-btn');
        if (uploadButton.exists()) {
            await uploadButton.trigger('click');
            await flushPromises();

            expect(uploadTask).toHaveBeenCalledTimes(1);
            expect(listTask).toHaveBeenCalledTimes(2);
        } else {
            console.error('Upload button not found');
        }
    });
});