<template>
  <div class="init-page">
    <div class="init-container">
      <h1>AGV智能巡检系统</h1>

      <div 
        v-for="item in checkItems" 
        :key="item.id" 
        class="check-item" 
        :class="{ expanded: item.expanded, 'is-error': item.status === 'error' }"
      >
        <div class="check-header" @click="item.status === 'error' && toggleExpand(item)">
          <div class="check-icon" :class="item.status">
            <span v-if="item.status === 'loading'">⟳</span>
            <span v-if="item.status === 'success'">✓</span>
            <span v-if="item.status === 'error'">✕</span>
          </div>

          <span class="check-label">
            <template v-if="item.id === 'db'">
              检测数据库 ({{ configData.dbHost || '地址未配置' }})
            </template>
            <template v-else-if="item.id === 'agv'">
              与车辆控制系统 ({{ configData.agvHost || '地址未配置' }}) 通信
            </template>
            <template v-else-if="item.id === 'cam'">
              检测摄像头 ({{ configData.camHost || '地址未配置' }}) 通信
            </template>
            <template v-else>
              {{ item.label }}
            </template>
          </span>
          <span v-if="item.status === 'success'" class="status-text status-success">成功</span>
          <span v-else-if="item.status === 'error'" class="status-text status-error">失败</span>
          <span v-else class="status-text status-loading">检查中...</span>
        </div>
        
        <div v-if="item.status === 'error'" class="check-content">
          <div v-html="item.message"></div>
          <div v-html="item.solution"></div>
        </div>
      </div>

      <div class="operate-btn-group">
        <button class="btn btn-circle" @click="goToSettings">⚙️</button>
        <button class="btn btn-success" :disabled="!allChecksSuccessful" @click="enterSystem">进入系统</button>
        <button class="btn btn-primary" @click="recheckAll">重新检测</button>
      </div>
    </div>
  </div>
</template>

<script setup>

// InitView.vue -> <script setup>

import { ref, onMounted, computed, onActivated, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { useConfigStore } from '../api/config.js'; 
import { storeToRefs } from 'pinia';   
import { checkFs, checkDb, checkAgv, checkCam } from '../api/init.js';

const router = useRouter();
const route = useRoute();
const configStore = useConfigStore();
const { configData, needRefresh } = storeToRefs(configStore);


const checkItems = ref([
  { id: 'fs', label: '检查系统文件完整性', status: 'loading', message: '', solution: '<strong>解决方案：</strong>请重新安装本系统。', expanded: false },
  { id: 'db', label: '检测数据库系统连接', status: 'loading', message: '', solution: '<strong>解决方案：</strong>请在设置页面检查数据库连接信息是否正确。', expanded: false },
  { id: 'agv', label: '与车辆控制系统通信', status: 'loading', message: '', solution: '<strong>解决方案：</strong>请在设置页面检查巡检车IP与端口配置是否正确。', expanded: false },
  { id: 'cam', label: '检测摄像头通道状态', status: 'loading', message: '', solution: '<strong>解决方案：</strong>请在设置页面检查摄像头IP及账号密码是否正确。', expanded: false }
]);

const allChecksSuccessful = computed(() => {
  return checkItems.value.length > 0 && checkItems.value.every(item => item.status === 'success');
});


const runCheck = async (item) => {
  item.status = 'loading';
  item.message = '';
  item.expanded = false; 

  try {
    let apiPromise;
    const params = configData.value;

    // 变化3：将直接的 axios 调用替换为导入的 API 函数调用
    switch (item.id) {
      case 'fs':
        apiPromise = checkFs();
        break;
      case 'db':
        apiPromise = checkDb(params);
        break;
      case 'agv':
        apiPromise = checkAgv(params);
        break;
      case 'cam':
        apiPromise = checkCam(params);
        break;
      default:
        throw new Error('未知的检查项');
    }

    const response = await apiPromise;
    
    // 这里的判断逻辑需要根据您的真实API返回格式来定
    // 假设我们之前讨论的 AjaxResult 格式 { code, msg } 是正确的
    if (response.code === 200) {
      item.status = 'success';
      item.message = response.msg || '检查通过';
    } else {
      throw new Error(response.msg || '检查失败');
    }

  } catch (error) {
    item.status = 'error';
    // error.response?.data?.msg 是 axios 错误对象中常见的后端消息路径
    item.message = `<strong>错误详情：</strong>` + (error.response?.data?.msg || error.message || '发生未知网络或服务器错误');
  }
};

const performAllChecks = async () => {
  const checkPromises = checkItems.value.map(item => runCheck(item));
  await Promise.all(checkPromises);
};

const recheckAll = () => {
  performAllChecks();
};

const goToSettings = () => {
  router.push('/settings');
};

const enterSystem = () => {
  if (allChecksSuccessful.value) {
    router.push('/task-list'); 
  }
};

const toggleExpand = (item) => {
  if (item.status === 'error') {
    item.expanded = !item.expanded;
  }
};

onMounted(async () => {
  console.log('InitView 组件已挂载，开始执行初始化检查...');
  
  try {
    console.log('正在加载全局配置...');
    // 优先加载全局配置
    await configStore.fetchConfig();
    console.log('全局配置加载成功:', configData.value);
    
    console.log('开始执行所有系统检查...');
    // 配置加载成功后，再执行所有检查
    await performAllChecks();
    console.log('所有系统检查完成');

  } catch (error) {
    console.error("加载初始配置失败:", error);
    // 如果配置加载失败，可以将所有检查项都标记为错误
    checkItems.value.forEach(item => {
        item.status = 'error';
        item.message = `<strong>错误详情：</strong>无法加载系统基础配置，请检查网络或联系管理员。`;
    });
  }
});

onActivated(async () => {
  // 当用户从其他页面返回 Init 页面时，重新执行系统检查
  await performAllChecks();
});

// 监听 store 中的刷新状态，当需要刷新时重新执行检查
watch(needRefresh, (newValue) => {
  if (newValue) {
    console.log('检测到刷新标记，重新执行系统检查...');
    performAllChecks();
    // 重置刷新状态
    configStore.setNeedRefresh(false);
  }
});

</script>

<style scoped>
/* 1. 字体优化: 使用更现代的系统UI字体 */
.init-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  /* 2. 背景优化: 添加微妙的渐变 */
  background: #f8f9fa;
  background-image: linear-gradient(175deg, #fdfdff 0%, #f8f9fa 200px);
  height: 100%; /* 从父级继承100%高度 */
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px; /* 给小屏幕留出边距 */
  box-sizing: border-box; /* 确保padding不会影响尺寸计算 */
}


.init-container {
  /* 3. 响应式与阴影优化 */
  max-width: 450px;
  width: 90%;
  background: white;
  padding: 30px;
  border-radius: 12px; /* 更圆润的边角 */
  border: 1px solid #e9ecef; /* 更柔和的边框 */
  box-shadow: 0 8px 32px rgba(0, 33, 89, 0.06); /* 更柔和、弥散的阴影 */
  transition: all 0.3s ease-out;
}

h1 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 40px;
  color: #212529; /* 使用更柔和的黑色 */
  font-size: 24px;
  font-weight: 600; /* 字体加粗，但不过重 */
}

