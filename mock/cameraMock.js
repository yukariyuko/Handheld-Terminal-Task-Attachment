// camera API的mock数据

export default [
  // 获取摄像头设备列表
  {
    url: '/easy-api/devices',
    method: 'get',
    response: () => {
      return {
        items: [
          {
            id: "camera_front",
            created_at: "2025-06-26 16:08:34",
            updated_at: "2025-06-30 14:07:15",
            name: "摄像头4",
            protocol: "PULL",
            ip: "192.168.2.14",
            port: 554,
            addr: "",
            remark: "",
            username: "",
            password: "",
            media_transport: "TCP",
            gb_code: "",
            uid: 222,
            version: "",
            ability: {
              ptz: false,
              wifi: false,
              ota: false,
              cloud_broadcast: false,
              ai: false,
              gat_1400: false,
              talk: false
            },
            status: true,
            model: "",
            channel_count: 1,
            ext: {
              wan_ip: "",
              lan_ip: ""
            },
            gb: {
              catalog_period: 0
            },
            network: "WAN",
            rtp_id: "",
            is_platform: false,
            url: "rtsp://admin:Admin123@192.168.2.14:554/Streaming/Channels/101"
          },
          {
            id: "camera_left",
            created_at: "2025-06-26 16:08:34",
            updated_at: "2025-06-30 14:07:15",
            name: "摄像头3",
            protocol: "PULL",
            ip: "192.168.2.13",
            port: 554,
            addr: "",
            remark: "",
            username: "",
            password: "",
            media_transport: "TCP",
            gb_code: "",
            uid: 223,
            version: "",
            ability: {
              ptz: false,
              wifi: false,
              ota: false,
              cloud_broadcast: false,
              ai: false,
              gat_1400: false,
              talk: false
            },
            status: true,
            model: "",
            channel_count: 1,
            ext: {
              wan_ip: "",
              lan_ip: ""
            },
            gb: {
              catalog_period: 0
            },
            network: "WAN",
            rtp_id: "",
            is_platform: false,
            url: "rtsp://admin:Admin123@192.168.2.13:554/Streaming/Channels/101"
          },
          {
            id: "camera_right",
            created_at: "2025-06-26 16:08:34",
            updated_at: "2025-06-30 14:07:15",
            name: "摄像头2",
            protocol: "PULL",
            ip: "192.168.2.12",
            port: 554,
            addr: "",
            remark: "",
            username: "",
            password: "",
            media_transport: "TCP",
            gb_code: "",
            uid: 224,
            version: "",
            ability: {
              ptz: false,
              wifi: false,
              ota: false,
              cloud_broadcast: false,
              ai: false,
              gat_1400: false,
              talk: false
            },
            status: true,
            model: "",
            channel_count: 1,
            ext: {
              wan_ip: "",
              lan_ip: ""
            },
            gb: {
              catalog_period: 0
            },
            network: "WAN",
            rtp_id: "",
            is_platform: false,
            url: "rtsp://admin:Admin123@192.168.2.12:554/Streaming/Channels/101"
          },
          {
            id: "camera_back",
            created_at: "2025-06-26 16:08:34",
            updated_at: "2025-06-30 14:07:15",
            name: "摄像头1",
            protocol: "PULL",
            ip: "192.168.2.11",
            port: 554,
            addr: "",
            remark: "",
            username: "",
            password: "",
            media_transport: "TCP",
            gb_code: "",
            uid: 225,
            version: "",
            ability: {
              ptz: false,
              wifi: false,
              ota: false,
              cloud_broadcast: false,
              ai: false,
              gat_1400: false,
              talk: false
            },
            status: true,
            model: "",
            channel_count: 1,
            ext: {
              wan_ip: "",
              lan_ip: ""
            },
            gb: {
              catalog_period: 0
            },
            network: "WAN",
            rtp_id: "",
            is_platform: false,
            url: "rtsp://admin:Admin123@192.168.2.11:554/Streaming/Channels/101"
          }
        ]
      };
    }
  }
];