import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Media Server 启动脚本
 * 用于在运行 TaskExecuteView 测试前启动媒体服务
 */

class MediaServer {
  constructor() {
    this.serverProcess = null;
    this.rtmpPort = 1935;
    this.httpPort = 8000;
    this.host = 'localhost';
    this.mediaServerPath = path.join(__dirname, '../media-server');
  }

  /**
   * 检查端口是否可用
   */
  async checkPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, (err) => {
        if (err) {
          resolve(false);
        } else {
          server.close(() => resolve(true));
        }
      });
      server.on('error', () => resolve(false));
    });
  }

  /**
   * 等待端口可用
   */
  async waitForPort(port, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const socket = new net.Socket();
        await new Promise((resolve, reject) => {
          socket.setTimeout(1000);
          socket.on('connect', () => {
            socket.destroy();
            resolve();
          });
          socket.on('timeout', () => {
            socket.destroy();
            reject(new Error('timeout'));
          });
          socket.on('error', reject);
          socket.connect(port, this.host);
        });
        return true;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return false;
  }

  /**
   * 检查 FFmpeg 是否已安装
   */
  async checkFFmpeg() {
    try {
      const ffmpegProcess = spawn('ffmpeg', ['-version'], { stdio: 'pipe' });
      
      return new Promise((resolve) => {
        ffmpegProcess.on('close', (code) => {
          resolve(code === 0);
        });
        ffmpegProcess.on('error', () => {
          resolve(false);
        });
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * 启动 Media Server
   */
  async start() {
    console.log('🎥 正在启动 Media Server...');
    
    // 检查 FFmpeg
    const hasFFmpeg = await this.checkFFmpeg();
    if (!hasFFmpeg) {
      console.warn('⚠️  FFmpeg 未安装，媒体服务器可能无法正常工作');
      console.warn('请参考 media-server/README.md 安装 FFmpeg');
    }
    
    // 检查端口是否被占用
    const isHttpPortAvailable = await this.checkPortAvailable(this.httpPort);
    const isRtmpPortAvailable = await this.checkPortAvailable(this.rtmpPort);
    
    if (!isHttpPortAvailable || !isRtmpPortAvailable) {
      console.log(`⚠️  端口 ${this.httpPort} 或 ${this.rtmpPort} 已被占用，尝试使用现有服务...`);
      const isServerRunning = await this.waitForPort(this.httpPort, 5000);
      if (isServerRunning) {
        console.log('✅ Media Server 已在运行');
        console.log(`📡 HTTP-FLV 服务: http://localhost:${this.httpPort}/live/{streamName}.flv`);
        console.log(`📺 RTMP 服务: rtmp://localhost:${this.rtmpPort}/live/{streamName}`);
        return true;
      } else {
        console.error('❌ 端口被占用但服务不可用');
        return false;
      }
    }

    try {
      // 启动媒体服务器
      console.log(`📁 媒体服务器路径: ${this.mediaServerPath}`);
      
      this.serverProcess = spawn('npm', ['start'], {
        cwd: this.mediaServerPath,
        stdio: 'pipe',
        detached: false,
        shell: true
      });

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`📺 Media Server: ${output}`);
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error && !error.includes('deprecated')) {
          console.error(`❌ Media Server Error: ${error}`);
        }
      });

      this.serverProcess.on('close', (code) => {
        console.log(`🛑 Media Server 进程退出，退出码: ${code}`);
      });

      this.serverProcess.on('error', (error) => {
        console.error(`❌ Media Server 启动失败: ${error.message}`);
      });

      // 等待服务器启动
      console.log('⏳ 等待媒体服务器启动...');
      const isStarted = await this.waitForPort(this.httpPort, 30000);
      if (isStarted) {
        console.log(`✅ Media Server 已启动`);
        console.log(`📡 HTTP-FLV 服务: http://localhost:${this.httpPort}/live/{streamName}.flv`);
        console.log(`📺 RTMP 服务: rtmp://localhost:${this.rtmpPort}/live/{streamName}`);
        console.log('🎬 可用的视频流:');
        console.log('   - front.flv (前方摄像头)');
        console.log('   - left.flv (左侧摄像头)');
        console.log('   - right.flv (右侧摄像头)');
        console.log('   - back.flv (后方摄像头)');
        console.log('   - default.flv (默认视频)');
        
        // 等待推流启动
        await new Promise(resolve => setTimeout(resolve, 3000));
        return true;
      } else {
        console.error('❌ Media Server 启动超时');
        return false;
      }
    } catch (error) {
      console.error('❌ 启动 Media Server 失败:', error.message);
      return false;
    }
  }

  /**
   * 停止 Media Server
   */
  async stop() {
    if (this.serverProcess) {
      console.log('🛑 正在停止 Media Server...');
      
      // 在 Windows 上需要特殊处理
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', this.serverProcess.pid, '/f', '/t'], {
          stdio: 'inherit'
        });
      } else {
        this.serverProcess.kill('SIGTERM');
      }
      
      // 等待进程结束
      await new Promise((resolve) => {
        this.serverProcess.on('close', resolve);
        setTimeout(() => {
          if (this.serverProcess && !this.serverProcess.killed) {
            if (process.platform === 'win32') {
              spawn('taskkill', ['/pid', this.serverProcess.pid, '/f', '/t']);
            } else {
              this.serverProcess.kill('SIGKILL');
            }
          }
          resolve();
        }, 5000);
      });
      
      this.serverProcess = null;
      console.log('✅ Media Server 已停止');
    }
  }

  /**
   * 获取媒体流 URL
   */
  getStreamUrl(cameraId, protocol = 'http') {
    if (protocol === 'http' || protocol === 'flv') {
      return `http://${this.host}:${this.httpPort}/live/${cameraId}.flv`;
    } else if (protocol === 'rtmp') {
      return `rtmp://${this.host}:${this.rtmpPort}/live/${cameraId}`;
    } else {
      // 对于 WebRTC 和其他协议，返回 HTTP-FLV 作为后备
      return `http://${this.host}:${this.httpPort}/live/${cameraId}.flv`;
    }
  }

  /**
   * 获取摄像头映射
   */
  getCameraMapping() {
    return {
      'cam1': 'front',
      'cam2': 'left', 
      'cam3': 'right',
      'cam4': 'back',
      'camera1': 'front',
      'camera2': 'left',
      'camera3': 'right', 
      'camera4': 'back'
    };
  }

  /**
   * 根据摄像头ID获取流名称
   */
  getStreamName(cameraId) {
    const mapping = this.getCameraMapping();
    return mapping[cameraId] || 'default';
  }
}

export default MediaServer;

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const mediaServer = new MediaServer();
  
  // 处理进程退出
  process.on('SIGINT', async () => {
    await mediaServer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await mediaServer.stop();
    process.exit(0);
  });

  // 启动服务器
  mediaServer.start().then((success) => {
    if (success) {
      console.log('🎉 Media Server 启动成功！');
      console.log('📄 查看详细说明: media-server/README.md');
      console.log('按 Ctrl+C 停止服务器');
    } else {
      console.error('💥 Media Server 启动失败');
      console.error('请检查:');
      console.error('1. FFmpeg 是否已安装');
      console.error('2. 端口 1935 和 8000 是否被占用');
      console.error('3. media-server 目录是否存在');
      process.exit(1);
    }
  });
} 