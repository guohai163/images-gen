![魔法画布 Logo](./public/branding/magic-canvas-logo.png)

# 魔法画布 (The Magic Canvas)

一个用于调用远程图片生成接口的 Web 工作台。前端负责配置和展示，Node 服务端负责同源代理请求，避免浏览器跨域问题。

## 功能

- 配置上游接口域名和 API Key，并保存到浏览器本地存储
- 输入多行提示词，选择尺寸预设或手动填写宽高
- 通过本地 `/api/generate` 生成图片并预览、下载
- 通过本地 `/api/usage` 拉取用量并展示
- 保存最近 10 条生成历史

## 本地运行

安装依赖：

```bash
npm install
```

启动应用：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

说明：

- `npm run dev` 会持续构建前端资源，并由 Node 服务提供页面和 `/api/*` 代理接口
- 页面里填写的 `baseUrl` 和 `apiKey` 会保存在浏览器本地存储中
- 服务端不会持久化 Key，只是在请求时把前端传来的值转发给上游接口

## 构建生产产物

```bash
npm run build
```

构建后可直接启动：

```bash
npm run preview
```

## Docker

构建镜像：

```bash
docker build -t ghcr.io/guohai163/magic-canvas:latest .
```

运行容器：

```bash
docker run --rm -p 3000:3000 ghcr.io/guohai163/magic-canvas:latest
```

自定义端口：

```bash
docker run --rm -e PORT=8080 -p 8080:8080 ghcr.io/guohai163/magic-canvas:latest
```

## Docker Compose

仓库中已提供示例文件 [docker-compose.yml](/Users/guohai/Develop/github/images-gen/docker-compose.yml)，默认直接使用 GitHub Actions 推送到 GHCR 的镜像：

```yaml
ghcr.io/guohai163/magic-canvas:latest
```

启动方式：

```bash
docker compose up -d
```

如果你想改宿主机端口，可以在同目录下先设置环境变量：

```bash
IMAGE_GEN_PORT=8080 docker compose up -d
```

停止并删除容器：

```bash
docker compose down
```

说明：

- 容器内固定监听 `3000`
- 宿主机默认暴露 `3000`，可通过 `IMAGE_GEN_PORT` 覆盖
- 页面里的上游 `baseUrl` 和 `apiKey` 仍然由最终用户在浏览器中配置并保存在浏览器本地

## 安全说明

- 这个项目当前的设计仍允许用户在页面中输入并保存 API Key
- API Key 默认保存在浏览器本地存储中，适合个人或受控环境使用
- 服务端代理主要用于规避浏览器跨域限制，不承担密钥托管职责
