<!--TODO: 返回按钮导航，面包屑导航清晰显示页面层级关系 -->
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
              :src="currentFlaw.flawImageUrl"
              :preview-src-list="[currentFlaw.flawImageUrl]"
              fit="contain"
              hide-on-click-modal
              style="width: 100%; height: 100%;"
            >
              <template #error>
                <div class="image-placeholder"><span>{{ currentFlaw.flawName }} (图片加载失败)</span></div>
              </template>
            </el-image>
            <div v-else class="image-placeholder"><span>请选择一个故障</span></div>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-wrapper">
              <span class="progress-label start">0m</span>
              <span class="progress-label end">{{ taskTotalDistance }}m</span>

              <div class="progress-line">
                <div class="progress-fill"></div>

                <div
                  v-for="flaw in flaws"
                  :key="flaw.id"
                  class="flaw-marker"
                  :class="getFlawStatusClass(flaw)"
                  :style="{ left: (flaw.flawDistance / taskTotalDistance * 100) + '%' }"
                  :title="flaw.flawName"
                  @click="openDetailDialog(flaw)"
                >📍</div>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar">
          <div class="info-card">
            <h3>任务信息</h3>
            <div class="info-item"><span>📄 任务编号:</span> {{ taskInfo.id }}</div>
            <div class="info-item"><span>⏰ 开始时间:</span> {{ taskInfo.start }}</div>
            <div class="info-item"><span>⏰ 结束时间:</span> {{ taskInfo.end }}</div>
            <div class="info-item"><span>📍 巡视距离:</span> {{ taskInfo.distance }}</div>
            <div class="info-item"><span>⚠️ 故障总数:</span> {{ flaws.length }}</div>
            <div class="info-item"><span>✅ 已确认:</span> {{ confirmedCount }}</div>
            <div class="info-item"><span>❓ 疑似故障:</span> {{ unconfirmedCount }}</div>
          </div>
          <div class="info-card table-card">
            <h3>故障历史</h3>
            <el-table
              :data="flaws"
              height="100%"
              style="width: 100%"
              highlight-current-row
              :row-class-name="getRowClassName"
              @row-click="openDetailDialog"
            >
              <el-table-column label="名称" width="120">
                <template #default="scope">
                  <a class="quick-view-link" @click.stop="quickViewImage(scope.row)">
                    {{ scope.row.flawName }}
                  </a>
                </template>
              </el-table-column>
              <el-table-column prop="flawType" label="类型" width="120" />
              <el-table-column prop="flawDistance" label="位置(m)" />
            </el-table>
          </div>
        </div>
      </el-main>
    </el-container>

    <el-dialog v-model="dialogVisible" title="故障详情确认" width="1150px" top="5vh">
      <div v-if="editFault" class="dialog-content">
        <div class="dialog-image-container">
          <el-image :src="editFault.flawImageUrl" :preview-src-list="[editFault.flawImageUrl]" fit="contain" style="width: 100%; height: 100%;" />
        </div>
        <div class="dialog-form-container">
          <el-form :model="editFault" label-position="top">
            <el-descriptions :column="1" title="故障信息" border>
              <el-descriptions-item label="缺陷名称">{{ editFault.flawName }}</el-descriptions-item>
              <el-descriptions-item label="缺陷类型">{{ editFault.flawType }}</el-descriptions-item>
              <el-descriptions-item label="精准位置">{{ editFault.flawDistance }} 米</el-descriptions-item>
              <el-descriptions-item label="缺陷描述">{{ editFault.flawDesc || '无' }}</el-descriptions-item>
            </el-descriptions>
            <el-form-item label="状态确认" style="margin-top: 20px;">
              <el-radio-group v-model="editFault.confirmed">
                <el-radio :value="true">🔴 已确认属实</el-radio>
                <el-radio :value="null">🟠 疑似缺陷</el-radio>
                <el-radio :value="false">⚪️ 确认为误报</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="补充说明 (Remark)">
              <el-input v-model="editFault.remark" type="textarea" :rows="6" placeholder="请输入处理建议或现场情况说明" />
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
const isSaving = ref(false);
const dialogVisible = ref(false);
const taskTotalDistance = 500; // 假设任务总距离

const taskInfo = ref({ id: 'TASK202312010001', start: '2023-12-01 09:00', end: '2023-12-01 10:30', distance: `${taskTotalDistance} 米` });


