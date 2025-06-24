<template>
  <div class="layout">
    <el-container class="fullscreen">
      <el-header class="breadcrumb-bar">
        <div class="breadcrumb-text">地铁隧道巡检系统 / 任务列表 / 任务详情</div>
        <el-button type="primary" :icon="ArrowLeft" @click="goBack">返回</el-button>
      </el-header>

      <el-main class="main-content">
        <div class="viewer-section">
          <div class="image-viewer">
            <el-image
              v-if="currentFlaw"
              :key="currentFlaw.id"
              :src="currentFlaw.imageUrl"
              :preview-src-list="[currentFlaw.imageUrl]"
              fit="contain"
              hide-on-click-modal
              style="width: 100%; height: 100%;"
            >
              <template #error>
                <div class="image-placeholder"><span>{{ currentFlaw.name }} (图片加载失败)</span></div>
              </template>
            </el-image>
            <div v-else class="image-placeholder"><span>请选择一个故障</span></div>
          </div>
          <div class="progress-bar">
            <div class="progress-line">
              <div
                v-for="flaw in flaws"
                :key="flaw.id"
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
          <div class="info-card table-card">
            <h3>故障历史</h3>
            <el-table
              :data="flaws"
              height="100%"
              style="width: 100%"
              highlight-current-row
              :row-class-name="getRowClassName"
              @row-click="viewFlawDetail"
            >
              <el-table-column prop="name" label="名称" width="120" />
              <el-table-column prop="type" label="类型" width="120" />
              <el-table-column prop="position" label="位置" />
            </el-table>
          </div>
        </div>
      </el-main>
    </el-container>

    <el-dialog v-model="dialogVisible" title="故障详情确认" width="1150px" top="5vh">
      <div v-if="editFault" class="dialog-content">
        <div class="dialog-image-container">
          <el-image
            :src="editFault.imageUrl"
            :preview-src-list="[editFault.imageUrl]"
            fit="contain"
            style="width: 100%; height: 100%;"
          >
            <template #error>
              <div class="image-placeholder dialog-image-placeholder">{{ editFault.name }} - 高清图</div>
            </template>
          </el-image>
        </div>
        <div class="dialog-form-container">
          <el-form :model="editFault" label-position="top">
            <el-descriptions :column="1" title="故障信息" border>
              <el-descriptions-item label="故障名称">{{ editFault.name }}</el-descriptions-item>
              <el-descriptions-item label="故障类型">{{ editFault.type }}</el-descriptions-item>
              <el-descriptions-item label="精准位置">{{ editFault.position }}</el-descriptions-item>
              <el-descriptions-item label="故障描述">{{ editFault.description || '无' }}</el-descriptions-item>
            </el-descriptions>

            <el-form-item label="状态确认" style="margin-top: 20px;">
              <el-radio-group v-model="editFault.status">
                <el-radio value="confirmed">🔴 已确认故障</el-radio>
                <el-radio value="unconfirmed">🟠 疑似故障</el-radio>
                <el-radio value="false">⚪️ 误报故障</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="补充说明">
              <el-input
                v-model="editFault.notes"
                type="textarea"
                :rows="6"
                placeholder="请输入处理建议或现场情况说明"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="saveFaultDetails" :loading="isSaving">
            {{ isSaving ? '保存中...' : '确认并保存' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  ElContainer, ElHeader, ElMain, ElButton, ElTable, ElTableColumn, ElImage, ElCard, ElDialog,
  ElDescriptions, ElDescriptionsItem, ElForm, ElFormItem, ElRadioGroup, ElRadio, ElInput, ElBreadcrumb, ElBreadcrumbItem,
  ElLoading, ElMessage
} from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';

// --- 状态与数据 ---
const isSaving = ref(false); // 对话框保存按钮的加载状态
const dialogVisible = ref(false); // 对话框是否可见

const taskInfo = ref({
  id: 'TASK202312010001',
  start: '2023-12-01 09:00',
  end: '2023-12-01 10:30',
  distance: '500 米',
});

const flaws = ref([
  { id: 1, name: '隧道裂缝', type: '结构缺陷', position: '100m', status: 'confirmed', percent: '20%', imageUrl: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg', description: '发现隧道左侧壁面存在约20cm长的裂缝', notes: '需要进一步检查裂缝深度，建议安排专业人员现场勘查' },
  { id: 2, name: '渗水点', type: '渗漏问题', position: '225m', status: 'unconfirmed', percent: '45%', imageUrl: 'https://fuss10.elemecdn.com/8/27/f01c15bb73e1ef3793e64e6b7bbccjpeg.jpeg', description: '轨道旁电缆沟附近有潮湿痕迹，疑似渗水。', notes: '' },
  { id: 3, name: '设备异响', type: '设备故障', position: '350m', status: 'confirmed', percent: '70%', imageUrl: 'https://fuss10.elemecdn.com/1/8e/aeffeb4de74e2fde4bd74fc7b4486jpeg.jpeg', description: '信号机S-103附近有持续高频异响。', notes: '' },
  { id: 4, name: '误报', type: '误检测', position: '425m', status: 'false', percent: '85%', imageUrl: 'https://fuss10.elemecdn.com/3/28/bbf893f792f03a54408b3b7a7ebf0jpeg.jpeg', description: '积水反光导致的图像识别错误。', notes: '已确认为误报' },
]);

// `currentFlaw` 用于主界面的图片展示，点击行就立刻更新
const currentFlaw = ref(flaws.value[0] || null);
// `editFault` 用于对话框内的数据编辑，这是一个副本，防止直接修改原始数据
const editFault = ref(null);

// --- 计算属性 ---
const confirmedCount = computed(() => flaws.value.filter(f => f.status === 'confirmed').length);
const unconfirmedCount = computed(() => flaws.value.filter(f => f.status === 'unconfirmed').length);

// --- 方法 ---
const viewFlawDetail = (flaw) => {
  // 1. 更新主界面的当前故障，立刻显示图片
  currentFlaw.value = flaw;
  // 2. 创建一个数据的深拷贝副本，用于在对话框中编辑
  editFault.value = JSON.parse(JSON.stringify(flaw));
  // 3. 打开对话框
  dialogVisible.value = true;
};

const saveFaultDetails = () => {
  if (!editFault.value) return;
  isSaving.value = true;

  // 模拟异步保存
  setTimeout(() => {
    // 在原始数据数组中找到对应的项
    const index = flaws.value.findIndex(f => f.id === editFault.value.id);
    if (index !== -1) {
      // 用编辑后的数据副本覆盖原始数据
      flaws.value[index] = editFault.value;
    }
    isSaving.value = false;
    dialogVisible.value = false; // 关闭对话框
    ElMessage({ type: 'success', message: '故障状态已更新！' });
  }, 500); // 模拟500毫秒延迟
};

const getRowClassName = ({ row }) => row.status;

const goBack = () => {
  ElMessage.info('返回任务列表');
};
</script>

<style scoped>
/* 保持之前的布局样式不变 */
.layout, .fullscreen {
  margin: 0; padding: 0; height: 100vh; width: 100vw;
  overflow: hidden; box-sizing: border-box;
}
.layout { background: #fff; color: #333; }
.fullscreen { display: flex; flex-direction: column; }
.breadcrumb-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 16px; background: #ffffff; border-bottom: 1px solid #ddd;
  font-size: 14px; height: 60px; flex-shrink: 0;
}
.main-content {
  display: flex; flex-grow: 1; overflow: hidden; padding: 0; min-height: 0;
}
.viewer-section {
  flex-grow: 1; display: flex; flex-direction: column; min-width: 0;
}
.image-viewer {
  flex: 1; background: #000; color: white;
  display: flex; justify-content: center; align-items: center; min-height: 0;
}
.image-placeholder {
  color: #909399; font-size: 1.2rem; text-align: center; padding: 20px;
}
.progress-bar {
  height: 80px; background: #fff; border-top: 1px solid #eee;
  padding: 16px; flex-shrink: 0;
}
.progress-line {
  height: 8px; background: #e4e7ed; border-radius: 4px;
  position: relative; margin-top: 10px;
}
.flaw-marker {
  width: 20px; height: 20px; border-radius: 50%;
  text-align: center; line-height: 20px; font-size: 12px;
  color: #fff; position: absolute; top: -6px;
  transform: translateX(-50%); cursor: pointer;
}
.flaw-marker.confirmed { background: var(--el-color-danger); }
.flaw-marker.unconfirmed { background: var(--el-color-warning); }
.flaw-marker.false { background: var(--el-color-info); }
.sidebar {
  width: 400px; background: #fff; border-left: 1px solid #ddd;
  display: flex; flex-direction: column; padding: 10px; gap: 10px; flex-shrink: 0;
}
.info-card { border: 1px solid #eee; border-radius: 4px; background: #fdfdfd; }
.info-card h3 {
  font-size: 16px; margin: 0; padding: 15px 20px; border-bottom: 1px solid #eee;
}
.info-card .info-item {
  margin-bottom: 12px; font-size: 14px; padding: 0 20px;
}
.info-card .info-item:first-of-type { padding-top: 20px; }
.info-card .info-item:last-child { margin-bottom: 0; padding-bottom: 20px; }
.info-card .info-item span { display: inline-block; min-width: 120px; color: #666; }
.table-card {
  flex-grow: 1; display: flex; flex-direction: column; min-height: 0; padding: 0;
}
.table-card h3 { flex-shrink: 0; }
:deep(.table-card .el-card__body) {
  padding: 0 !important; flex-grow: 1; min-height: 0;
}
:deep(.el-table .el-table__row.confirmed) { background-color: var(--el-color-danger-light-9); }
:deep(.el-table .el-table__row.unconfirmed) { background-color: var(--el-color-warning-light-9); }
:deep(.el-table .el-table__row.false) { background-color: var(--el-color-info-light-9); }
:deep(.el-table__body tr.confirmed:hover > td),
:deep(.el-table__body tr.unconfirmed:hover > td),
:deep(.el-table__body tr.false:hover > td) {
  background-color: var(--el-table-row-hover-bg-color);
}

/* --- 新增：对话框内部样式 --- */
.dialog-content {
  display: flex;
  gap: 20px;
  height: 65vh; /* 确保对话框内容有足够高度 */
}
.dialog-image-container {
  width: 65%;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog-form-container {
  width: 35%;
  display: flex;
  flex-direction: column;
}
.dialog-image-placeholder {
  color: #909399;
  font-size: 1rem;
}
:deep(.el-descriptions__title) {
  font-size: 16px;
}
.el-form-item {
  margin-bottom: 18px;
}
</style>