const { spawn } = require('child_process');
const path = require('path');

// 视频源配置
const streams = [
  {
    name: 'front',
    video: path.join(__dirname, 'videos/front.flv')
  },
  {
    name: 'left',
    video: path.join(__dirname, 'videos/left.flv')
  },
  {
    name: 'right',
    video: path.join(__dirname, 'videos/right.flv')
  },
  {
    name: 'back',
    video: path.join(__dirname, 'videos/back.flv')
  },
  {
    name: 'default',
    video: path.join(__dirname, 'videos/default.flv')
  }
];

function startStream(stream) {
  const ffmpeg = spawn('ffmpeg', [
    '-re',                // 使用原始帧率读取
    '-stream_loop', '-1', // 无限循环
    '-i', stream.video,   // 输入文件
    '-c', 'copy',         // 复制编解码器（不重新编码）
    '-f', 'flv',          // 输出格式为 FLV
    `rtmp://localhost:1935/live/${stream.name}` // 推流地址
  ]);

  console.log(`开始推流: ${stream.name}`);

  ffmpeg.stderr.on('data', (data) => {
    // FFmpeg 的日志输出到 stderr
    console.log(`${stream.name} 推流日志: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`${stream.name} 推流结束，退出码: ${code}`);
    // 如果进程意外退出，尝试重新启动
    setTimeout(() => {
      console.log(`重新启动 ${stream.name} 推流...`);
      startStream(stream);
    }, 5000);
  });

  return ffmpeg;
}

// 启动所有流
function startAllStreams() {
  return streams.map(stream => startStream(stream));
}

// 导出函数供主程序使用
module.exports = {
  startAllStreams
}; 