const flaws = ref([
  { id: 1, taskId: 101, flawType: '结构缺陷', flawName: '隧道裂缝', flawDesc: '发现隧道左侧壁面存在约20cm长的裂缝', flawDistance: 100.5, flawImageUrl: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg', confirmed: true, remark: '需要复查' },
  { id: 2, taskId: 101, flawType: '渗漏问题', flawName: '渗水点', flawDesc: '轨道旁电缆沟附近有潮湿痕迹，疑似渗水。', flawDistance: 225.0, flawImageUrl: 'https://fuss10.elemecdn.com/8/27/f01c15bb73e1ef3793e64e6b7bbccjpeg.jpeg', confirmed: null, remark: '' }, // null 代表疑似
  { id: 3, taskId: 101, flawType: '设备故障', flawName: '设备异响', flawDesc: '信号机S-103附近有持续高频异响。', flawDistance: 350.8, flawImageUrl: 'https://fuss10.elemecdn.com/1/8e/aeffeb4de74e2fde4bd74fc7b4486jpeg.jpeg', confirmed: true, remark: '' },
  { id: 4, taskId: 101, flawType: '误检测', flawName: '误报-反光', flawDesc: '积水反光导致的图像识别错误。', flawDistance: 425.2, flawImageUrl: 'https://fuss10.elemecdn.com/3/28/bbf893f792f03a54408b3b7a7ebf0jpeg.jpeg', confirmed: false, remark: '' }, // false 代表误报
]);

const currentFlaw = ref(flaws.value[0] || null);
const editFault = ref(null);

// --- 计算属性 ---
const confirmedCount = computed(() => flaws.value.filter(f => f.confirmed === true).length);
const suspectedCount = computed(() => flaws.value.filter(f => f.confirmed === null).length);
const unconfirmedCount = computed(() => flaws.value.filter(f => f.confirmed === false).length);

// --- 方法 ---
// 快速预览图片
const quickViewImage = (flaw) => {
  currentFlaw.value = flaw;
  ElMessage.success(`快速预览: ${flaw.flawName}`);
};

// 打开详情弹窗
const openDetailDialog = (flaw) => {
  currentFlaw.value = flaw;
  // 直接深拷贝
  editFault.value = JSON.parse(JSON.stringify(flaw));
  dialogVisible.value = true;
};

// 保存修改
const saveFaultDetails = () => {
  if (!editFault.value) return;
  isSaving.value = true;

  setTimeout(() => {
    const index = flaws.value.findIndex(f => f.id === editFault.value.id);
    if (index !== -1) {
      flaws.value[index] = editFault.value;
    }
    isSaving.value = false;
    dialogVisible.value = false;
    ElMessage({ type: 'success', message: '故障状态已更新！' });
  }, 500);
};

// 根据故障状态获取用于CSS的类名
const getFlawStatusClass = (flaw) => {
  if (flaw.confirmed === true) return 'confirmed';
  if (flaw.confirmed === false) return 'false';
  return 'unconfirmed'; // null 或其他任何意外情况都视为 "unconfirmed"
}
// Element Plus表格行类名函数
const getRowClassName = ({ row }) => {
  return getFlawStatusClass(row);
};

const goBack = () => ElMessage.info('返回任务列表');
</script>

<style scoped>
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
  display: flex;
  flex-grow: 1;
  overflow: hidden;
  padding: 20px;
  min-height: 0;
  gap: 20px;
  box-sizing: border-box;
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 40px; /* 左右留出一些空间给标签 */
}
.progress-bar-wrapper {
  width: 100%;
  position: relative;
  padding-top: 20px; /* 为顶部标签留出空间 */
}
.progress-label {
  position: absolute;
  top: 0;
  font-size: 12px;
  color: #606266;
}
.progress-label.start {
  left: 0;
}
.progress-label.end {
  right: 0;
}
.progress-line {
  height: 8px;
  background-color: #e4e7ed; /* 轨道的灰色背景 */
  border-radius: 4px;
  position: relative;
}
.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%; /* 因为是已完成任务的复盘，所以默认100% */
  background-color: var(--el-color-primary); /* 使用Element Plus的主题蓝 */
  border-radius: 4px;
}

/* 故障标记的位置 */
.flaw-marker {
  z-index: 10;
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

/* --- 对话框内部样式 --- */
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

/* 新增一个用于快速预览的链接样式 */
.quick-view-link {
  color: var(--el-color-primary);
  text-decoration: none;
  cursor: pointer;
}
.quick-view-link:hover {
  text-decoration: underline;
}

/* 对话框内单选按钮样式优化 */
.el-radio-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
</style>