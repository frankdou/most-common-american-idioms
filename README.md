# Most Common American Idioms

1355 条常见美式习语。一次读一条，释义、例句和朗读按需加载。

原文由 [@xiaolai](https://twitter.com/xiaolai) 用 ChatGPT 和语音合成整理。本阅读页基于 [JinXJinX/most-common-american-idioms](https://github.com/JinXJinX/most-common-american-idioms)。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

产物在 `dist/`。`public/data` 会复制到 `dist/data/`，根目录的 `audio/` 会复制到 `dist/audio/`。

## Cloudflare Pages

用 Git 连接这个仓库，构建配置填：

- 构建命令：`npm run build`
- 构建输出目录：`dist`
- Node.js：22（仓库里的 `.node-version`）

部署在站点根路径。页面只有一个入口，当前习语记在 `?n=` 上，不需要重定向规则。

用 Git 构建上传。拖拽上传的上限是 1000 个文件，这份产物大约 5400 个。Free 计划每个站点最多 20000 个文件，单个文件最大 25 MiB。当前产物大约 5400 个文件，最大的音频约 320 KiB。
