import axios from 'axios';

const service = axios.create({
  baseURL: '/api', // 统一前缀，vite.config.js 中代理 /api => 后端地址
  timeout: 5000,
});

service.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code !== 200) {
      return Promise.reject(res.msg || 'Error');
    }
    return res;
  },
  error => {
    return Promise.reject(error);
  }
);

export default service;