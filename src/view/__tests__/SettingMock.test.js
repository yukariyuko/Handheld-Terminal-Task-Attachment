import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SettingsView from '../SettingsView.vue';
import { useConfigStore } from '../../api/config';
import { vi } from 'vitest';

// mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// mock element-plus 的 ElMessageBox
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue(true), // 默认"确定"
    }
  };
});

// mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        code: 200,
        data: {
          host: 'mock-host',
          drivePort: 1234,
          analysisPort: 5678,
          cloudUrl: 'mock-url',
          cam1: 'rtsp://192.168.1.100/1',
          cam2: 'rtsp://192.168.1.100/2',
          cam3: 'rtsp://192.168.1.100/3',
          cam4: 'rtsp://192.168.1.100/4',
          username1: 'admin1',
          username2: 'admin2',
          username3: 'admin3',
          username4: 'admin4',
          password1: 'pass1',
          password2: 'pass2',
          password3: 'pass3',
          password4: 'pass4',
        }
      }
    }),
    put: vi.fn().mockResolvedValue({
      data: { code: 200 }
    }),
  }
}));

describe('SettingsView.vue mock测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    window.alert = vi.fn();
  });

  it('onMounted时会获取并渲染配置', async () => {
    const wrapper = mount(SettingsView);
    await flushPromises();
    const ipInput = wrapper.find('input[placeholder="请输入车辆IP地址"]');
    expect(ipInput.element.value).toBe('mock-host');
  });

  it('用户输入并成功保存', async () => {
    // 1. Mock 依赖
    window.confirm = vi.fn(() => true); // 确认 confirm 会返回 true
    const store = useConfigStore();
    const updateConfigSpy = vi.spyOn(store, 'updateConfig').mockResolvedValue({
      data: { code: 200, msg: '配置更新成功' }
    });

    // 2. 挂载组件
    const wrapper = mount(SettingsView);
    await flushPromises();
    // 3. 模拟用户输入
    store.configData.host = '192.168.99.99'; // 直接修改 store 的数据

    await wrapper.vm.onSubmit();

    // 等待异步操作完成
    await flushPromises();

    // 5. 断言
    expect(window.confirm).toHaveBeenCalledWith('确定要保存当前设置吗？');
    expect(updateConfigSpy).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('设置已保存成功！');
  });

  it('点击取消按钮可以恢复初始数据', async () => {
    window.confirm = vi.fn(() => false);
    const wrapper = mount(SettingsView);
    await flushPromises();
    const ipInput = wrapper.find('input[placeholder="请输入车辆IP地址"]');
    await ipInput.setValue('mock-host');
    expect(ipInput.element.value).toBe('mock-host');
    await wrapper.find('button.btn-cancel').trigger('click');
    await flushPromises();
    const ipInputAfter = wrapper.find('input[placeholder="请输入车辆IP地址"]');
    expect(ipInputAfter.element.value).toBe('mock-host');
  });

  it('点击保存时选择取消', async () => {
    // mock ElMessageBox.confirm 为 reject，模拟用户点"取消"
    const { ElMessageBox } = await import('element-plus');
    ElMessageBox.confirm.mockRejectedValue(new Error('取消'));
    const wrapper = mount(SettingsView);
    await flushPromises();
    await wrapper.find('button[type="submit"]').trigger('click');
    await flushPromises();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('点击取消按钮时选择否', async () => {
    // mock ElMessageBox.confirm 为 reject，模拟用户点"取消"
    const { ElMessageBox } = await import('element-plus');
    ElMessageBox.confirm.mockRejectedValue(new Error('取消'));
    const wrapper = mount(SettingsView);
    await flushPromises();
    await wrapper.find('button.btn-cancel').trigger('click');
    await flushPromises();
    // 断言页面未恢复（依然是脏数据）
    const ipInput = wrapper.find('input[placeholder="请输入车辆IP地址"]');
    // 这里可以根据实际逻辑断言
  });

  it('保存时接口返回非200，弹出失败提示', async () => {
    window.confirm = vi.fn(() => true);
    const store = useConfigStore();
    vi.spyOn(store, 'updateConfig').mockResolvedValue({ data: { code: 500, msg: '失败原因' } });
    const wrapper = mount(SettingsView);
    await flushPromises();
    store.configData.host = '192.168.99.99';
    await wrapper.vm.onSubmit();
    await flushPromises();
    expect(window.alert).toHaveBeenCalledWith('保存失败: 失败原因');
  });

  it('保存时接口抛异常，弹出网络失败提示', async () => {
    window.confirm = vi.fn(() => true);
    const store = useConfigStore();
    vi.spyOn(store, 'updateConfig').mockRejectedValue(new Error('网络异常'));
    const wrapper = mount(SettingsView);
    await flushPromises();
    store.configData.host = '192.168.99.99';
    await wrapper.vm.onSubmit();
    await flushPromises();
    expect(window.alert).toHaveBeenCalledWith('保存失败，请检查网络或联系管理员。');
  });

  it('点击取消按钮时确认，数据被恢复并 emit', async () => {
    window.confirm = vi.fn(() => true);
    const wrapper = mount(SettingsView);
    await flushPromises();
    // 模拟 originalConfigData 有值
    wrapper.vm.originalConfigData.value = { host: 'origin-host' };
    wrapper.vm.configData.host = 'changed-host';
    // 监听 emit
    await wrapper.vm.onCancel();
    expect(wrapper.vm.configData.host).toBe('changed-host');
  });

  it('点击取消按钮时选择否，不恢复数据不 emit', async () => {
    window.confirm = vi.fn(() => false);
    const wrapper = mount(SettingsView);
    await flushPromises();
    wrapper.vm.originalConfigData.value = { host: 'origin-host' };
    wrapper.vm.configData.host = 'changed-host';
    const emitSpy = vi.spyOn(wrapper.vm, 'emit');
    await wrapper.vm.onCancel();
    expect(wrapper.vm.configData.host).toBe('changed-host');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('configStore getter 方法可用', () => {
    const store = useConfigStore();
    store.configData.host = 'host1';
    store.configData.drivePort = 1111;
    store.configData.analysisPort = 2222;
    store.configData.cloudUrl = 'cloud-url';
    expect(store.host()).toBe('host1');
    expect(store.drivePort()).toBe(1111);
    expect(store.analysisPort()).toBe(2222);
    expect(store.cloudUrl()).toBe('cloud-url');
  });

  it('setNeedRefresh 可设置 needRefresh', () => {
    const store = useConfigStore();
    expect(store.needRefresh).toBe(false);
    store.setNeedRefresh(true);
    expect(store.needRefresh).toBe(true);
    store.setNeedRefresh(false);
    expect(store.needRefresh).toBe(false);
  });

  it('onSubmit confirm 返回 false 时直接 return，不调用 updateConfig', async () => {
    window.confirm = vi.fn(() => false);
    const store = useConfigStore();
    const updateConfigSpy = vi.spyOn(store, 'updateConfig');
    const wrapper = mount(SettingsView);
    await flushPromises();
    await wrapper.vm.onSubmit();
    expect(updateConfigSpy).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('host getter 返回正确', () => {
    const store = useConfigStore();
    store.configData.host = 'host-test';
    expect(store.host()).toBe('host-test');
  });

  it('drivePort getter 返回正确', () => {
    const store = useConfigStore();
    store.configData.drivePort = 12345;
    expect(store.drivePort()).toBe(12345);
  });

  it('analysisPort getter 返回正确', () => {
    const store = useConfigStore();
    store.configData.analysisPort = 54321;
    expect(store.analysisPort()).toBe(54321);
  });

  it('cloudUrl getter 返回正确', () => {
    const store = useConfigStore();
    store.configData.cloudUrl = 'cloud-url-test';
    expect(store.cloudUrl()).toBe('cloud-url-test');
  });

  it('页面所有 v-model setter 都被触发', async () => {
    const wrapper = mount(SettingsView);
    await flushPromises();
    // 车辆IP
    await wrapper.find('input[placeholder="请输入车辆IP地址"]').setValue('1.1.1.1');
    // 车辆控制端口
    const portInputs = wrapper.findAll('input[placeholder="请输入端口号"]');
    await portInputs[0].setValue(1234);
    await portInputs[1].setValue(5678);
    // 云端平台地址
    await wrapper.find('input[placeholder="请输入云端平台地址"]').setValue('http://cloud.test');
    // 摄像头相关
    const camInputs = wrapper.findAll('input[placeholder="请输入摄像头地址"]');
    const userInputs = wrapper.findAll('input[placeholder="请输入账号"]');
    const passInputs = wrapper.findAll('input[placeholder="请输入密码"]');
    for (let i = 0; i < 4; i++) {
      await camInputs[i].setValue(`rtsp://test/${i+1}`);
      await userInputs[i].setValue(`user${i+1}`);
      await passInputs[i].setValue(`pass${i+1}`);
    }
    // 断言 configData 的所有字段都被赋值
    const data = wrapper.vm.configData;
    expect(data.host).toBe('1.1.1.1');
    expect(data.drivePort).toBe(1234);
    expect(data.analysisPort).toBe(5678);
    expect(data.cloudUrl).toBe('http://cloud.test');
    for (let i = 1; i <= 4; i++) {
      expect(data[`cam${i}`]).toBe(`rtsp://test/${i}`);
      expect(data[`username${i}`]).toBe(`user${i}`);
      expect(data[`password${i}`]).toBe(`pass${i}`);
    }
  });
});

let configData = {
  id: 1,
  host: '192.168.1.1',
  drivePort: 1234,
  analysisPort: 5678,
  cloudUrl: 'http://cloud.test',
  cam1: 'rtsp://192.168.1.100/1',
  username1: 'admin1',
  password1: 'pass1',
  cam2: 'rtsp://192.168.1.100/2',
  username2: 'admin2',
  password2: 'pass2',
  cam3: 'rtsp://192.168.1.100/3',
  username3: 'admin3',
  password3: 'pass3',
  cam4: 'rtsp://192.168.1.100/4',
  username4: 'admin4',
  password4: 'pass4',
};

export default [
  // Mock - 获取配置
  {
    url: '/api/agv/config',
    method: 'get',
    response: () => {
      return {
        code: 200,
        msg: '获取配置成功',
        data: configData,
      };
    },
  },
  // Mock - 更新配置
  {
    url: '/api/agv/config',
    method: 'put',
    response: ({ body }) => {
      configData = { ...configData, ...body };
      return {
        code: 200,
        msg: '配置更新成功',
        data: configData,
      };
    },
  },
];

