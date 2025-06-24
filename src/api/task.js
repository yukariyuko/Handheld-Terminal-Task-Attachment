import axios from '../utils/request';

const baseUrl = '/api/agv/task';

export function listTask(params) {
  return axios.get(`${baseUrl}/list`, { params });
}

export function getTask(id) {
  return axios.get(`${baseUrl}/${id}`);
}

export function addTask(task) {
  return axios.post(baseUrl, task);
}

export function updateTask(task) {
  return axios.put(baseUrl, task);
}

export function delTask(id) {
  return axios.delete(`${baseUrl}/${id}`);
}

export function startTask(id) {
  return axios.post(`${baseUrl}/start/${id}`);
}

export function endTask(id, isAbort = false) {
  return axios.post(`${baseUrl}/end/${id}`, null, { params: { isAbort } });
}

export function preUploadTask(id) {
  return axios.get(`${baseUrl}/preupload/${id}`);
}

export function uploadTask(id) {
  return axios.post(`${baseUrl}/upload/${id}`);
}
