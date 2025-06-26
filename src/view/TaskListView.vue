<template>
  <div class="layout">
    <el-container class="fullscreen">
      <!-- 面包屑导航 -->
      <el-header class="breadcrumb-bar">
        <div class="breadcrumb-text">
          地铁隧道巡线车智能巡检系统 / 任务列表
        </div>
        <el-button 
          type="primary" 
          :icon="Setting" 
          circle 
          @click="goToSettings"
          style="margin-left: auto"
        />
      </el-header>

      <el-main class="main-content">
        <!-- 搜索表单 -->
        <el-card class="search-card" shadow="never">
          <el-form :model="searchForm" :inline="true" @submit.prevent="handleSearch">
            <el-form-item label="任务编号">
              <el-input
                v-model="searchForm.taskCode"
                placeholder="请输入任务编号"
                clearable
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="创建人">
              <el-input
                v-model="searchForm.creator"
                placeholder="请输入创建人"
                clearable
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="执行人">
              <el-input
                v-model="searchForm.executor"
                placeholder="请输入执行人"
                clearable
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="searchForm.taskStatus"
                placeholder="请选择状态"
                clearable
                style="width: 150px"
              >
                <el-option label="待巡视" value="待巡视" />
                <el-option label="巡视中" value="巡视中" />
                <el-option label="待上传" value="待上传" />
                <el-option label="已完成" value="已完成" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch" :icon="Search">
                搜索
              </el-button>
              <el-button @click="handleReset" :icon="Refresh">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 工具栏 -->
        <div class="toolbar">
          <el-button
            type="primary"
            :icon="VideoCamera"
            @click="openAddTaskDialog"
          >
            📹 新增任务
          </el-button>
        </div>

        <!-- 任务列表表格 -->
        <el-card shadow="never">
          <el-table
            :data="taskList"
            v-loading="loading"
            style="width: 100%"
            highlight-current-row
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="taskCode" label="任务编号" width="200">
              <template #default="scope">
                <el-link
                  type="primary"
                  @click="viewTaskDetail(scope.row)"
                >
                  {{ scope.row.taskCode }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="taskName" label="任务名称" min-width="200" />
            <el-table-column prop="startPos" label="起始地点" width="130" />
            <el-table-column prop="taskTrip" label="任务距离" width="130" />
            <el-table-column prop="creator" label="创建人" width="130" />
            <el-table-column prop="executor" label="执行人" width="130" />
            <el-table-column prop="execTime" label="执行时间" width="180">
              <template #default="scope">
                {{ scope.row.execTime || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="endTime" label="完成时间" width="180">
              <template #default="scope">
                {{ scope.row.endTime || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="taskStatus" label="状态" width="120">
              <template #default="scope">
                <el-tag
                  :type="getStatusType(scope.row.taskStatus)"
                  effect="plain"
                >
                  {{ scope.row.taskStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <div class="operation-buttons">
                  <el-button
                    v-if="scope.row.taskStatus === '待巡视'"
                    type="success"
                    size="small"
                    @click="startTask(scope.row)"
                  >
                    启动
                  </el-button>
                  <el-button
                    v-if="scope.row.taskStatus === '待巡视'"
                    type="primary"
                    size="small"
                    @click="editTask(scope.row)"
                  >
                    修改
                  </el-button>
                  <el-button
                    v-if="scope.row.taskStatus === '待巡视'"
                    type="danger"
                    size="small"
                    @click="deleteTask(scope.row)"
                  >
                    删除
                  </el-button>
                  <el-button
                    v-if="scope.row.taskStatus === '待上传'"
                    type="warning"
                    size="small"
                    @click="uploadTask(scope.row)"
                  >
                    上传
                  </el-button>
                  <el-button
                    v-if="scope.row.taskStatus === '已完成' || scope.row.taskStatus === '待上传'"
                    type="info"
                    size="small"
                    @click="viewTaskDetail(scope.row)"
                  >
                    查看
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.pageNum"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-main>
    </el-container>

    <!-- 新增/编辑任务对话框 -->
    <el-dialog
      v-model="taskDialogVisible"
      :title="isEditMode ? '编辑任务' : '新增任务'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="taskFormRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务名称" prop="taskName">
              <el-input
                v-model="taskForm.taskName"
                placeholder="请输入任务名称"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务编号" prop="taskCode">
              <el-input
                v-model="taskForm.taskCode"
                placeholder="请输入任务编号"
                maxlength="20"
                :disabled="isEditMode"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起始地点" prop="startPos">
              <el-input-number
                v-model="taskForm.startPos"
                placeholder="请输入起始地点"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
              <span style="margin-left: 8px; color: #666; font-size: 12px;">米</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务距离" prop="taskTrip">
              <el-input-number
                v-model="taskForm.taskTrip"
                placeholder="请输入任务距离"
                :min="1"
                controls-position="right"
                style="width: 100%"
              />
              <span style="margin-left: 8px; color: #666; font-size: 12px;">米</span>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="创建人" prop="creator">
              <el-input
                v-model="taskForm.creator"
                placeholder="请输入创建人"
                maxlength="20"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行人" prop="executor">
              <el-input
                v-model="taskForm.executor"
                placeholder="请输入执行人"
                maxlength="20"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注">
          <el-input
            v-model="taskForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="taskDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="saveTask"
            :loading="saving"
          >
            {{ saving ? '保存中...' : '确定' }}
          </el-button>
          <el-button
            v-if="!isEditMode"
            type="success"
            @click="saveAndStartTask"
            :loading="saving"
          >
            {{ saving ? '保存中...' : '保存并启动' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Setting, 
  Search, 
  Refresh, 
  VideoCamera 
} from '@element-plus/icons-vue';

// API 导入
import { 
  listTask, 
  addTask, 
  updateTask, 
  delTask, 
  startTask as apiStartTask,
  uploadTask as apiUploadTask 
} from '../api/task.js';

const router = useRouter();

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const taskList = ref([]);
const taskDialogVisible = ref(false);
const isEditMode = ref(false);
const taskFormRef = ref(null);

// 搜索表单
const searchForm = reactive({
  taskCode: '',
  creator: '',
  executor: '',
  taskStatus: ''
});

// 分页信息
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
});

// 任务表单
const taskForm = reactive({
  id: null,
  taskName: '',
  taskCode: '',
  startPos: 0,
  taskTrip: 500,
  creator: '',
  executor: '',
  remark: ''
});

// 表单验证规则
const taskFormRules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  taskCode: [
    { required: true, message: '请输入任务编号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  startPos: [
    { required: true, message: '请输入起始地点', trigger: 'blur' },
    { type: 'number', min: 0, message: '起始地点不能小于0', trigger: 'blur' }
  ],
  taskTrip: [
    { required: true, message: '请输入任务距离', trigger: 'blur' },
    { type: 'number', min: 1, message: '任务距离不能小于1', trigger: 'blur' }
  ],
  creator: [
    { required: true, message: '请输入创建人', trigger: 'blur' }
  ],
  executor: [
    { required: true, message: '请输入执行人', trigger: 'blur' }
  ]
};

// 方法
const goToSettings = () => {
  router.push('/settings');
};

const loadTaskList = async () => {
  try {
    loading.value = true;
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      ...searchForm
    };
    
    const response = await listTask(params);
    if (response.data.code === 200) {
      taskList.value = response.data.data || response.data.rows || [];
      pagination.total = response.data.total || 0;
    } else {
      ElMessage.error(response.data.msg || '获取任务列表失败');
    }
  } catch (error) {
    ElMessage.error('获取任务列表失败');
    console.error('Load task list error:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.pageNum = 1;
  loadTaskList();
};

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = '';
  });
  pagination.pageNum = 1;
  loadTaskList();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  loadTaskList();
};

const handleCurrentChange = (page) => {
  pagination.pageNum = page;
  loadTaskList();
};

const getStatusType = (status) => {
  const statusMap = {
    '待巡视': 'warning',
    '巡视中': 'primary',
    '待上传': 'info',
    '已完成': 'success'
  };
  return statusMap[status] || 'info';
};

const openAddTaskDialog = () => {
  isEditMode.value = false;
  resetTaskForm();
  taskDialogVisible.value = true;
};

const editTask = (task) => {
  isEditMode.value = true;
  Object.keys(taskForm).forEach(key => {
    taskForm[key] = task[key] || '';
  });
  // 转换数字类型
  taskForm.startPos = parseInt(task.startPos) || 0;
  taskForm.taskTrip = parseInt(task.taskTrip) || 500;
  taskDialogVisible.value = true;
};

const resetTaskForm = () => {
  Object.keys(taskForm).forEach(key => {
    if (key === 'startPos') {
      taskForm[key] = 0;
    } else if (key === 'taskTrip') {
      taskForm[key] = 500;
    } else {
      taskForm[key] = '';
    }
  });
  if (taskFormRef.value) {
    taskFormRef.value.clearValidate();
  }
};

const saveTask = async () => {
  try {
    const valid = await taskFormRef.value.validate();
    if (!valid) return;
    
    saving.value = true;
    
    const taskData = {
      ...taskForm,
      startPos: taskForm.startPos + 'M',
      taskTrip: taskForm.taskTrip + 'M'
    };
    
    let response;
    if (isEditMode.value) {
      response = await updateTask(taskData);
    } else {
      response = await addTask(taskData);
    }
    
    if (response.data.code === 200) {
      ElMessage.success(isEditMode.value ? '编辑成功' : '创建成功');
      taskDialogVisible.value = false;
      loadTaskList();
    } else {
      ElMessage.error(response.data.msg || '保存失败');
    }
  } catch (error) {
    ElMessage.error('保存失败');
    console.error('Save task error:', error);
  } finally {
    saving.value = false;
  }
};

const saveAndStartTask = async () => {
  try {
    const valid = await taskFormRef.value.validate();
    if (!valid) return;
    
    saving.value = true;
    
    const taskData = {
      ...taskForm,
      startPos: taskForm.startPos + 'M',
      taskTrip: taskForm.taskTrip + 'M'
    };
    
    const response = await addTask(taskData);
    
    if (response.data.code === 200) {
      ElMessage.success('任务创建成功');
      taskDialogVisible.value = false;
      
      // 立即启动任务
      await startTask(response.data.data);
    } else {
      ElMessage.error(response.data.msg || '保存失败');
    }
  } catch (error) {
    ElMessage.error('保存失败');
    console.error('Save and start task error:', error);
  } finally {
    saving.value = false;
  }
};

const startTask = async (task) => {
  try {
    await ElMessageBox.confirm(
      `确认启动任务 "${task.taskName}" 吗？`,
      '启动任务',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }
    );
    
    const response = await apiStartTask(task.id);
    if (response.data.code === 200) {
      ElMessage.success('任务启动成功');
      // 跳转到执行页面
      router.push(`/task-execute/${task.id}`);
    } else {
      ElMessage.error(response.data.msg || '启动失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('启动失败');
      console.error('Start task error:', error);
    }
  }
};

const deleteTask = async (task) => {
  try {
    await ElMessageBox.confirm(
      `确认删除任务 "${task.taskName}" 吗？删除后无法恢复。`,
      '删除任务',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const response = await delTask(task.id);
    if (response.data.code === 200) {
      ElMessage.success('删除成功');
      loadTaskList();
    } else {
      ElMessage.error(response.data.msg || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
      console.error('Delete task error:', error);
    }
  }
};

const uploadTask = async (task) => {
  try {
    await ElMessageBox.confirm(
      `确认上传任务 "${task.taskName}" 的数据吗？`,
      '上传数据',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    );
    
    const response = await apiUploadTask(task.id);
    if (response.data.code === 200) {
      ElMessage.success('上传成功');
      loadTaskList();
    } else {
      ElMessage.error(response.data.msg || '上传失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('上传失败');
      console.error('Upload task error:', error);
    }
  }
};

const viewTaskDetail = (task) => {
  router.push(`/task-detail/${task.id}`);
};

// 生命周期
onMounted(() => {
  loadTaskList();
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
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
}

.breadcrumb-text {
  color: #666;
  font-size: 14px;
}

.main-content {
  padding: 20px;
  height: calc(100vh - 80px);
  overflow-y: auto;
}

.search-card {
  margin-bottom: 20px;
}

.search-card :deep(.el-card__body) {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.operation-buttons .el-button {
  margin: 0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer .el-button {
  margin-left: 10px;
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style> 