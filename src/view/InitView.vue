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

          <span class="check-label">{{ item.label }}</span>

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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

// 1. 获取 Vue Router 实例
const router = useRouter();

// 2. 定义所有检查项的状态
const checkItems = ref([
  { id: 'fs', label: '检查系统文件完整性', status: 'loading', message: '', solution: '<strong>解决方案：</strong>请重新安装本系统。', expanded: false, api: () => axios.get('/system/check/fs') },
  { id: 'db', label: '检测数据库系统连接', status: 'loading', message: '', solution: '<strong>解决方案：</strong>请检查数据库连接设置是否正确。', expanded: false, api: () => axios.get('/system/check/db') },
  { id: 'agv', label: '与车辆控制系统通信', status: 'loading', message: '', solution: '<strong>解决方案：</strong>请检查巡检车IP与端口配置是否正确。', expanded: false, api: () => axios.get('/system/check/agv') },
  { id: 'cam', label: '检测摄像头通道状态', status: 'loading', message: '', solution: '<strong>解决方案：</strong>请检查摄像头IP及账号密码是否正确。', expanded: false, api: () => axios.get('/system/check/cam') }
]);

// 3. 计算属性：判断是否所有检查都成功了
const allChecksSuccessful = computed(() => {
  return checkItems.value.length > 0 && checkItems.value.every(item => item.status === 'success');
});

// 4. 核心逻辑：执行单个检查
const runCheck = async (item) => {
  // 重置状态
  item.status = 'loading';
  item.message = '';
  item.expanded = false; 

  try {
    // 调用真实的API接口
    const response = await item.api();
    
    // 根据后端返回的数据结构判断成功或失败
    if (response.data.success) {
      item.status = 'success';
      item.message = response.data.message || '检查通过';
    } else {
      throw new Error(response.data.message || '检查失败');
    }

  } catch (error) {
    // 捕获API调用失败或业务逻辑失败
    item.status = 'error';
    item.message = error.response?.data?.message || error.message || '发生未知错误';
  }
};

// 5. 核心逻辑：执行所有检查
const performAllChecks = async () => {
  // 使用 Promise.all 并发执行所有检查
  const checkPromises = checkItems.value.map(item => runCheck(item));
  await Promise.all(checkPromises);
};

// 6. 按钮事件：重新检测
const recheckAll = () => {
  performAllChecks();
};

// 7. 按钮事件：跳转到设置页面
const goToSettings = () => {
  router.push('/settings');
};

// 8. 按钮事件：进入系统（主页面）
const enterSystem = () => {
  if (allChecksSuccessful.value) {
    alert('检查通过，正在进入系统主页...');
    
    // router.push('/dashboard'); 
  }
};

// 9. UI交互：展开/收起失败项的详情
const toggleExpand = (item) => {
  if (item.status === 'error') {
    item.expanded = !item.expanded;
  }
};

// 10. 生命周期钩子：组件挂载后，自动开始执行所有检查
onMounted(() => {
  performAllChecks();
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