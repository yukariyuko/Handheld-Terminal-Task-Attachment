import axios from 'axios';

const service = axios.create({
  timeout: 5000,
});

service.interceptors.response.use(
  response => {
    // 第一层 axios 解包
    const res = response.data;
    // 第二层后端通用返回值解包
    if (res.code !== 200) {
      return Promise.reject(res.msg || 'Error');
    }
    // 只返回后端的 data 字段
    return res.data;
  },
  error => {
    return Promise.reject(error);
  }
);

export default service;