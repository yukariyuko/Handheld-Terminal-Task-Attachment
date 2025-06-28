<template>
  <div class="task-management-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">地铁隧道巡线车智能巡检系统 / 任务列表</h1>
    </div>

    <!-- 搜索表单 -->
    <div class="search-form">
      <div class="form-row">
        <div class="form-group">
          <label>任务编号</label>
          <input 
            type="text" 
            v-model="searchForm.taskNumber" 
            placeholder="请输入任务编号"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>创建人</label>
          <input 
            type="text" 
            v-model="searchForm.creator" 
            placeholder="请输入创建人"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>执行人</label>
          <input 
            type="text" 
            v-model="searchForm.executor" 
            placeholder="请输入执行人"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>状态</label>
          <select v-model="searchForm.status" class="form-select">
            <option value="">请选择</option>
            <option value="已完成">已完成</option>
            <option value="待巡检">待巡检</option>
            <option value="待上传">待上传</option>
          </select>
        </div>
        <div class="form-actions">
          <button @click="handleSearch" class="btn btn-primary">搜索</button>
          <button @click="handleReset" class="btn btn-secondary">重置</button>
        </div>
      </div>
    </div>

    <!-- 新增按钮 -->
    <div class="toolbar">
      <button @click="handleAdd" class="btn btn-primary add-task-btn">
        + 新增任务
      </button>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th class="th-serial">序号</th>
            <th class="th-task-number">任务编号</th>
            <th class="th-task-name">任务名称</th>
            <th>起始地点</th>
            <th>任务距离</th>
            <th>创建人</th>
            <th>执行人</th>
            <th>执行时间</th>
            <th>完成时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="tableData.length === 0">
            <td colspan="11" class="no-data">暂无数据</td>
          </tr>
          <tr v-for="(item, index) in tableData" :key="item.id">
            <td class="serial-number">{{ index + 1 }}</td>
            <td class="task-number"><a href="#" class="task-link">{{ item.taskNumber }}</a></td>
            <td class="task-name">{{ item.taskName }}</td>
            <td>{{ item.startLocation }}</td>
            <td>{{ item.taskDistance }}</td>
            <td>{{ item.creator }}</td>
            <td>{{ item.executor }}</td>
            <td>{{ item.executeTime }}</td>
            <td>{{ item.completeTime }}</td>
            <td>
              <span 
                :class="['status-tag', getStatusClass(item.status)]"
              >
                {{ item.status }}
              </span>
            </td>
            <td class="actions">
              <!-- 已完成状态只显示查看 -->
              <template v-if="item.status === '已完成'">
                <button @click="handleView(item)" class="action-btn view-btn">查看</button>
              </template>
              <!-- 待巡检状态显示修改和删除 -->
              <template v-else-if="item.status === '待巡检'">
                <button @click="handleEdit(item)" class="action-btn edit-btn">修改</button>
                <button @click="handleDelete(item)" class="action-btn delete-btn">删除</button>
              </template>
              <!-- 待上传状态显示上传 -->
              <template v-else-if="item.status === '待上传'">
                <button @click="handleUpload(item)" class="action-btn upload-btn">上传</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <span class="pagination-info">共 {{ total }} 条记录，每页 {{ pageSize }} 条</span>
      <div class="pagination-controls">
        <button 
          @click="handlePageChange(currentPage - 1)" 
          :disabled="currentPage <= 1"
          class="page-btn"
        >
          上一页
        </button>
        <span class="page-number">{{ currentPage }}</span>
        <button 
          @click="handlePageChange(currentPage + 1)" 
          :disabled="currentPage >= totalPages"
          class="page-btn"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 新增任务弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>新增任务</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitAdd">
            <div class="form-row">
              <div class="form-group">
                 <label class="required">任务名称</label>
                 <input 
                   type="text" 
                   v-model="addForm.taskName" 
                   placeholder="请输入任务名称"
                   class="form-input"
                   required
                 />
               </div>
               <div class="form-group">
                 <label class="required">任务编号</label>
                 <input 
                   type="text" 
                   v-model="addForm.taskNumber" 
                   placeholder="请输入任务编号"
                   class="form-input"
                   required
                 />
               </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                 <label class="required">起始地点</label>
                 <input 
                   type="text" 
                   v-model="addForm.startLocation" 
                   placeholder="请输入起始地点"
                   class="form-input"
                   required
                 />
               </div>
               <div class="form-group">
                 <label class="required">任务距离</label>
                 <input 
                   type="text" 
                   v-model="addForm.taskDistance" 
                   placeholder="请输入任务距离"
                   class="form-input"
                   required
                 />
               </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                 <label class="required">创建人</label>
                 <input 
                   type="text" 
                   v-model="addForm.creator" 
                   placeholder="请输入创建人"
                   class="form-input"
                   required
                 />
               </div>
               <div class="form-group">
                 <label class="required">执行人</label>
                 <input 
                   type="text" 
                   v-model="addForm.executor" 
                   placeholder="请输入执行人"
                   class="form-input"
                   required
                 />
               </div>
            </div>
            <div class="form-group full-width">
              <label>备注</label>
              <textarea 
                v-model="addForm.remark" 
                placeholder="请输入备注"
                class="form-textarea"
                rows="4"
              ></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-cancel">取消</button>
          <button @click="submitAdd" class="btn btn-primary">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  listTask, 
  getTask, 
  addTask, 
  updateTask, 
  delTask, 
  startTask, 
  endTask, 
  uploadTask 
} from '../api/taskmanagee.js'

