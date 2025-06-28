// mock/init.js

const systemStatus = {
    fs: {
      success: true,
      message: '文件系统完好无损',
    },
    db: {
      success: true,
      message: '数据库连接成功，响应时间 25ms',
    },
    agv: {
      success: true,
      message: 'AGV 控制系统心跳正常',
    },
    cam: {
      success: true,
      message: '所有摄像头通道均在线',
    },
  };

export default [
// 1. Mock - 检查系统文件完整性
{
    url: '/api/system/check/fs',
    method: 'get',
    response: () => {
    if (systemStatus.fs.success) {
        return { code: 200, msg: systemStatus.fs.message, data: null };
    }
    return { code: 500, msg: '错误：核心文件 a.dll 已损坏', data: null };
    },
},

// 2. Mock - 检查数据库连接
{
    url: '/api/system/check/db',
    method: 'get',
    response: () => {
    if (systemStatus.db.success) {
        return { code: 200, msg: systemStatus.db.message, data: null };
    }
    return { code: 500, msg: '错误：数据库连接超时', data: null };
    },
},

// 3. Mock - 检查AGV连接
{
    url: '/api/system/check/agv',
    method: 'get',
    response: () => {
    if (systemStatus.agv.success) {
        return { code: 200, msg: systemStatus.agv.message, data: null };
    }
    return { code: 500, msg: '错误：无法 Ping 通车辆主机', data: null };
    },
},

// 4. Mock - 检查摄像头连接
{
    url: '/api/system/check/cam',
    method: 'get',
    response: () => {
    if (systemStatus.cam.success) {
        return { code: 200, msg: systemStatus.cam.message, data: null };
    }
    return { code: 500, msg: '错误：摄像头认证失败', data: null };
    },
},
];