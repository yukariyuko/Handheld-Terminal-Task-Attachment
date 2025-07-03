const NodeMediaServer = require('node-media-server');
const { startAllStreams } = require('./stream');

const config = {
  logType: 3, // 输出详细日志

  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    mediaroot: './media',  // 媒体文件存储路径
    allow_origin: '*',     // 允许所有域名访问
    webroot: './www',      // 网站根目录
    host: '0.0.0.0'       // 监听所有网卡
  },
  auth: {
    play: false,   // 禁用播放认证
    publish: false // 禁用推流认证
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]'
      }
    ]
  }
};

const nms = new NodeMediaServer(config);

// 添加CORS中间件
nms.on('preConnect', (id, args) => {
  const session = nms.getSession(id);
  session.cors = () => {
    // 允许所有跨域请求
    session.res.setHeader('Access-Control-Allow-Origin', '*');
    session.res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    session.res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    session.res.setHeader('Access-Control-Expose-Headers', 'Content-Length,Content-Range');
  };
});

// 启动流媒体服务器
nms.run();

console.log('流媒体服务器已启动');
console.log('RTMP 服务端口: 1935');
console.log('HTTP-FLV 服务端口: 8000');
console.log('推流地址示例: rtmp://localhost:1935/live/{streamName}');
console.log('拉流地址示例: http://localhost:8000/live/{streamName}.flv');

// 等待服务器完全启动后开始推流
setTimeout(() => {
  console.log('开始自动推流...');
  startAllStreams();
}, 2000); 