// 搜索表单数据
const searchForm = reactive({
  taskNumber: '',
  creator: '',
  executor: '',
  status: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(3)

// 弹窗控制
const showAddModal = ref(false)

// 新增表单数据
const addForm = reactive({
  taskName: '',
  taskNumber: '',
  startLocation: '',
  taskDistance: '',
  creator: '',
  executor: '',
  remark: ''
})

const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value)
})

// 获取状态样式类
const getStatusClass = (status) => {
  switch (status) {
    case '已完成':
      return 'completed'
    case '待巡检':
      return 'pending'
    case '待上传':
      return 'upload-pending'
    default:
      return ''
  }
}

// 兜底数据
const fallbackData = [
  {
    id: 1,
    taskNumber: 'T240120211901001',
    taskName: '仓库A区巡检任务',
    startLocation: '仓库A区入口',
    taskDistance: '500米',
    creator: '张三',
    executor: '李四',
    executeTime: '2024-01-20 09:00',
    completeTime: '2024-01-20 10:30',
    status: '已完成'
  },
  {
    id: 2,
    taskNumber: 'T240120211901002',
    taskName: '生产线B巡检任务',
    startLocation: '生产线B起点',
    taskDistance: '800米',
    creator: '王五',
    executor: '赵六',
    executeTime: '2024-01-20 14:00',
    completeTime: '',
    status: '待巡检'
  },
  {
    id: 3,
    taskNumber: 'T240120211901003',
    taskName: '办公区域巡检任务',
    startLocation: '办公区域门口',
    taskDistance: '300米',
    creator: '孙七',
    executor: '周八',
    executeTime: '2024-01-20 16:00',
    completeTime: '2024-01-20 17:00',
    status: '待上传'
  }
]

// 加载任务列表
const loadTasks = async () => {
  try {
    loading.value = true
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      taskNumber: searchForm.taskNumber || undefined,
      creator: searchForm.creator || undefined,
      executor: searchForm.executor || undefined,
      status: searchForm.status || undefined
    }
    
    const response = await listTask(params)
    if (response.code === 200) {
      tableData.value = response.rows || []
      total.value = response.total || 0
    } else {
      console.error('获取任务列表失败:', response.msg)
      // 使用兜底数据
      tableData.value = fallbackData
      total.value = fallbackData.length
      console.log('已使用兜底数据显示')
    }
  } catch (error) {
    console.error('获取任务列表出错:', error)
    // 使用兜底数据
    tableData.value = fallbackData
    total.value = fallbackData.length
    console.log('网络请求失败，已使用兜底数据显示')
  } finally {
    loading.value = false
  }
}

// 事件处理函数
const handleSearch = () => {
  currentPage.value = 1
  loadTasks()
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
}

const handleAdd = () => {
  showAddModal.value = true
}

const closeModal = () => {
  showAddModal.value = false
  // 重置表单
  Object.keys(addForm).forEach(key => {
    addForm[key] = ''
  })
}

const submitAdd = async () => {
  // 验证必填字段
  if (!addForm.taskName || !addForm.taskNumber || !addForm.startLocation || 
      !addForm.taskDistance || !addForm.creator || !addForm.executor) {
    alert('请填写所有必填字段')
    return
  }
  
  try {
    const taskData = {
      taskNumber: addForm.taskNumber,
      taskName: addForm.taskName,
      startLocation: addForm.startLocation,
      taskDistance: addForm.taskDistance,
      creator: addForm.creator,
      executor: addForm.executor,
      remark: addForm.remark
    }
    
    const response = await addTask(taskData)
    if (response.code === 200) {
      alert('任务添加成功！')
      closeModal()
      loadTasks() // 重新加载任务列表
    } else {
      alert('任务添加失败: ' + response.msg)
    }
  } catch (error) {
    console.error('添加任务出错:', error)
    alert('添加任务出错，请检查网络连接')
  }
}

