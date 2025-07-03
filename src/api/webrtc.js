import axios from '../utils/request';

// 服务器基础URL
const MEDIA_SERVER_URL = 'http://192.168.2.57';
const WEBRTC_BASE_URL = `${MEDIA_SERVER_URL}/webrtc-api`;
const EASY_BASE_URL = `${MEDIA_SERVER_URL}/easy-api`;

/**
 * 获取视频流地址
 * @param {string} cameraId - 摄像头ID
 * @param {string} protocol - 协议类型 ('webrtc' | 'flv')
 * @returns {string} 完整的视频流URL
 */
export function getVideoStreamUrl(cameraId, protocol = 'webrtc') {
    return `${WEBRTC_BASE_URL}/live/${cameraId}_01.flv`;
}

/**
 * 检查视频流是否可用
 * @param {string} cameraId - 摄像头ID
 * @returns {Promise} axios请求Promise
 */
export function checkVideoStreamAvailable(cameraId) {
    const headers = new Headers();
    headers.append("Authorization", "Basic YWRtaW4xMjM6QWRtaW5AMTIz");
    
    return axios.get(`${WEBRTC_BASE_URL}/live/${cameraId}_01.flv`, {
        headers: headers
    });
} 