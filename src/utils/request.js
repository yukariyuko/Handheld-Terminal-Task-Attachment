import axios from 'axios';

const service = axios.create({
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