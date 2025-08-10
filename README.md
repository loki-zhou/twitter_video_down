# X (Twitter) Video Downloader

一个功能强大的 Chrome 浏览器扩展，用于从 X (原 Twitter) 平台下载视频、GIF 动图和高清图片。

## 功能特性

- 🎥 **视频下载**: 支持下载最高质量的 MP4 视频文件
- 🖼️ **图片下载**: 下载高清原图 (支持 :large 格式)
- 🎞️ **GIF 下载**: 支持动态 GIF 图片下载
- 🚀 **一键下载**: 在推文操作栏直接添加下载按钮
- 📱 **实时监听**: 自动检测新加载的媒体内容
- 🎯 **智能识别**: 精确匹配推文中的媒体文件
- 🔄 **状态反馈**: 下载、加载、成功状态可视化

## 安装方法

### 开发者模式安装

1. 下载或克隆此项目到本地
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹
6. 扩展安装完成

## 使用方法

1. 访问 [X.com](https://x.com) 或 [Twitter.com](https://twitter.com)
2. 浏览包含视频、图片或 GIF 的推文
3. 在推文操作栏中找到绿色下载按钮 📥
4. 点击下载按钮即可保存媒体文件
5. 文件将自动保存到浏览器默认下载目录

## 技术架构

### 核心文件

```
├── manifest.json          # 扩展配置文件
├── highestquality.js      # 入口脚本，检测页面并注入主脚本
├── content.js             # 核心功能脚本
├── background.js          # 后台服务脚本
├── content.css           # 下载按钮样式
├── styles.css            # 额外 UI 样式
└── icons/                # 扩展图标
```

### 工作原理

1. **页面检测**: 自动识别 Twitter/X 页面
2. **API 拦截**: 监听 Twitter API 请求，提取媒体数据
3. **按钮注入**: 在推文操作栏动态添加下载按钮
4. **媒体下载**: 获取最高质量媒体文件并触发下载

### 关键技术

- **XMLHttpRequest 拦截**: 监听 Twitter API 调用
- **MutationObserver**: 监听 DOM 变化，处理动态加载内容
- **Fetch API**: 下载媒体文件
- **Blob 处理**: 处理二进制媒体数据
- **递归对象搜索**: 深度解析 API 响应数据

## 支持的媒体格式

| 类型 | 格式 | 质量 |
|------|------|------|
| 视频 | MP4 | 最高码率版本 |
| 图片 | JPG/PNG | :large 高清版本 |
| 动图 | GIF | 原始质量 |

## 支持的域名

- x.com
- twitter.com
- t.co
- twimg.com
- pscp.tv (Periscope)
- tweetdeck.com
- 以及其他 Twitter 相关域名

## 开发说明

### 项目结构

```javascript
// 主要功能模块
├── API 拦截器 (interceptTwitterAPI)
├── 媒体数据提取器 (extractMediaData)  
├── 下载按钮注入器 (injectDownloadButton)
├── 文件下载器 (downloadFile)
└── DOM 监听器 (MutationObserver)
```

### 核心函数

- `interceptTwitterAPI()`: 拦截 Twitter API 请求
- `extractMediaData()`: 从 API 响应提取媒体信息
- `injectDownloadButton()`: 注入下载按钮到页面
- `downloadFile()`: 执行文件下载操作
- `findInObject()`: 递归搜索对象属性

### 扩展权限

```json
{
  "permissions": [],
  "host_permissions": [
    "https://www.x.com/*",
    "https://www.twitter.com/*",
    // ... 其他 Twitter 相关域名
  ]
}
```

## 隐私说明

- ✅ 不收集用户数据
- ✅ 不发送数据到外部服务器
- ✅ 仅在 Twitter/X 页面运行
- ✅ 所有操作在本地完成
- ✅ 已移除统计追踪功能

## 兼容性

- Chrome 88+
- Edge 88+
- 其他基于 Chromium 的浏览器
- 支持 Manifest V3

## 常见问题

### Q: 为什么有些视频无法下载？
A: 可能是私有账户的内容或受版权保护的媒体，扩展只能下载公开可访问的内容。

### Q: 下载的文件保存在哪里？
A: 文件保存在浏览器默认下载目录，通常是 `Downloads` 文件夹。

### Q: 支持批量下载吗？
A: 目前支持单个推文中的所有媒体文件一次性下载。

### Q: 扩展会影响页面性能吗？
A: 扩展经过优化，对页面性能影响极小，仅在检测到媒体内容时才激活。

## 更新日志

### v15.15
- 支持最新的 X.com 域名
- 优化媒体检测算法
- 改进下载按钮样式
- 移除隐私追踪功能
- 修复兼容性问题

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 免责声明

本扩展仅供个人学习和研究使用。请遵守相关法律法规和平台服务条款，尊重内容创作者的版权。下载的内容请勿用于商业用途或侵犯他人权益。

---

**注意**: 请确保您有权下载和使用相关媒体内容，并遵守 Twitter/X 的服务条款。