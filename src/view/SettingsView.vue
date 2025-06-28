<template>
  <div class="settings-container">
    <div class="page-title">系统设置</div>

    <form class="form-container" id="settingsForm" @submit.prevent="onSubmit">
      <div class="form-section">
        <div class="section-title vehicle">车辆控制设置</div>

        <div class="form-item">
          <label class="form-label required">车辆IP地址</label>
          <input type="text" class="form-input" v-model="configData.host" placeholder="请输入车辆IP地址" required>
          <div class="help-text">用于连接AGV控制系统的IP地址</div>
        </div>

        <div class="form-item half-width">
          <div class="form-group">
            <label class="form-label required">车辆控制端口</label>
            <input type="number" class="form-input" v-model.number="configData.drivePort" placeholder="请输入端口号" required>
          </div>
          <div class="form-group">
            <label class="form-label required">分析程序端口</label>
            <input type="number" class="form-input" v-model.number="configData.analysisPort" placeholder="请输入端口号" required>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title cloud">云端平台设置</div>
        <div class="form-item">
          <label class="form-label required">云端平台地址</label>
          <input type="url" class="form-input" v-model="configData.cloudUrl" placeholder="请输入云端平台地址" required>
          <div class="help-text">数据上传和远程监控平台地址</div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title camera">摄像头设置</div>
        <div v-for="i in 4" :key="i" class="camera-group">
          <div class="camera-title">摄像头--{{CameraName[i]}}</div>
          <div class="form-item">
            <label class="form-label">摄像头{{ i }}地址</label>
            <input type="text" class="form-input" v-model="configData['cam' + i]" placeholder="请输入摄像头地址">
          </div>
          <div class="form-item half-width">
            <div class="form-group">
              <label class="form-label">摄像头{{ i }}账号</label>
              <input type="text" class="form-input" v-model="configData['username' + i]" placeholder="请输入账号">
            </div>
            <div class="form-group">
              <label class="form-label">摄像头{{ i }}密码</label>
              <input type="password" class="form-input" v-model="configData['password' + i]" placeholder="请输入密码">
            </div>
          </div>
        </div>
      </div>

      <div class="btn-group">
        <button type="button" class="btn btn-cancel" @click="onCancel">取消</button>
        <button type="submit" class="btn btn-primary">保存设置</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { defineEmits } from 'vue';
import { storeToRefs } from 'pinia';
import { useConfigStore } from "../api/config.js";
import { useRouter } from 'vue-router';

const router = useRouter(); 
const emit = defineEmits(['close']);

const configStore = useConfigStore();
const { configData} = storeToRefs(configStore);


const CameraName = ["","前方主视角","左侧视角","右侧视角","后方视角"];
// 用于"取消"操作时恢复数据的备份
let originalConfigData = ref(null);

// 当 fetchConfig 第一次成功获取数据后，备份它
watch(configData, (newValue) => {
  if (newValue && !originalConfigData.value) {
    originalConfigData.value = JSON.parse(JSON.stringify(newValue));
  }
}, { immediate: true, deep: true });

onMounted(async () => {
  await configStore.fetchConfig();
});

// 保存设置按钮的点击事件处理
async function onSubmit() {
  if (!confirm('确定要保存当前设置吗？')) {
    return;
  }

  try {
    // 调用更新接口，传入当前表单数据
    const response =  await configStore.updateConfig();
    if (response.data && response.data.code === 200) {
      alert('设置已保存成功！');
      // 更新备份数据，以便下次"取消"操作是基于最新的已保存状态
      originalConfigData = JSON.parse(JSON.stringify(configData.value));

      emit('close', true); 
      configStore.setNeedRefresh(true); // 设置需要刷新状态
      router.push('/?refresh=true'); // 跳转回主页并标记需要刷新
    } else {
      alert(`保存失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error("保存配置时发生错误:", error);
    alert('保存失败，请检查网络或联系管理员。');
  }
}

// 取消按钮的点击事件处理
function onCancel() {
  // 此处逻辑与线框图中的JS代码一致
  if (confirm('确定要取消设置吗？未保存的更改将丢失。')) {
    if (originalConfigData) {
      // 恢复到初始加载的数据
      configData.value = JSON.parse(JSON.stringify(originalConfigData));
    }
    emit('close', false);
  }
  configStore.setNeedRefresh(true); // 设置需要刷新状态
  router.push('/'); // 跳转回主页
}





</script>

<style scoped>
/* 样式完全拷贝自 05-SettingsView-wireframe.html */
/* 使用 `scoped` 关键字确保样式只应用于当前组件 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background: #f5f5f5;
  padding: 20px;
}

.settings-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;
  color: #333;
  padding-bottom: 15px;
  border-bottom: 2px solid #409eff;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-item.half-width {
  flex-direction: row;
  gap: 20px;
}

.form-item.half-width .form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.form-label.required::after {
  content: " *";
  color: #f56c6c;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.form-section {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #409eff;
  display: flex;
  align-items: center;
}

.section-title.vehicle::before {
  content: "🚛";
  margin-right: 8px;
}

.section-title.cloud::before {
  content: "☁️";
  margin-right: 8px;
}

.section-title.camera::before {
  content: "📹";
  margin-right: 8px;
}

.camera-group {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  background: white;
}

.camera-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #666;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.btn-group {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 24px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  min-width: 80px;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.btn-primary:hover {
  background: #337ecc;
  border-color: #337ecc;
}

.btn-cancel {
  background: #f5f5f5;
  border-color: #ddd;
  color: #666;
}

.btn-cancel:hover {
  background: #e8e8e8;
  border-color: #ccc;
}

.help-text {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  line-height: 1.4;
}
</style>