import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import ElementPlus, { ElMessage } from 'element-plus';
import TaskDetail from '../TaskDetailView.vue';

// --- Mocks ---
// 1. 在 Mock 中添加 liveInfo
vi.mock('../../api/flaw.js', () => ({
  listFlaw: vi.fn(),
  updateFlaw: vi.fn(),
  liveInfo: vi.fn(), // 确保新的 API 函数被 mock
}));

vi.mock('../../api/task.js', () => ({
  getTask: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRoute: vi.fn(),
    useRouter: vi.fn(),
  };
});

vi.spyOn(ElMessage, 'success').mockImplementation(() => {});
vi.spyOn(ElMessage, 'warning').mockImplementation(() => {});
vi.spyOn(ElMessage, 'error').mockImplementation(() => {});

// 2. 导入正确的 API 函数
import { getTask } from '../../api/task.js';
import { updateFlaw, liveInfo } from '../../api/flaw.js';
import { useRoute, useRouter } from 'vue-router';

// --- Mock Data ---
const mockTask = { id: 'task-01', endTime: '2025-06-28 10:30:00', taskTrip: '1500.0' };
const mockFlaws = [
  { id: 'flaw-101', flawName: '隧道壁裂缝', flawType: '结构性', flawDistance: 250, flawImageUrl: '/images/flaw1.jpg', confirmed: true, remark: '已确认' },
  { id: 'flaw-102', flawName: '轨道积水', flawType: '环境类', flawDistance: 800, flawImageUrl: '/images/flaw2.jpg', confirmed: null, remark: '' },
  { id: 'flaw-103', flawName: '信号灯异常', flawType: '设备类', flawDistance: 1200, flawImageUrl: '/images/flaw3.jpg', confirmed: false, remark: '误报' },
];
// 辅助变量，与组件中的保持一致
const image_base_url = "http://192.168.2.57/prod-api/file";


