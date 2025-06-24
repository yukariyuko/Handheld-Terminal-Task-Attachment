<template>
  <div class="layout">
    <el-container class="fullscreen">
      <el-header class="breadcrumb-bar">
        <div class="breadcrumb-text">地铁隧道巡检系统 / 任务列表 / 任务详情</div>
        <el-button type="primary" icon="el-icon-back" @click="goBack">返回</el-button>
      </el-header>
      <el-main class="main-content">
        <div class="viewer-section">
          <div class="image-viewer">
            <div>当前故障图像（{{ currentFlaw.name }}）</div>
          </div>
          <div class="progress-bar">
            <div class="progress-line">
              <div
                v-for="(flaw, index) in flaws"
                :key="index"
                class="flaw-marker"
                :class="flaw.status"
                :style="{ left: flaw.percent }"
                :title="flaw.name"
                @click="viewFlawDetail(flaw)"
              >📍</div>
            </div>
          </div>
        </div>
        <div class="sidebar">
          <div class="info-card">
            <h3>任务信息</h3>
            <div class="info-item"><span>任务编号:</span> {{ taskInfo.id }}</div>
            <div class="info-item"><span>开始时间:</span> {{ taskInfo.start }}</div>
            <div class="info-item"><span>结束时间:</span> {{ taskInfo.end }}</div>
            <div class="info-item"><span>巡视距离:</span> {{ taskInfo.distance }}</div>
            <div class="info-item"><span>故障总数:</span> {{ flaws.length }}</div>
            <div class="info-item"><span>已确认:</span> {{ confirmedCount }}</div>
            <div class="info-item"><span>疑似故障:</span> {{ unconfirmedCount }}</div>
          </div>
          <div class="info-card">
            <h3>故障历史</h3>
            <el-table :data="flaws" height="100%" style="width: 100%">
              <el-table-column prop="name" label="名称" width="120" />
              <el-table-column prop="type" label="类型" width="120" />
              <el-table-column prop="position" label="位置" />
            </el-table>
          </div>
        </div>
      </el-main>
    </el-container>
    <el-loading v-if="loading" fullscreen lock text="加载中..." background="rgba(0, 0, 0, 0.7)" />
    <el-message v-if="message" :type="messageType" :duration="3000">{{ message }}</el-message>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const taskInfo = ref({
  id: 'TASK202312010001',
  start: '2023-12-01 09:00',
  end: '2023-12-01 10:30',
  distance: '500 米',
});

const flaws = ref([
  { name: '隧道裂缝', type: '结构缺陷', position: '100m', status: 'confirmed', percent: '20%' },
  { name: '渗水点', type: '渗漏问题', position: '225m', status: 'unconfirmed', percent: '45%' },
  { name: '设备异响', type: '设备故障', position: '350m', status: 'confirmed', percent: '70%' },
  { name: '误报', type: '误检测', position: '425m', status: 'false', percent: '85%' },
]);

const currentFlaw = ref(flaws.value[0]);
const message = ref('');
const messageType = ref('info');
const loading = ref(false);

const viewFlawDetail = (flaw) => {
  currentFlaw.value = flaw;
  message.value = `查看故障：${flaw.name}`;
  messageType.value = 'info';
  setTimeout(() => message.value = '', 3000);
};

const goBack = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    message.value = '已返回任务列表';
    messageType.value = 'success';
  }, 1000);
};

const confirmedCount = computed(() => flaws.value.filter(f => f.status === 'confirmed').length);
const unconfirmedCount = computed(() => flaws.value.filter(f => f.status === 'unconfirmed').length);
</script>

<style scoped>
* {
  box-sizing: border-box;
}
.layout, .fullscreen, .main-content, .viewer-section, .sidebar {
  border: 1px dashed red;
}
html, body, #app, .layout, .fullscreen {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.fullscreen {
  display: flex;
  flex-direction: column;
}
.breadcrumb-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #ffffff;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
  height: 60px;
  box-sizing: border-box;
}
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  width: 100%;
}
.viewer-section {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}
.image-viewer {
  flex: 1;
  background: #000;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}
.progress-bar {
  height: 80px;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 16px;
  box-sizing: border-box;
}
.progress-line {
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  position: relative;
}
.flaw-marker {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  text-align: center;
  line-height: 20px;
  font-size: 12px;
  color: #fff;
  position: absolute;
  top: -6px;
  transform: translateX(-50%);
  cursor: pointer;
}
.confirmed { background: #f56c6c; }
.unconfirmed { background: #e6a23c; }
.false { background: #909399; }
.sidebar {
  width: 400px;
  background: #fff;
  border-left: 1px solid #ddd;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
}
.info-card {
  padding: 20px;
  box-sizing: border-box;
}
.info-item {
  margin-bottom: 12px;
}
.info-item span {
  display: inline-block;
  min-width: 120px;
  color: #666;
}
</style>
