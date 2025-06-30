<template>
  <div class="layout">
    <el-container class="fullscreen">
      <!-- 面包屑导航 -->
      <el-header class="breadcrumb-bar">
        <div class="breadcrumb-text">
          地铁隧道巡线车智能巡检系统 / 任务列表 / 任务巡视
        </div>
        <el-button type="primary" :icon="ArrowLeft" @click="goBack">
          返回
        </el-button>
      </el-header>

      <el-main class="main-content">
        <!-- 主要内容区域 -->
        <div class="content-area">
          <!-- 视频监控区域 -->
          <div class="video-area">
            <div class="video-container">
              <video
                v-if="currentVideoStream"
                ref="videoPlayer"
                :src="currentVideoStream"
                class="video-stream"
                autoplay
                muted
                controls
              />
              <div v-else class="video-placeholder">
                <div class="placeholder-content">
                  实时视频流显示区域
                  <br />
                  <small>{{ currentCameraName }} - {{ currentCameraView }}</small>
                </div>
              </div>
              
              <!-- 音频控制面板 -->
              <div class="audio-controls">
                <div class="audio-panel">
                  <span>音频控制面板</span>
                  <el-slider
                    v-model="audioVolume"
                    :min="0"
                    :max="100"
                    :format-tooltip="formatTooltip"
                    @change="handleVolumeChange"
                  />
                  <el-button
                    :icon="audioMuted ? 'VideoFilled' : 'MicrophoneFilled'"
                    size="small"
                    @click="toggleMute"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 进度条区域 -->
          <div class="progress-area">
            <div class="progress-wrapper">
              <div class="progress-labels">
                <span class="progress-label start">0m</span>
                <span class="progress-label end">{{ taskTotalDistance }}m</span>
              </div>
              
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: progressPercentage + '%' }"
                ></div>
                
                <!-- 故障点标记 -->
                <div
                  v-for="flaw in realTimeFlaws"
                  :key="flaw.id"
                  class="progress-marker flaw-marker"
                  :class="{ 
                    'confirmed': flaw.confirmed === true,
                    'unconfirmed': flaw.confirmed === null || flaw.confirmed === false 
                  }"
                  :style="{ left: (flaw.flawDistance / taskTotalDistance) * 100 + '%' }"
                  :title="flaw.flawName"
                  @click="openFlawModal(flaw)"
                >
                  📍
                </div>
                
                <!-- AGV位置标记 -->
                <div
                  class="progress-marker agv-marker"
                  :style="{ left: progressPercentage + '%' }"
                  :title="`当前位置: ${currentDistance.toFixed(2)}m`"
                >
                  🚛
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 侧边栏 -->
        <div class="sidebar">
          <!-- 控制台卡片 -->
          <div class="info-card">
            <div class="card-header">
              <h3>控制台</h3>
              <el-switch
                v-model="consoleEnabled"
                active-text="启用"
                inactive-text="停用"
              />
            </div>
            <div class="card-body">
              <div class="control-buttons">
                <div class="button-row">
                  <el-button
                    type="primary"
                    :icon="Refresh"
                    @click="refreshVideo"
                    :disabled="!consoleEnabled"
                    size="small"
                  >
                    刷新监控
                  </el-button>
                  
                  <el-select
                    v-model="selectedCamera"
                    placeholder="选择摄像头"
                    @change="switchCamera"
                    :disabled="!consoleEnabled"
                    size="small"
                    style="width: 120px"
                  >
                    <el-option
                      v-for="(camera, index) in cameraList"
                      :key="index"
                      :label="`摄像头${index + 1}`"
                      :value="index"
                    />
                  </el-select>
                </div>
                
                <div class="button-row">
                  <el-button
                    type="success"
                    :icon="Check"
                    @click="completeTask"
                    :disabled="!consoleEnabled"
                    size="small"
                  >
                    完成巡检
                  </el-button>
                  
                  <el-button
                    type="danger"
                    :icon="Close"
                    @click="terminateTask"
                    :disabled="!consoleEnabled"
                    size="small"
                  >
                    终止巡检
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 车辆状态卡片 -->
          <div class="info-card">
            <div class="card-header">
              <h3>车辆状态</h3>
              <div class="agv-controls">
                <el-button
                  type="success"
                  size="small"
                  :disabled="!consoleEnabled || agvMovementState === 'forward'"
                  @click="controlAgvMovement('forward')"
                >
                  前进
                </el-button>
                <el-button
                  type="info"
                  size="small"
                  :disabled="!consoleEnabled || agvMovementState === 'stopped'"
                  @click="controlAgvMovement('stopped')"
                >
                  停止
                </el-button>
                <el-button
                  type="warning"
                  size="small"
                  :disabled="!consoleEnabled || agvMovementState === 'backward'"
                  @click="controlAgvMovement('backward')"
                >
                  后退
                </el-button>
              </div>
            </div>
            <div class="card-body">
              <div class="info-item">
                <span class="info-label">📄 巡视任务编号</span>
                <span class="info-value">{{ taskInfo.taskCode }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">⏰ 车辆系统时间</span>
                <span class="info-value">{{ systemTime }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🚛 运动状态</span>
                <span class="info-value" :class="{
                  'status-forward': agvMovementState === 'forward',
                  'status-backward': agvMovementState === 'backward',
                  'status-stopped': agvMovementState === 'stopped'
                }">
                  {{ agvMovementState === 'forward' ? '前进中' : agvMovementState === 'backward' ? '后退中' : '已停止' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">📍 已行驶距离</span>
                <span class="info-value">
                  <span class="count-animation">{{ currentDistance.toFixed(2) }}</span> 米
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">⚠️ 故障总计</span>
                <span class="info-value">{{ realTimeFlaws.length }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">✅ 已确定故障</span>
                <span class="info-value confirmed-flaw">{{ confirmedFlawsCount }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">❓ 疑似故障</span>
                <span class="info-value unconfirmed-flaw">{{ unconfirmedFlawsCount }}</span>
              </div>
            </div>
          </div>

          <!-- 故障历史卡片 -->
          <div class="info-card table-card">
            <div class="card-header">
              <h3>故障历史</h3>
            </div>
            <div class="card-body">
              <el-table
                :data="realTimeFlaws"
                height="300"
                style="width: 100%"
                highlight-current-row
                :row-class-name="getFlawRowClassName"
                @row-click="openFlawModal"
              >
                <el-table-column label="故障名称" min-width="100">
                  <template #default="scope">
                    <a class="flaw-link" @click.stop="openFlawModal(scope.row)">
                      {{ scope.row.flawName }}
                    </a>
                  </template>
                </el-table-column>
                <el-table-column prop="flawType" label="故障类型" width="80" />
                <el-table-column label="故障位置" width="80">
                  <template #default="scope">
                    {{ scope.row.flawDistance }}m
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>

    <!-- 故障详情模态框 -->
    <el-dialog
      v-model="flawModalVisible"
      title="故障详情"
      width="1150px"
      top="5vh"
      :close-on-click-modal="false"
    >
      <div v-if="selectedFlaw" class="flaw-modal-content">
        <div class="flaw-image-container">
          <el-image
            v-if="selectedFlaw.flawImageUrl"
            :src="selectedFlaw.flawImageUrl"
            :preview-src-list="[selectedFlaw.flawImageUrl]"
            fit="contain"
            style="width: 100%; height: 100%"
          >
            <template #error>
              <div class="image-placeholder">
                故障实时图片
                <br />
                (点击可预览放大)
              </div>
            </template>
          </el-image>
          <div v-else class="image-placeholder">
            故障实时图片
            <br />
            (点击可预览放大)
          </div>
        </div>
        
        <div class="flaw-info-container">
          <div class="info-card">
            <div class="card-header">
              <h3>故障信息</h3>
            </div>
            <div class="card-body">
              <div class="info-item">
                <span class="info-label">故障名称</span>
                <span class="info-value">{{ selectedFlaw.flawName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">故障类型</span>
                <span class="info-value">{{ selectedFlaw.flawType }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">故障描述</span>
                <span class="info-value">{{ selectedFlaw.flawDesc || '暂无描述' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">故障位置</span>
                <span class="info-value">{{ selectedFlaw.flawDistance }}m</span>
              </div>
              <div class="info-item">
                <span class="info-label">是否属实</span>
                <div class="info-value">
                  <el-radio-group v-model="selectedFlaw.confirmed">
                    <el-radio :value="true">是</el-radio>
                    <el-radio :value="false">否</el-radio>
                  </el-radio-group>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">补充说明</span>
                <div class="info-value">
                  <el-input
                    v-model="selectedFlaw.remark"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入内容"
                    style="width: 100%"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="flawModalVisible = false">取 消</el-button>
          <el-button
            type="primary"
            @click="saveFlawConfirmation"
            :loading="saving"
          >
            确 定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Refresh, Check, Close } from '@element-plus/icons-vue';

// API 导入
import { getTask, startTask, endTask } from '../api/task.js';
import { liveInfo, updateFlaw, checkAllConfirmed } from '../api/flaw.js';
import { heartbeat, agvForward, agvStop, agvBackward } from '../api/movement.js';
import { getEasyDevices } from '../api/camera.js';
import { getVideoStreamUrl } from '../api/webrtc.js';
import { checkFs, checkDb, checkAgv, checkCam } from '../api/system.js';

const route = useRoute();
const router = useRouter();

// 响应式数据
const taskInfo = ref({
  id: null,
  taskCode: '',
  taskName: '',
  taskTrip: '',
  taskStatus: ''
});

const realTimeFlaws = ref([]);
const selectedFlaw = ref(null);
const flawModalVisible = ref(false);
const saving = ref(false);

// 视频相关
const videoPlayer = ref(null);
const currentVideoStream = ref('');
const selectedCamera = ref(0);
const cameraList = ref(['摄像头1', '摄像头2', '摄像头3', '摄像头4']);
const cameraDevices = ref([]); // 存储实际的摄像头设备信息
const audioVolume = ref(50);
const audioMuted = ref(false);

// 控制相关
const consoleEnabled = ref(true);
const agvMovementState = ref('stopped'); // 'forward', 'stopped', 'backward'
const agvStatus = ref({
  sysTime: '',
  isRunning: false,
  currentPosition: 0
});

// 系统状态
const systemStatus = ref({
  fs: true,
  db: true,
  agv: true,
  cam: true
});

// 实时数据
const systemTime = ref('');
const currentDistance = ref(0);
const taskTotalDistance = ref(500); // 默认500米，实际从任务信息获取

// 定时器
let heartbeatTimer = null;
let flawUpdateTimer = null;
let timeUpdateTimer = null;
let distanceUpdateTimer = null;
let agvStatusTimer = null;
let systemCheckTimer = null;

// 计算属性
const progressPercentage = computed(() => {
  return Math.min((currentDistance.value / taskTotalDistance.value) * 100, 100);
});

const confirmedFlawsCount = computed(() => {
  return realTimeFlaws.value.filter(flaw => flaw.confirmed === true).length;
});

const unconfirmedFlawsCount = computed(() => {
  return realTimeFlaws.value.filter(flaw => flaw.confirmed !== true).length;
});

const currentCameraName = computed(() => {
  return cameraList.value[selectedCamera.value] || '摄像头1';
});

const currentCameraView = computed(() => {
  const views = ['前方视角', '左侧视角', '右侧视角', '后方视角'];
  return views[selectedCamera.value] || '前方视角';
});

// 方法
const goBack = () => {
  router.push('/');
};

const loadTaskInfo = async () => {
  try {
    const taskId = route.params.id;
    const response = await getTask(taskId);
    if (response.code === 200) {
      taskInfo.value = response.data;
      if (taskInfo.value.taskTrip) {
        const match = taskInfo.value.taskTrip.match(/(\d+)/);
        if (match) {
          taskTotalDistance.value = parseInt(match[1]);
        }
      }
    }
  } catch (error) {
    ElMessage.error('加载任务信息失败');
    console.error('Load task info error:', error);
  }
};

const loadCameraList = async () => {
  try {
    const response = await getEasyDevices();
    if (response && response.data && Array.isArray(response.data)) {
      cameraDevices.value = response.data;
      cameraList.value = response.data.map((device, index) => 
        device.name || `摄像头${index + 1}`
      );
    }
  } catch (error) {
    console.error('Load camera list error:', error);
    ElMessage.warning('加载摄像头列表失败，使用默认配置');
  }
};

const refreshVideo = () => {
  ElMessage.success('视频流已刷新');
  // 重新加载视频流
  switchCamera(selectedCamera.value);
};

const switchCamera = (cameraIndex) => {
  selectedCamera.value = cameraIndex;
  
  let cameraId;
  if (cameraDevices.value && cameraDevices.value[cameraIndex]) {
    // 使用实际的摄像头ID
    cameraId = cameraDevices.value[cameraIndex].id || `camera${cameraIndex + 1}`;
  } else {
    // 回退到默认的摄像头ID
    cameraId = `camera${cameraIndex + 1}`;
  }
  
  // 使用camera.js中的函数获取视频流地址
  currentVideoStream.value = getVideoStreamUrl(cameraId);
  ElMessage.info(`已切换到${currentCameraName.value}`);
};



// 新的AGV控制方法
const controlAgvMovement = async (direction) => {
  try {
    const previousState = agvMovementState.value;
    agvMovementState.value = direction;
    
    switch (direction) {
      case 'forward':
        await agvForward();
        ElMessage.success('AGV开始前进');
        break;
      case 'backward':
        await agvBackward();
        ElMessage.success('AGV开始后退');
        break;
      case 'stopped':
        await agvStop();
        ElMessage.success('AGV已停止');
        break;
    }
  } catch (error) {
    // 回滚状态
    agvMovementState.value = previousState;
    ElMessage.error(`AGV${direction === 'forward' ? '前进' : direction === 'backward' ? '后退' : '停止'}失败`);
  }
};

const completeTask = async () => {
  try {
    await ElMessageBox.confirm(
      '确认完成巡检任务吗？',
      '完成巡检',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }
    );
    
    // 检查是否所有故障都已确认
    try {
      const checkResponse = await checkAllConfirmed(taskInfo.value.id);
      if (checkResponse.code === 200 && !checkResponse.data) {
        const continueComplete = await ElMessageBox.confirm(
          '还有未确认的故障，确定要完成任务吗？',
          '确认完成',
          {
            confirmButtonText: '确定完成',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        if (continueComplete !== 'confirm') {
          return;
        }
      }
    } catch (error) {
      console.error('检查故障确认状态失败:', error);
    }
    
    await endTask(taskInfo.value.id, false);
    ElMessage.success('巡检任务已完成');
    router.push('/');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('完成任务失败');
    }
  }
};

const terminateTask = async () => {
  try {
    await ElMessageBox.confirm(
      '确认终止巡检任务吗？这将标记任务为异常结束。',
      '终止巡检',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await endTask(taskInfo.value.id, true);
    ElMessage.warning('巡检任务已终止');
    router.push('/');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('终止任务失败');
    }
  }
};

const openFlawModal = (flaw) => {
  selectedFlaw.value = { ...flaw };
  flawModalVisible.value = true;
};

const saveFlawConfirmation = async () => {
  try {
    saving.value = true;
    await updateFlaw(selectedFlaw.value);
    
    // 更新本地数据
    const index = realTimeFlaws.value.findIndex(f => f.id === selectedFlaw.value.id);
    if (index !== -1) {
      realTimeFlaws.value[index] = { ...selectedFlaw.value };
    }
    
    ElMessage.success('故障确认信息已保存');
    flawModalVisible.value = false;
  } catch (error) {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
};

const getFlawRowClassName = ({ row }) => {
  if (row.confirmed === true) {
    return 'confirmed-row';
  } else if (row.confirmed === false) {
    return 'false-row';
  }
  return 'unconfirmed-row';
};

const handleVolumeChange = (value) => {
  if (videoPlayer.value) {
    videoPlayer.value.volume = value / 100;
  }
};

const toggleMute = () => {
  audioMuted.value = !audioMuted.value;
  if (videoPlayer.value) {
    videoPlayer.value.muted = audioMuted.value;
  }
};

const formatTooltip = (value) => {
  return `${value}%`;
};

// 获取AGV实时状态
const getAgvStatus = async () => {
  try {
    const response = await heartbeat();
    if (response.code === 200 && response.data) {
      const statusData = response.data;
      agvStatus.value = {
        sysTime: statusData.sysTime || new Date().toLocaleString('zh-CN'),
        isRunning: statusData.isRunning || false,
        currentPosition: statusData.currentPosition || currentDistance.value
      };
      
      // 更新页面显示的数据
      systemTime.value = agvStatus.value.sysTime;
      // 根据实际运行状态更新运动状态
      if (!agvStatus.value.isRunning && agvMovementState.value !== 'stopped') {
        agvMovementState.value = 'stopped';
      }
      currentDistance.value = agvStatus.value.currentPosition;
    }
  } catch (error) {
    console.error('Get AGV status failed:', error);
    systemStatus.value.agv = false;
  }
};

// 检查系统状态
const checkSystemStatus = async () => {
  try {
    // 并行检查所有系统状态
    const [fsResult, dbResult, agvResult, camResult] = await Promise.allSettled([
      checkFs(),
      checkDb(),
      checkAgv(),
      checkCam()
    ]);

    systemStatus.value = {
      fs: fsResult.status === 'fulfilled' && fsResult.value?.code === 200,
      db: dbResult.status === 'fulfilled' && dbResult.value?.code === 200,
      agv: agvResult.status === 'fulfilled' && agvResult.value?.code === 200,
      cam: camResult.status === 'fulfilled' && camResult.value?.code === 200
    };

    // 如果有系统故障，给出警告
    const failedSystems = [];
    if (!systemStatus.value.fs) failedSystems.push('文件系统');
    if (!systemStatus.value.db) failedSystems.push('数据库');
    if (!systemStatus.value.agv) failedSystems.push('AGV连接');
    if (!systemStatus.value.cam) failedSystems.push('摄像头');

    if (failedSystems.length > 0) {
      ElMessage.warning(`系统检查发现问题: ${failedSystems.join(', ')}`);
    }
  } catch (error) {
    console.error('System status check failed:', error);
  }
};

// 定时器函数
const startHeartbeat = () => {
  heartbeatTimer = setInterval(async () => {
    await getAgvStatus();
  }, 5000);
};

const startFlawUpdate = () => {
  flawUpdateTimer = setInterval(async () => {
    try {
      const response = await liveInfo(taskInfo.value.id);
      if (response.code === 200) {
        realTimeFlaws.value = response.data || [];
      }
    } catch (error) {
      console.error('Update flaws failed:', error);
    }
  }, 3000);
};

const startTimeUpdate = () => {
  const updateTime = () => {
    if (!agvStatus.value.sysTime) {
      const now = new Date();
      systemTime.value = now.toLocaleString('zh-CN');
    }
  };
  
  updateTime();
  timeUpdateTimer = setInterval(updateTime, 1000);
};

const startDistanceUpdate = () => {
  distanceUpdateTimer = setInterval(() => {
    // 如果从AGV状态获取到了位置信息，就不需要模拟了
    if (!agvStatus.value.currentPosition && agvMovementState.value === 'forward') {
      // 模拟AGV前进，每次更新增加0.5-2米
      currentDistance.value += Math.random() * 1.5 + 0.5;
      if (currentDistance.value >= taskTotalDistance.value) {
        currentDistance.value = taskTotalDistance.value;
        agvMovementState.value = 'stopped';
      }
    } else if (!agvStatus.value.currentPosition && agvMovementState.value === 'backward') {
      // 模拟AGV后退，每次更新减少0.5-2米
      currentDistance.value -= Math.random() * 1.5 + 0.5;
      if (currentDistance.value <= 0) {
        currentDistance.value = 0;
        agvMovementState.value = 'stopped';
      }
    }
  }, 2000);
};

const startSystemCheck = () => {
  systemCheckTimer = setInterval(async () => {
    await checkSystemStatus();
  }, 30000); // 每30秒检查一次系统状态
};

// 生命周期
onMounted(async () => {
  await loadTaskInfo();
  await loadCameraList();
  
  // 初始系统状态检查
  await checkSystemStatus();
  
  // 启动任务
  try {
    await startTask(taskInfo.value.id);
  } catch (error) {
    console.error('Start task failed:', error);
  }
  
  // 启动定时器
  startHeartbeat();
  startFlawUpdate();
  startTimeUpdate();
  startDistanceUpdate();
  startSystemCheck();
  
  // 初始化视频流
  switchCamera(0);
});

onUnmounted(() => {
  // 清理定时器
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (flawUpdateTimer) clearInterval(flawUpdateTimer);
  if (timeUpdateTimer) clearInterval(timeUpdateTimer);
  if (distanceUpdateTimer) clearInterval(distanceUpdateTimer);
  if (agvStatusTimer) clearInterval(agvStatusTimer);
  if (systemCheckTimer) clearInterval(systemCheckTimer);
});
</script>

<style scoped>
.layout {
  height: 100vh;
  overflow: hidden;
}

.fullscreen {
  height: 100vh;
}

.breadcrumb-bar {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  height: 60px;
}

.breadcrumb-text {
  color: #666;
  font-size: 14px;
}

.main-content {
  display: flex;
  height: calc(100vh - 60px);
  padding: 0;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.video-area {
  flex: 1;
  background: #000;
  position: relative;
}

.video-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.placeholder-content {
  text-align: center;
}

.audio-controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 180px;
}

.audio-panel {
  background: rgba(0, 0, 0, 0.5);
  padding: 8px;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  text-align: center;
}

.progress-area {
  height: 120px;
  background: #fafafa;
  border-top: 1px solid #eee;
  padding: 20px;
  display: flex;
  align-items: center;
}

.progress-wrapper {
  width: 100%;
  position: relative;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  position: relative;
  margin: 26px 0;
}

.progress-fill {
  height: 100%;
  background: #409eff;
  border-radius: 4px;
  transition: width 1s ease;
}

.progress-marker {
  position: absolute;
  top: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  transform: translateX(-50%);
}

.flaw-marker {
  background: #e6a23c;
  color: white;
}

.flaw-marker.confirmed {
  background: #f56c6c;
}

.flaw-marker.unconfirmed {
  background: #e6a23c;
}

.agv-marker {
  background: #67c23a;
  color: white;
  font-size: 14px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.1); }
  100% { transform: translateX(-50%) scale(1); }
}

.sidebar {
  width: 320px;
  background: white;
  border-left: 1px solid #eee;
  overflow-y: auto;
  padding: 10px;
}

.info-card {
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
  background: white;
}

.card-header {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.card-body {
  padding: 16px;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.button-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.button-row .el-button {
  flex: 1;
  min-width: 70px;
  height: 28px;
  font-size: 12px;
}

.button-row .el-select {
  flex: 1;
  min-width: 90px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.info-label {
  width: 120px;
  color: #666;
  font-size: 14px;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.confirmed-flaw {
  color: #f56c6c;
  font-weight: bold;
}

.unconfirmed-flaw {
  color: #e6a23c;
  font-weight: bold;
}

.count-animation {
  display: inline-block;
  animation: countUp 0.5s ease-out;
}

@keyframes countUp {
  from { opacity: 0.5; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.table-card .card-body {
  padding: 0;
}

.table-card .el-table {
  font-size: 12px;
}

.flaw-link {
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
}

.flaw-link:hover {
  text-decoration: underline;
}

:deep(.confirmed-row) {
  background: #fef0f0;
}

:deep(.unconfirmed-row) {
  background: #fdf6ec;
}

:deep(.false-row) {
  background: #f0f9ff;
}

:deep(.el-table .cell) {
  padding: 4px 8px;
}

:deep(.el-table th) {
  padding: 8px 0;
}

:deep(.el-table td) {
  padding: 6px 0;
}

.flaw-modal-content {
  display: flex;
  gap: 20px;
}

.flaw-image-container {
  width: 800px;
  height: 600px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.flaw-info-container {
  width: 300px;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  text-align: center;
}

.dialog-footer {
  text-align: right;
}

.agv-controls {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.agv-controls .el-button {
  min-width: 48px;
  height: 28px;
  font-size: 12px;
  padding: 4px 8px;
}

.status-forward {
  color: #67c23a;
  font-weight: bold;
}

.status-backward {
  color: #e6a23c;
  font-weight: bold;
}

.status-stopped {
  color: #909399;
  font-weight: bold;
}
</style> 