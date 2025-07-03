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
    
    // 添加一个状态来标记是否需要刷新系统检查
    const needRefresh = ref(false);
    
    const API_BASE_URL = '/api'; // 使用相对路径，通过 vite 代理和 mock 处理


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
            console.log('正在从服务器获取配置...');
            const response = await axios.get(`${API_BASE_URL}/agv/config`);
            console.log(response);
            if (response && response.data.code === 200) {
                configData.value = response.data.data;
                console.log('配置加载成功:', configData.value);
            } else {
                console.error('Pinia store: 获取配置失败', response);
                throw new Error(response?.data.msg || '获取配置失败');
            }
        } catch (error) {
            console.error('Pinia store: 网络错误', error);
            // 如果配置加载失败，使用默认配置
            console.log('使用默认配置继续执行...');
            // 不抛出异常，让程序继续执行
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

    // 设置需要刷新的状态
    function setNeedRefresh(value) {
        needRefresh.value = value;
    }

    return {
        configData,
        needRefresh,
        host,
        drivePort,
        analysisPort,
        cloudUrl,
        fetchConfig,
        updateConfig,
        setNeedRefresh
    }
})