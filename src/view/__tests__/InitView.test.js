import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import InitView from '../InitView.vue'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    create: vi.fn(() => ({
      get: vi.fn(),
      interceptors: {
        response: {
          use: vi.fn()
        }
      }
    }))
  }
}))

vi.mock('../../api/init.js', () => ({
    checkFs: vi.fn().mockResolvedValue({ code: 200, msg: '文件系统检查通过', data: null }),
    checkDb: vi.fn().mockResolvedValue({ code: 200, msg: '数据库连接成功', data: null }),
    checkAgv: vi.fn().mockResolvedValue({ code: 200, msg: 'AGV连接成功', data: null }),
    checkCam: vi.fn().mockResolvedValue({ code: 200, msg: '摄像头连接成功', data: null })
}))

const mockConfigData = {
  id: 1,
  host: '192.168.1.100',
  drivePort: 8080,
  analysisPort: 8081,
  cloudUrl: 'https://cloud.example.com',
  dbHost: 'localhost',
  dbPort: 3306,
  dbName: 'agv_system',
  dbUser: 'root',
  dbPassword: 'password',
  agvHost: '192.168.1.200',
  camHost: '192.168.1.101',
  cam1: '192.168.1.101',
  username1: 'admin',
  password1: '123456',
  cam2: '192.168.1.102',
  username2: 'admin',
  password2: '123456',
  cam3: '192.168.1.103',
  username3: 'admin',
  password3: '123456',
  cam4: '192.168.1.104',
  username4: 'admin',
  password4: '123456'
}

vi.mock('../../api/config.js', () => ({
  useConfigStore: vi.fn(() => ({
    configData: ref(mockConfigData),
    fetchConfig: vi.fn().mockResolvedValue(true),
    setNeedRefresh: vi.fn(),
    needRefresh: ref(false)
  }))
}))

describe('InitView.vue', () => {
  let wrapper
  let router
  let pinia

  beforeEach(() => {
    vi.clearAllMocks()
    
    pinia = createPinia()
    setActivePinia(pinia)

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'Init', component: InitView },
        { path: '/settings', name: 'Settings', component: { template: '<div>Settings</div>' } }
      ]
    })

    wrapper = mount(InitView, {
      global: {
        plugins: [router, pinia],
        stubs: {
          'router-link': true,
          'router-view': true
        }
      }
    })
  })

  describe('组件渲染', () => {
    it('应该正确渲染标题', () => {
      expect(wrapper.find('h1').text()).toBe('AGV智能巡检系统')
    })

    it('应该渲染所有检查项', () => {
      const checkItems = wrapper.findAll('.check-item')
      expect(checkItems).toHaveLength(4)
    })

    it('应该渲染正确的检查项标签', () => {
      const labels = wrapper.findAll('.check-label')
      expect(labels[0].text()).toContain('检查系统文件完整性')
      expect(labels[1].text()).toContain('检测数据库')
      expect(labels[2].text()).toContain('与车辆控制系统')
      expect(labels[3].text()).toContain('检测摄像头')
    })

    it('应该渲染操作按钮', () => {
      expect(wrapper.find('.btn-circle').exists()).toBe(true)
      expect(wrapper.find('.btn-success').exists()).toBe(true)
      expect(wrapper.find('.btn-primary').exists()).toBe(true)
    })
  })

  describe('初始状态', () => {
    it('所有检查项应该全部为 success', async () => {
        await flushPromises()
        const successIcons = wrapper.findAll('.check-icon.success')
        expect(successIcons).toHaveLength(4)
      })

    it('"进入系统"按钮应该可用', async () => {
    await flushPromises()
    const enterButton = wrapper.find('.btn-success')
    expect(enterButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('按钮交互', () => {
    it('点击设置按钮应该跳转到设置页面', async () => {
    const settingsButton = wrapper.find('.btn-circle')
    await settingsButton.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/settings')
    })

    it('点击重新检测按钮应该重新执行检查', async () => {
      const recheckButton = wrapper.find('.btn-primary')
      expect(recheckButton.exists()).toBe(true)
      
      await recheckButton.trigger('click')
      
      expect(recheckButton.exists()).toBe(true)
    })
  })

  describe('计算属性', () => {
    it('allChecksSuccessful 应该正确计算', async () => {
        await flushPromises()
        expect(wrapper.vm.allChecksSuccessful).toBe(true)
      })
  })

  describe('配置数据', () => {
    it('应该正确显示数据库检查标签', () => {
      const dbLabel = wrapper.findAll('.check-label')[1]
      expect(dbLabel.text()).toBe('检测数据库通信')
    })

    it('应该正确显示AGV检查标签', () => {
      const agvLabel = wrapper.findAll('.check-label')[2]
      expect(agvLabel.text()).toBe('与车辆控制系统通信')
    })

    it('应该正确显示摄像头检查标签', () => {
      const camLabel = wrapper.findAll('.check-label')[3]
      expect(camLabel.text()).toBe('检测摄像头通信')
    })
  })
}) 