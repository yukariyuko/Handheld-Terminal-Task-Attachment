import axios from 'axios';  // 使用原生axios，避免响应拦截器问题

// 摄像头相关接口
const baseUrl = '/easy-api';

/**
 * 获取车内所有摄像头设备列表
 * 主要用于获取摄像头ID来播放视频流
 * 注意：摄像头API返回的数据结构与其他API不同，不包含统一的code字段
 */
export function getEasyDevices() {
  return axios.get(`${baseUrl}/devices`, {
    params: {
      page: 1,
      size: 999,
      status: '',
      id: '',
      name: ''
    },
    headers: {
      'Authorization': 'Basic YWRtaW4xMjM6QWRtaW5AMTIz'
    },
    timeout: 5000  // 添加超时设置
  }).then(response => {
    console.log('摄像头API成功响应:', response.data);
    // 摄像头API直接返回 { items: [...] } 格式
    // 转换为与其他API一致的格式，方便前端处理
    return {
      code: 200,
      data: response.data,
      msg: 'success'
    };
  }).catch(error => {
    console.error('摄像头API请求失败:', error);
    
    // 如果是404错误，提供默认的摄像头配置
    if (error.response?.status === 404) {
      console.warn('摄像头API端点不存在，使用默认配置');
      return {
        code: 200,
        data: {
          items: [
            { id: 'camera1', name: '前方摄像头', status: 'online' },
            { id: 'camera2', name: '左侧摄像头', status: 'online' },
            { id: 'camera3', name: '右侧摄像头', status: 'online' },
            { id: 'camera4', name: '后方摄像头', status: 'online' }
          ]
        },
        msg: 'using default camera config'
      };
    }
    
    // 其他错误统一处理
    throw {
      code: error.response?.status || 500,
      msg: error.message || '摄像头服务连接失败',
      data: null
    };
  });
}