const handleView = (item) => {
  console.log('查看', item)
  // 这里实现查看逻辑
}

const handleEdit = (item) => {
  console.log('编辑', item)
  // 这里实现编辑逻辑
}

const handleDelete = async (item) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      const response = await delTask(item.id)
      if (response.code === 200) {
        alert('删除成功！')
        loadTasks() // 重新加载任务列表
      } else {
        alert('删除失败: ' + response.msg)
      }
    } catch (error) {
      console.error('删除任务出错:', error)
      alert('删除任务出错，请检查网络连接')
    }
  }
}

const handleUpload = async (item) => {
  try {
    const response = await uploadTask(item.id)
    if (response.code === 200) {
      alert('上传成功！')
      loadTasks() // 重新加载任务列表
    } else {
      alert('上传失败: ' + response.msg)
    }
  } catch (error) {
    console.error('上传任务出错:', error)
    alert('上传任务出错，请检查网络连接')
  }
}

const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadTasks() // 重新加载任务列表
  }
}

onMounted(() => {
  // 组件挂载后加载任务列表
  loadTasks()
})
</script>

<style scoped>
.task-management-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 14px;
  font-weight: 400;
  color: #666;
  margin: 0;
  text-align: left;
}

.search-form {
  background: white;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  min-width: 160px;
}

.form-group label {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  font-weight: 500;
  text-align: left;
  align-self: flex-start;
}

.form-input,
.form-select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-select:focus {
  border-color: #1890ff;
}

.form-input::placeholder {
  color: #bfbfbf;
}

.form-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  outline: none;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-start;
}

.add-task-btn {
  margin-left: 0;
}

.table-container {
  background: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background: #fafafa;
  padding: 12px 8px;
  text-align: left;
  font-weight: 500;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}

.data-table .task-name {
  writing-mode: vertical-rl;
  text-orientation: upright;
  white-space: nowrap;
  padding: 12px 8px;
  text-align: center;
}

.data-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
}

.data-table tbody tr:hover {
  background: #f5f5f5;
}

.task-number {
  color: #1890ff;
  cursor: pointer;
}

.task-number:hover {
  text-decoration: underline;
}

.data-table .task-link {
  color: #1890ff;
  text-decoration: none;
}

.data-table .task-link:hover {
  color: #40a9ff;
  text-decoration: underline;
}

.data-table .th-serial,
.data-table .th-task-name {
  writing-mode: vertical-rl;
  text-orientation: upright;
  white-space: nowrap;
  text-align: center;
}

.device-data {
  font-weight: 500;
}

.status-tag {
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.completed {
  color: #52c41a;
}

.status-tag.in-progress {
  color: #1890ff;
}

.status-tag.pending {
  color: #fa8c16;
}

.status-tag.upload-pending {
  color: #722ed1;
}

.actions {
  white-space: nowrap;
}

.action-btn {
  padding: 4px 8px;
  margin-right: 4px;
  border: none;
  background: none;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.view-btn {
  color: #1890ff;
}

.view-btn:hover {
  color: #40a9ff;
}

.edit-btn {
  color: #fa8c16;
}

.edit-btn:hover {
  color: #ffa940;
}

.delete-btn {
  color: #ff4d4f;
}

.delete-btn:hover {
  color: #ff7875;
}

.upload-btn {
  color: #722ed1;
}

.upload-btn:hover {
  color: #9254de;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-data {
  text-align: center;
  color: #999;
  padding: 40px;
  font-style: italic;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  font-size: 14px;
  color: #666;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.page-btn:disabled {
  background: #f5f5f5;
  color: #bfbfbf;
  cursor: not-allowed;
}

.page-number {
  padding: 0 12px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #666;
}

.modal-body {
  padding: 24px;
}

.modal-body .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.modal-body .form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-body .form-group.full-width {
  width: 100%;
}

.modal-body .form-group label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
  text-align: left;
  padding-left: 0;
  margin-left: 0;
  display: block;
  width: 100%;
}

.modal-body .form-group label.required::after {
  content: '*';
  color: #000;
  margin-left: 2px;
}

.modal-body .form-input,
.modal-body .form-textarea {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.modal-body .form-textarea {
  height: auto;
  padding: 12px;
  resize: vertical;
  min-height: 80px;
}

.modal-body .form-input:focus,
.modal-body .form-textarea:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.modal-body .form-input::placeholder,
.modal-body .form-textarea::placeholder {
  color: #bfbfbf;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 0 0 8px 8px;
}

.modal-footer .btn {
  min-width: 80px;
}
</style>