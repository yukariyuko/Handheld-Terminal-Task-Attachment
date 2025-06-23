import axios from 'axios';

const API_BASE_URL = 'http://192.168.2.2/prod-api';

/**
 * 获取系统配置
 * @returns {Promise}
 */
export function getConfig() {
    // 对应接口文档中的 `getConfig` 方法
    return axios.get(`${API_BASE_URL}/agv/config`);
}

/**
 * 更新系统配置
 * @param {object} config - 配置数据对象，结构需符合 AgvConfig 实体
 * @returns {Promise}
 */
export function updateConfig(config) {
    // 对应接口文档中的 `updateConfig` 方法
    return axios.put(`${API_BASE_URL}/agv/config`, config);
}