# 手持终端流媒体服务器

这是一个基于 Node-Media-Server 的流媒体服务器，用于 mock 测试。服务器支持自动循环播放视频流。

## 前置要求

1. 安装 Node.js (建议 v14 或更高版本)
2. 安装 FFmpeg
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install ffmpeg

   # CentOS
   sudo yum install ffmpeg

   # Windows (使用 chocolatey)
   choco install ffmpeg
   ```

## 视频设置

1. 在 `media-server/videos` 目录下放置以下视频文件：
   - `front.flv` - 前方摄像头视频
   - `left.flv` - 左侧摄像头视频
   - `right.flv` - 右侧摄像头视频
   - `back.flv` - 后方摄像头视频
   - `default.flv` - 默认视频

   注意：视频文件名必须与上述名称完全匹配。

2. 视频要求：
   - 格式：FLV
   - 编码：H.264
   - 建议分辨率：1280x720 或 1920x1080
   - 建议时长：10秒以上

## 安装

```bash
cd media-server
npm install
```

## 启动服务器

1. 检查 FFmpeg 是否安装：
```bash
npm run check-ffmpeg
```

2. 启动服务器：
```bash
npm start
```

服务器启动后会自动开始循环推流所有视频。

## 服务器配置

- RTMP 服务端口: 1935
- HTTP-FLV 服务端口: 8000

## 视频流地址

### 拉流地址
```
http://localhost:8000/live/{streamName}.flv
```

可用的流名称：
- 前方摄像头: http://localhost:8000/live/front.flv
- 左侧摄像头: http://localhost:8000/live/left.flv
- 右侧摄像头: http://localhost:8000/live/right.flv
- 后方摄像头: http://localhost:8000/live/back.flv
- 默认视频流: http://localhost:8000/live/default.flv

## 注意事项

1. 确保端口 1935 和 8000 未被其他程序占用
2. 确保已正确安装 FFmpeg
3. 确保视频文件存在且格式正确
4. 如果视频流中断，服务器会自动尝试重新推流
5. 所有视频都会无限循环播放 