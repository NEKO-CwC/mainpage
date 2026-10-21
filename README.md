# NCUHOME

NCUHOME 英文官网：介绍独立数字工作室的产品定义、设计与开发服务，包含可交互的图形、滚动动效，以及通过邮件联系与预约咨询的表单。

NCUHOME 是 **NCUHOME LLC** 对外使用的品牌名称。主要联系邮箱为 [customer@neko-cwc.com](mailto:customer@neko-cwc.com)，备用邮箱为 [neeeeeeeeekooooooooo@gmail.com](mailto:neeeeeeeeekooooooooo@gmail.com)。

- **[生产部署与交接文档](docs/PRODUCTION_HANDOFF.md)**：服务器准备、域名、HTTPS、发布、更新、回滚和验收。
- 源码仓库：https://github.com/NEKO-CwC/mainpage
- 当前公开预览：https://neko-cwc.github.io/NCUHOME-mainpage/

## 本地开发

需要 Node.js 24；没有 npm 依赖，不需要 `npm install`。

```sh
npm run dev
# 在其他设备上预览时：npm run dev -- --host 0.0.0.0
npm run check
npm run build
```

默认预览地址为 `http://127.0.0.1:4173`。开发服务器只用于预览。构建生成的 `dist/` 才是生产网站根目录：共五个文件，CSS/JS 使用内容哈希文件名，HTML 自动引用对应版本。源码、文档、环境文件和构建工具不会进入站点目录。

## 服务器部署

仓库包含多阶段 `Dockerfile`、`compose.yaml`、`deploy/Caddyfile` 和 `.env.example`。Node 只参与构建，Caddy 负责静态文件、HTTP 跳转、HTTPS 证书和续期；服务器不需要安装 Node。按[交接文档](docs/PRODUCTION_HANDOFF.md)配置真实域名后启动。

GitHub 源码推送与服务器发布是两个步骤；当前没有自动发布到生产服务器的工作流。

## 预约与邮件联系

`Plan a call` → 项目类型、偏好日期/时间/时区 → 联系信息 → 检查、修改 → `Send request by email`。按钮在访客的邮件应用中预填收件人、主题和完整表单内容，访客确认后发送；团队通过邮件沟通并确认预约时间。也可直接使用页面上的邮箱链接联系公司。

表单保留校验、错误定位、返回编辑、文本下载和复制功能。没有配置邮件应用时，可以复制请求内容，或将下载文件通过网页邮箱发送到公司邮箱。表单值不写入浏览器持久存储，刷新后会清空。

邮件发送由访客的邮件应用完成；网页不会将打开草稿当成送达确认，也不会自动锁定时段。`site-config.js` 配置公司联系入口，更新配置后需重新构建发布。若今后接入站内发送 API 或实时日历，需另行实现其服务端确认状态；详见交接文档。

## 源码结构

| 路径 | 用途 |
| --- | --- |
| `index.html` | 内容、语义结构和表单 |
| `tokens.css`、`styles.css` | 视觉变量、组件、响应式与动效 |
| `assets/main.js` | 图形交互、动画和表单状态 |
| `site-config.js` | 可公开的联系入口配置 |
| `scripts/` | 资源白名单、检查、构建和开发服务器 |
| `deploy/`、`Dockerfile`、`compose.yaml` | 生产静态服务与容器配置 |
| `docs/PRODUCTION_HANDOFF.md` | 部署和运维交接 |

图形以 SVG 作为基础交互，Canvas2D 仅增强视觉，不依赖 WebGL。字体来自系统，无第三方字体、统计服务或运行时包依赖。此源码仓库不包含原始讨论、内部评审记录或凭据。