describe('TaskDetail.vue', () => {
  let router;

  beforeEach(async () => {
    vi.clearAllMocks();

    getTask.mockResolvedValue({ code: 200, data: mockTask });
    // 3. Mock liveInfo 的返回值，而不是 listFlaw
    liveInfo.mockResolvedValue({ code: 200, data: mockFlaws });
    updateFlaw.mockResolvedValue({ code: 200, msg: '更新成功' });

    const mockRouter = { back: vi.fn(), push: vi.fn() };
    useRouter.mockImplementation(() => mockRouter);
    useRoute.mockImplementation(() => ({
      params: { id: 'task-01' },
    }));

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'Home', component: { template: '<div>Home</div>' }},
        { path: '/task-detail/:id', name: 'TaskDetail', component: TaskDetail }
      ],
    });
    await router.push('/task-detail/task-01');
    await router.isReady();
  });

  const mountComponent = (options = {}) => {
    return mount(TaskDetail, {
      global: {
        plugins: [router, ElementPlus],
        stubs: { 'el-icon': true },
        ...options.global,
      },
      ...options,
    });
  };

  describe('组件渲染和初始数据加载', () => {
    it('应该在挂载时调用 API 获取任务和缺陷信息', async () => {
      mountComponent();
      await flushPromises();
      expect(getTask).toHaveBeenCalledWith('task-01');
      // 4. 验证 liveInfo 被调用，参数是字符串 ID
      expect(liveInfo).toHaveBeenCalledWith('task-01');
    });

    it('应该正确渲染任务信息卡片', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      const infoCardText = wrapper.find('.info-card').text();
      expect(infoCardText).toContain(`任务编号: ${mockTask.id}`);
      expect(infoCardText).toContain(`巡视距离: ${mockTask.taskTrip}`);
      expect(infoCardText).toContain(`故障总数: ${mockFlaws.length}`);
    });

    it('应该正确渲染缺陷历史表格', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      const tableRows = wrapper.findAll('.el-table__row');
      expect(tableRows).toHaveLength(mockFlaws.length);
      expect(tableRows[0].text()).toContain('隧道壁裂缝');
    });

    it('应该根据缺陷状态为表格行应用正确的 class', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      const tableRows = wrapper.findAll('.el-table__row');
      expect(tableRows[0].classes()).toContain('confirmed');
      expect(tableRows[1].classes()).toContain('unconfirmed');
      expect(tableRows[2].classes()).toContain('false');
    });

    it('初始状态下，图片查看器应显示第一个缺陷的图片', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      const image = wrapper.findComponent({ name: 'ElImage' });
      // 5. 验证图片的 src 包含了 base_url
      expect(image.props('src')).toBe(image_base_url + mockFlaws[0].flawImageUrl);
    });
  });

  describe('用户交互', () => {
    it('点击返回按钮应该调用 router.back', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      const backButton = wrapper.findAll('button').find(b => b.text() === '返回');
      await backButton.trigger('click');
      expect(useRouter().back).toHaveBeenCalledTimes(1);
    });

    it('点击表格中的快速预览链接应切换主图片并显示提示', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      const quickViewLinks = wrapper.findAll('.quick-view-link');
      await quickViewLinks[1].trigger('click');
      expect(wrapper.vm.currentFlaw.id).toBe(mockFlaws[1].id);
      const image = wrapper.findComponent({ name: 'ElImage' });
      expect(image.props('src')).toBe(image_base_url + mockFlaws[1].flawImageUrl);
      expect(ElMessage.success).toHaveBeenCalledWith(`快速预览: ${mockFlaws[1].flawName}`);
    });

    it('点击表格行应打开详情对话框', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.find('.el-dialog').exists()).toBe(false);
      const tableRows = wrapper.findAll('.el-table__row');
      await tableRows[2].trigger('click');
      await wrapper.vm.$nextTick();
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.exists()).toBe(true);
      expect(dialog.props('modelValue')).toBe(true);
    });
  });

  describe('故障确认对话框功能', () => {
    it('可以成功修改故障状态并保存', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      await wrapper.findAll('.el-table__row')[1].trigger('click');
      await wrapper.vm.$nextTick();
      await wrapper.find('input[type="radio"][value="true"]').setValue();
      await wrapper.find('textarea').setValue('现场复核，确认为积水。');
      await wrapper.find('.dialog-footer .el-button--primary').trigger('click');
      await flushPromises();
      expect(updateFlaw).toHaveBeenCalledTimes(1);
      const expectedPayload = { ...mockFlaws[1], confirmed: true, remark: '现场复核，确认为积水。' };
      expect(updateFlaw).toHaveBeenCalledWith(expectedPayload);
      expect(wrapper.vm.dialogVisible).toBe(false);
    });

    it('保存失败时应显示错误消息且对话框不关闭', async () => {
      updateFlaw.mockResolvedValue({ code: 500, msg: '服务器内部错误' });
      const wrapper = mountComponent();
      await flushPromises();
      await wrapper.findAll('.el-table__row')[1].trigger('click');
      await wrapper.vm.$nextTick();
      await wrapper.find('.dialog-footer .el-button--primary').trigger('click');
      await flushPromises();
      expect(ElMessage.warning).toHaveBeenCalledWith('保存失败: 服务器内部错误');
      expect(wrapper.vm.dialogVisible).toBe(true);
    });

    it('在对话框中点击取消按钮应关闭对话框', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      await wrapper.findAll('.el-table__row')[0].trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.dialogVisible).toBe(true);
      const cancelButton = wrapper.findAll('.dialog-footer .el-button').find(btn => btn.text() === '取 消');
      await cancelButton.trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.dialogVisible).toBe(false);
    });

    it('当通过 v-model 的双向绑定关闭对话框时（如按 ESC 或点击右上角 X），应正确更新状态', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      await wrapper.findAll('.el-table__row')[0].trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.dialogVisible).toBe(true);
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      await dialog.vm.$emit('update:modelValue', false);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.dialogVisible).toBe(false);
    });
  });

  describe('异常处理和边缘情况 (Error Handling and Edge Cases)', () => {
    it('当路由中没有任务ID时，应显示错误消息', async () => {
      useRoute.mockReturnValue({ params: {} });
      mountComponent();
      await flushPromises();
      expect(ElMessage.error).toHaveBeenCalledWith('任务ID不存在');
      expect(getTask).not.toHaveBeenCalled();
    });

    it('当获取任务信息API返回业务错误时，应显示警告', async () => {
      getTask.mockResolvedValue({ code: 500, msg: '任务不存在' });
      mountComponent();
      await flushPromises();
      expect(ElMessage.warning).toHaveBeenCalledWith('任务数据异常: 任务不存在');
    });

    it('当获取任务信息API网络失败时，应显示错误', async () => {
      getTask.mockRejectedValue(new Error('Network Error'));
      mountComponent();
      await flushPromises();
      expect(ElMessage.error).toHaveBeenCalledWith('加载任务失败');
    });

    // 6. 更新异常测试以使用 liveInfo
    it('当获取缺陷列表API返回业务错误时，应显示警告', async () => {
      liveInfo.mockResolvedValue({ code: 500, msg: '数据库查询出错' });
      mountComponent();
      await flushPromises();
      expect(ElMessage.warning).toHaveBeenCalledWith('加载缺陷列表异常: 数据库查询出错');
    });

    it('当获取缺陷列表API网络失败时，应显示错误', async () => {
      liveInfo.mockRejectedValue(new Error('Network Error'));
      mountComponent();
      await flushPromises();
      expect(ElMessage.error).toHaveBeenCalledWith('加载缺陷列表失败');
    });

    it('当缺陷列表为空时，应显示占位符文本', async () => {
      liveInfo.mockResolvedValue({ code: 200, data: [] });
      const wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.find('.image-placeholder').text()).toContain('请选择一个故障');
    });

    it('当直接调用保存且没有选中故障时，应直接返回', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.editFault = null;
      await wrapper.vm.saveFaultDetails();
      expect(updateFlaw).not.toHaveBeenCalled();
    });

    it('当保存缺陷详情时发生网络错误，应显示错误消息', async () => {
      updateFlaw.mockRejectedValue(new Error('Network Error'));
      const wrapper = mountComponent();
      await flushPromises();
      await wrapper.findAll('.el-table__row')[1].trigger('click');
      await wrapper.vm.$nextTick();
      await wrapper.find('.dialog-footer .el-button--primary').trigger('click');
      await flushPromises();
      expect(ElMessage.error).toHaveBeenCalledWith('保存出错');
      expect(wrapper.vm.isSaving).toBe(false);
    });

    it('点击进度条上的标记应打开详情对话框', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      const flawMarkers = wrapper.findAll('.flaw-marker');
      expect(flawMarkers.length).toBe(mockFlaws.length);
      await flawMarkers[1].trigger('click');
      await wrapper.vm.$nextTick();
      const dialog = wrapper.findComponent({ name: 'ElDialog' });
      expect(dialog.exists()).toBe(true);
      expect(dialog.props('modelValue')).toBe(true);
    });
  });
});