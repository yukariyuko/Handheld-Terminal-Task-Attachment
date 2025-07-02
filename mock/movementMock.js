import Mock from 'mockjs';

// AGV运动状态
const agvState = {
  isRunning: false,
  currentPosition: 0,
  sysTime: new Date().toLocaleString('zh-CN'),
  direction: 'stopped', // 'forward', 'backward', 'stopped'
};

// 更新AGV位置的辅助函数
function updatePosition() {
  if (agvState.direction === 'forward') {
    agvState.currentPosition += Math.random() * 1.5 + 0.5; // 每次前进0.5-2米
  } else if (agvState.direction === 'backward') {
    agvState.currentPosition = Math.max(0, agvState.currentPosition - (Math.random() * 1.5 + 0.5)); // 每次后退0.5-2米,不小于0
  }
  agvState.sysTime = new Date().toLocaleString('zh-CN');
}

export default [
  // 1. AGV心跳状态
  {
    url: '/api/agv/movement/heartbeat',
    method: 'get',
    response: () => {
      updatePosition(); // 更新位置
      return {
        code: 200,
        msg: '获取心跳成功',
        data: {
          sysTime: agvState.sysTime,
          isRunning: agvState.direction !== 'stopped',
          currentPosition: agvState.currentPosition
        }
      };
    },
  },

  // 2. AGV前进控制
  {
    url: '/api/agv/movement/forward',
    method: 'post',
    response: () => {
      agvState.direction = 'forward';
      agvState.isRunning = true;
      return {
        code: 200,
        msg: 'AGV开始前进',
        data: null
      };
    },
  },

  // 3. AGV停止控制
  {
    url: '/api/agv/movement/stop',
    method: 'post',
    response: () => {
      agvState.direction = 'stopped';
      agvState.isRunning = false;
      return {
        code: 200,
        msg: 'AGV已停止',
        data: null
      };
    },
  },

  // 4. AGV后退控制
  {
    url: '/api/agv/movement/backward',
    method: 'post',
    response: () => {
      agvState.direction = 'backward';
      agvState.isRunning = true;
      return {
        code: 200,
        msg: 'AGV开始后退',
        data: null
      };
    },
  },
]; 