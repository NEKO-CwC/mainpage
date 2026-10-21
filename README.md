# NCUHOME

NCUHOME 英文官网：介绍独立数字工作室的产品定义、设计与开发服务，包含可交互的图形、滚动动效，以及完整的前端预约意向表单。

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

## 预约功能当前边界

`Plan a call` → 项目类型、偏好日期/时间/时区 → 联系信息 → 检查、修改、下载 `.txt` 意向单。包含校验、错误定位、返回时保留填写值、键盘操作和减少动态效果支持。

**目前不会发送表单，不会查询真实可用时段，也不会保留预约。** 页面和下载文件明确说明尚未发送或确认。表单值不写入浏览器持久存储，刷新后会清空。

`site-config.js` 的 `contactDestination` 可配置一个真实的 `mailto:` 或 HTTPS 联系链接；这只是单独的联系入口，不会把表单自动发送过去。没有配置时保持为空。真正接入预约服务需要另外实现提交、服务端校验和确认流程；详见交接文档。

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