.check-item {
  border: 1px solid #e9ecef;
  margin-bottom: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 4. 交互微调: 鼠标悬浮时轻微放大和上移 */
.check-item.is-error .check-header:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 33, 89, 0.05);
  background: #fff9f9;
}

.check-header {
  padding: 14px 18px;
  background: #fafbfc;
  display: flex;
  align-items: center;
  transition: background-color 0.3s ease;
}


.check-icon {
  width: 20px; height: 20px; margin-right: 12px; border-radius: 50%; border: 2px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; transition: all 0.3s ease; flex-shrink: 0;
}
.check-icon.loading { border-color: #409eff transparent #409eff transparent; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.check-icon.success { border-color: #28a745; background: #28a745; color: white; }
.check-icon.error { border-color: #dc3545; background: #dc3545; color: white; } 


.check-label {
  color: #343a40;
  font-size: 15px;
  font-weight: 500;
}

.status-text {
  margin-left: auto; padding-left: 10px; font-size: 14px; font-weight: bold;
}
.status-text.status-success { color: #28a745; }
.status-text.status-error { color: #dc3545; }
.status-text.status-loading { color: #6c757d; }

.check-content {
  padding: 0 18px; max-height: 0; overflow: hidden; background: #fff; color: #495057; font-size: 14px; transition: all 0.4s ease-in-out; border-top: 1px solid #e9ecef;
}
.check-content div { padding: 8px 0; }
.check-item.expanded .check-content { padding: 12px 18px; max-height: 200px; }

.operate-btn-group {
  margin-top: 40px; display: flex; justify-content: center; gap: 15px; /* 增加按钮间距 */
}


.btn { padding: 8px 16px; border: 1px solid #dee2e6; border-radius: 6px; background: white; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s ease; }
.btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-circle { width: 40px; height: 40px; border-radius: 50%; padding: 0; font-size: 20px; line-height: 1; }
.btn-success { background: #28a745; border-color: #28a745; color: white; }
.btn-primary { background: #007bff; border-color: #007bff; color: white; }
</style>