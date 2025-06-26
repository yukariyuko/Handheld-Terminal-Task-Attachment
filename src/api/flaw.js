import axios from '../utils/request';

const baseUrl = '/api/agv/flaw';

export function listFlaw(params) {
  return axios.get(`${baseUrl}/list`, { params });
}

export function getFlaw(id) {
  return axios.get(`${baseUrl}/${id}`);
}

export function addFlaw(flaw) {
  return axios.post(baseUrl, flaw);
}

export function updateFlaw(flaw) {
  return axios.put(baseUrl, flaw);
}

export function delFlaw(id) {
  return axios.delete(`${baseUrl}/${id}`);
}

export function liveInfo(id) {
  return axios.get(`${baseUrl}/live/${id}`);
}

export function checkAllConfirmed(id) {
  return axios.get(`${baseUrl}/check/${id}`);
}
