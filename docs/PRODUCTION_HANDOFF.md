# NCUHOME 生产部署交接

交接日期：2026-10-21。源码仓库：[NEKO-CwC/mainpage](https://github.com/NEKO-CwC/mainpage)。

这份文档以一台可独占网站端口的 Linux 服务器为例，使用 Docker Compose + Caddy 部署。网站是纯静态 HTML/CSS/JavaScript，没有数据库或常驻 Node 服务；Node 仅在镜像构建阶段运行。当前公开预览仍在 <https://neko-cwc.github.io/NCUHOME-mainpage/>，与这台待部署的生产服务器相互独立。

## 1. 交付内容与功能边界

交付包含官网源码、开发/构建工具、容器配置和本文。`npm run check` 检查公开资源白名单、JavaScript 语法和 HTML 本地引用；`npm run build` 生成五个公开文件，CSS/JS 文件名带内容哈希。生产环境必须提供构建后的 `dist/` 内容，不能直接把整个 Git 仓库设为网站根目录。

官网明确展示公司法定名称 **NCUHOME LLC**，并说明 NCUHOME 与公司的品牌关系。主要联系邮箱为 [customer@neko-cwc.com](mailto:customer@neko-cwc.com)，备用邮箱为 [neeeeeeeeekooooooooo@gmail.com](mailto:neeeeeeeeekooooooooo@gmail.com)，均由用户提供并维护。

预约咨询表单已实现项目与时间偏好、联系方式、校验、预览、返回修改、邮件草稿、文本下载与复制。访客在邮件应用中确认发送后，由团队回复并确认预约时间。网页本身不运行 SMTP 服务，也不会将打开邮件草稿当成已送达或预约成功。刷新页面会丢失填写值；没有浏览器持久存储。

源码上传不会触发生产发布。后续每次更新都需要按第 6 节执行发布。

## 2. 服务器和域名准备

推荐 Ubuntu 24.04 LTS 或其他仍受支持的 Linux，准备：

- Git、Docker Engine、Docker Compose v2 插件，以及有 Docker 使用权限的运维账号。Docker 安装按[官方 Ubuntu 指引](https://docs.docker.com/engine/install/ubuntu/)执行；其他系统选择对应安装页。
- 一个真实域名，以及可修改其 DNS 的权限。本文用 `www.example.com` 作占位，必须替换。这里只配置一个主机名，根域名和 `www` 不会自动同时生效。
- 服务器可访问 GitHub、Docker 镜像仓库和证书服务。构建所用基础镜像是 `node:24-alpine` 与 `caddy:2-alpine`；没有 npm 安装步骤。
- 云安全组/防火墙允许入站 TCP 80 和 443；UDP 443 用于 HTTP/3，可选。保持现有 SSH 管理入口。Docker 发布端口的访问边界也要在云安全组或宿主防火墙中落实。

检查环境：

```sh
git --version
docker version
docker compose version
sudo systemctl enable --now docker
sudo ss -lntup
```

确认 80/443 未被其他网站使用。本方案会占用这些端口；如果服务器已有 Nginx/Caddy/面板管理的网站，应将构建产物接入现有站点配置，或先为新站分配独立入口，不要直接停止其他网站。

在 DNS 中把所选主机名的 A 记录指向服务器公网 IPv4；只有 IPv6 确实可达时才添加 AAAA 记录，错误 AAAA 会导致访问或签证书失败。首次上线建议先用普通 DNS 解析，确认源站 HTTPS 正常后再决定是否加 CDN。

## 3. 首次发布

以下命令在具有目标目录写入权限、可运行 Docker 的账号下执行。目录示例是 `/opt/ncuhome`。

```sh
git clone https://github.com/NEKO-CwC/mainpage.git /opt/ncuhome
cd /opt/ncuhome
cp .env.example .env
```

编辑 `.env`，替换为真实信息：

```dotenv
SITE_DOMAIN=www.example.com
ACME_EMAIL=ops@example.com
RELEASE_TAG=local
```

`SITE_DOMAIN` 只填域名，不带 `https://`、路径或端口；`ACME_EMAIL` 填真实运维邮箱。`.env` 已被 Git 和 Docker 构建上下文排除；这两个值传给 Caddy，不会注入网页。`RELEASE_TAG` 为本地镜像标签，下面会自动改成 Git 提交加 UTC 构建时间，避免覆盖旧镜像。

```sh
sed -i "s/^RELEASE_TAG=.*/RELEASE_TAG=$(git rev-parse --short=12 HEAD)-$(date -u +%Y%m%dT%H%M%SZ)/" .env
docker compose config --quiet
docker compose build --pull web
docker compose up -d --no-build --pull never web
docker compose ps
docker compose logs --tail 100 web
```

构建会先检查源码，再生成 `dist/`。运行镜像中 `/srv/` 只有五个公开文件；Caddy 配置单独位于 `/etc/caddy/Caddyfile`，文档与源码不在网站根目录。生产服务器无需额外安装 Node/npm。

域名解析正确且 80/443 可从公网访问后，Caddy 自动申请 HTTPS 证书、将 HTTP 跳转至 HTTPS，并在后续自动续期。首次申请可能需要等待，观察日志直到外部 HTTPS 验收通过。不要用跳过证书校验的方式判定生产上线成功。

Compose 项目名固定为 `ncuhome`，证书/账户数据保存在 Docker 命名卷 `ncuhome_caddy_data`，运行配置保存在 `ncuhome_caddy_config`。日常更新不会删除它们；**不要运行 `docker compose down -v`**。容器设置了 `restart: unless-stopped`，宿主机 Docker 正常启动后会自动恢复；手动停止过的容器需再次执行 `up -d`。

## 4. 上线验收

将下面域名换成自己的真实域名，从另一台能访问公网的机器运行：

```sh
curl -I http://www.example.com/
curl -I https://www.example.com/
curl -I https://www.example.com/package.json
curl -I https://www.example.com/docs/PRODUCTION_HANDOFF.md
```

预期 HTTP 跳转至 HTTPS，HTTPS 首页返回 200 且证书可信；后两条返回 404。首页响应含 `Cache-Control: no-cache`，HTML 中带哈希的 CSS/JS 应返回 200，并含 `Cache-Control: public, max-age=31536000, immutable`。浏览器开发工具 Network 中不应出现缺失资源或脚本错误。

再用桌面浏览器和手机实际验收：

1. 从顶部滚动到底部，查看图形、滚动动效、分区、按钮和页脚；窄屏/横屏检查文字与控件是否重叠或出现水平滚动。
2. 点击 `Plan a call`。先空着必填项继续，检查错误提示和焦点；再填写项目类型、未来日期、时间、时区与联系方式，进入预览。
3. 返回编辑并修改内容，检查 `Send request by email` 打开的草稿包含正确的公司收件人、主题和最新值；再检查下载和复制文本。邮件应用需要访客确认发送，预约时间以团队邮件确认为准。
4. 使用 Tab/Shift+Tab/Enter 操作导航和表单；开启系统「减少动态效果」，确认表单仍可用、动画不妨碍阅读；再尝试 200% 文本与窄屏组合。
5. 关闭 JavaScript 时表单保持禁用，公司与备用邮箱链接仍应可用。未配置本地邮件应用时，访客可以复制内容或将下载文件通过网页邮箱发送。

完成后记录上线日期、域名、`git rev-parse HEAD`、`.env` 中的 `RELEASE_TAG` 和验收人。建议外部监控 HTTPS 首页的 200 状态与证书到期情况。

## 5. 联系方式和真实预约对接

`site-config.js` 已配置公司联系入口 `mailto:customer@neko-cwc.com`，页面另有备用 Gmail。更换维护邮箱时，应同时检查配置、页面可见地址和请求收件人，提交到源码仓库，再重新构建和发布。

表单的邮件入口使用 URL 编码生成收件人、主题和完整请求正文，由访客的邮件应用完成发送。页面不会仅凭点击宣告送达。由于不同浏览器/邮件应用对长 `mailto:` URL 的支持不同，始终保留复制文本、下载文件和直接邮箱入口。`site-config.js` 会公开下载，不能写密钥、SMTP 密码或私有 API token。

当前预约咨询由维护邮箱接收、人工沟通确认。如果今后需要网页内直接发送、实时可用时段或自动预约，需另外接入发送 API/预约服务，处理服务端校验、防滥用、发送失败和重试，以及服务端确认后的成功状态，并补充对应的个人信息保存与隐私说明。当前静态部署没有数据库迁移或 SMTP 配置要求。

## 6. 后续更新

先把网站改动提交到 `main`。服务器上检查 `git status --short`，确保没有未保存的源码改动；如有，先保存处理，不能强行覆盖。联系配置改动也应随源码提交。

下面保留一次更新前的源码版本和环境文件，供第 7 节回滚；第二次更新会覆盖这组回滚记录，长期发布记录应另行保留。

```sh
cd /opt/ncuhome
git status --short
git rev-parse HEAD > .deploy-previous-commit
cp .env .env.previous
git switch main
git pull --ff-only origin main
sed -i "s/^RELEASE_TAG=.*/RELEASE_TAG=$(git rev-parse --short=12 HEAD)-$(date -u +%Y%m%dT%H%M%SZ)/" .env
docker compose config --quiet
docker compose build --pull web
docker compose up -d --no-build --pull never web
docker compose ps
docker compose logs --tail 100 web
```

每一步成功后再继续。构建失败时旧容器仍提供旧版本，先查构建日志；如果已经写入新标签，可按第 7 节恢复配置。切换容器可能有短暂连接中断，本配置未实现多实例滚动发布。

重复第 4 节验收。保留上一版的 `ncuhome-web:<RELEASE_TAG>` 本地镜像，确认回滚窗口结束前不要清理旧镜像。基础镜像按大版本标签拉取，所以同一源码在未来重建可能采用更新的基础镜像；回滚优先使用保留的原镜像，不能把一次重新构建当成原镜像的精确恢复。

## 7. 回滚

以下适用于已经按第 6 节保存了更新前记录，且旧镜像仍在本机的情况。先确认这些记录存在，并确认工作区没有未保存的源码改动：

```sh
cd /opt/ncuhome
cat .deploy-previous-commit
cat .env.previous
docker image ls ncuhome-web
git status --short
```

恢复旧源码（包含其 Compose 文件）和环境配置，使用旧镜像启动，不拉取、不构建：

```sh
git switch --detach "$(cat .deploy-previous-commit)"
cp .env.previous .env
docker compose config --quiet
docker compose up -d --no-build --pull never web
docker compose ps
docker compose logs --tail 100 web
```

重复第 4 节验收。回滚后处于 detached HEAD 是预期行为；下次更新按第 6 节的 `git switch main` 回到主分支。如果旧镜像丢失，可以用对应旧提交重新构建，但基础镜像可能变化，不能保证完全一致。

## 8. 日志、备份和常见故障

```sh
cd /opt/ncuhome
docker compose ps
docker compose logs --tail 200 web
docker compose logs -f web
docker compose restart web
```

`logs -f` 用 Ctrl+C 退出。访问和服务日志写入 Docker 标准输出，每容器日志按 10 MB、3 份轮转。邮件由访客的邮件应用和维护邮箱处理，Caddy 日志不记录邮件送达或预约确认；应在邮箱侧检查这些记录。访问日志含普通 IP/路径，需要按自身运维政策管理。

备份范围为：Git 源码版本、当前/前版 `.env`、发布标签记录，以及 `ncuhome_caddy_data` 命名卷的证书与账户数据。使用现有服务器的 Docker 卷备份机制，备份放在服务器之外并限制访问。静态构建文件可由源码重建；无需备份数据库。不要把环境文件或证书上传到公开仓库。

| 现象 | 优先检查 |
| --- | --- |
| 80/443 绑定失败 | `ss -lntup`、现有 Nginx/Caddy/其他容器；先确定端口归属 |
| 申请证书失败 | A/AAAA、云安全组、80/443、域名/CDN 模式、服务器时间与出站网络；看 Caddy 日志，不要反复删证书卷 |
| 服务器能打开，外部不能 | 公网地址、DNS、云安全组和防火墙；不是 4173 开发端口问题 |
| CSS/JS 404 | 是否发布了完整 `dist/`；HTML 与带哈希资源必须来自同一构建 |
| 更新后仍是旧页 | 当前容器镜像标签、CDN HTML 缓存、浏览器强制刷新；首页不应被 CDN 长期缓存 |
| `package.json` 或本文可在站点访问 | 网站根目录配置错误，必须只提供构建产物 |
| 请求邮件没有到达 | 是否在邮件应用中完成发送、收件地址、退信/垃圾邮件和维护邮箱接收规则；打开草稿不代表已发送 |

## 9. 本次交付验证范围

初次源码交接（`de08888`）已通过宿主机与 Docker 镜像内的检查/构建、生产 Caddy 配置校验，以及实际 Caddy 静态服务测试：当时的五个文件与对应公开版本逐字节相同，首页/资源缓存、HEAD、gzip 和十条内部或不存在路径的 404 均符合预期。部署与回滚步骤另经独立静态复核。

公司身份、维护邮箱与邮件请求入口更新后，需检查/构建，并实际走通表单、编辑、草稿收件人与正文、下载及窄屏布局。自动化检查邮件草稿时不实际向维护邮箱发送测试邮件；真实收信和人工确认由邮箱维护人员验收。

真实域名 DNS、生产服务器网络、公开 CA 签发和生产浏览器验收，需要部署人员在自己的服务器上完成第 2–4 节。
