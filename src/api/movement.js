import axios from '../utils/request';

// AGV移动控制相关接口
const baseUrl = '/api/agv/movement';

/**
 * 查询AGV心跳状态
 */
export function heartbeat() {
  return axios.get(`${baseUrl}/heartbeat`);
}

/**
 * 控制AGV向前移动
 */
export function agvForward() {
  return axios.post(`${baseUrl}/forward`);
}

/**
 * 停止AGV
 */
export function agvStop() {
  return axios.post(`${baseUrl}/stop`);
}

/**
 * 控制AGV向后移动
 */
export function agvBackward() {
  return axios.post(`${baseUrl}/backward`);
} 