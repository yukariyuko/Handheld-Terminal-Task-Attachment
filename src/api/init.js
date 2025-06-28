import axios from '../utils/request';

const baseUrl = '/api/system/check';

//检查文件系统可用性
export function checkFs() {
  return axios.get(`${baseUrl}/fs`);
}

//检查数据库连接
export function checkDb(config) {
  return axios.get(`${baseUrl}/db`, { params: config });
}

//检查 AGV 连接
export function checkAgv(config) {
  return axios.get(`${baseUrl}/agv`, { params: config });
}

//检查摄像头连接
export function checkCam(config) {
  return axios.get(`${baseUrl}/cam`, { params: config });
}