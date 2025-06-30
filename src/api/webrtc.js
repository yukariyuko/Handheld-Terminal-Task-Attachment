import axios from '../utils/request';

const baseUrl = '/webrtc-api';

export function getVideoStreamUrl(cameraId) {
    return axios.get(`${baseUrl}/live/${cameraId}_01.flv`);
} 