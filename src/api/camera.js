import axios from '../utils/request';

// 摄像头相关接口
const baseUrl = '/easy-api';

/**
 * 获取车内所有摄像头设备列表
 * 主要用于获取摄像头ID来播放视频流
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
    }
  });
}

/**
 * 获取指定摄像头的视频流地址
 * @param {string} cameraId 摄像头ID
 */
export function getVideoStreamUrl(cameraId) {
  return `/webrtc-api/live/${cameraId}_01.flv`;
} 