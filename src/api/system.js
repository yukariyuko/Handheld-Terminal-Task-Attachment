import axios from '../utils/request';

// 系统检查相关接口
const baseUrl = '/api/system/check';

/**
 * 检查文件系统可用性
 */
export function checkFs() {
  return axios.get(`${baseUrl}/fs`);
}

/**
 * 检查数据库连接
 */
export function checkDb() {
  return axios.get(`${baseUrl}/db`);
}

/**
 * 检查AGV连接
 */
export function checkAgv() {
  return axios.get(`${baseUrl}/agv`);
}

/**
 * 检查摄像头连接
 */
export function checkCam() {
  return axios.get(`${baseUrl}/cam`);
} 