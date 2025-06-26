//定义config公共变量
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'


export const useConfigStore = defineStore('config', () => {

    const configData = ref({
        id: null,
        host: '',
        drivePort: null,
        analysisPort: null,
        cloudUrl: '',
        cam1: '',
        username1: '',
        password1: '',
        cam2: '',
        username2: '',
        password2: '',
        cam3: '',
        username3: '',
        password3: '',
        cam4: '',
        username4: '',
        password4: '',
    });
    const API_BASE_URL = 'http://192.168.2.2/prod-api';


    const host = () => {
        return configData.value.host;
    }

    const drivePort = () => {
        return configData.value.drivePort;
    }

    const analysisPort = () => {
        return configData.value.analysisPort;
    }

    const cloudUrl = () => {
        return configData.value.cloudUrl;
    }


    async function fetchConfig() {
        try {
            const response = await axios.get(`${API_BASE_URL}/agv/config`);
            if (response.data && response.data.code === 200) {
                configData.value = response.data.data;
            } else {
                console.error('Pinia store: 获取配置失败');
            }
        } catch (error) {
            console.error('Pinia store: 网络错误', error);
        }
    }

    async function updateConfig() {
        try {
            await axios.put(`${API_BASE_URL}/agv/config`, configData.value);
            alert('配置已通过 Pinia 更新成功！');
        } catch (error) {
            console.error('Pinia store: 更新配置失败', error);
            alert('更新失败！');
        }
    }

    return {
        configData,
        host,
        drivePort,
        analysisPort,
        cloudUrl,
        fetchConfig,
        updateConfig
    }
})