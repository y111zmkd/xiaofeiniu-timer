# 小飞牛计时 PWA 与公网发布 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有小飞牛计时发布为带正式 Logo、可公开分享、可安装到手机桌面并在首次联网后离线使用的 PWA。

**Architecture:** 保持当前纯静态单页计算器，不增加服务器或数据库。`manifest.webmanifest` 描述安装信息，`sw.js` 缓存应用外壳，GitHub 保存源码，Vercel 提供唯一 HTTPS 正式入口，二维码固定编码该生产网址。

**Tech Stack:** HTML/CSS/JavaScript、Web App Manifest、Service Worker、Node.js `node:test`、Python Pillow/qrcode、GitHub、Vercel。

## Global Constraints

- GitHub 公开仓库固定为 `y111zmkd/xiaofeiniu-timer`。
- Vercel 项目固定为 `xiaofeiniu-timer`，Vercel 生产地址是唯一分享入口。
- 应用名称使用“小飞牛计时”，黑色主题，使用 `assets/xiaofeiniu-logo-source.jpg`。
- 只支持手机优先的同一套苹果/安卓图标，不制作两个品牌版本。
- 首次联网加载后必须可以离线打开和计算。
- 不增加登录、云同步、数据库、App Store 发布或电脑端专用界面。
- 不改变现有计算规则和黑银 UI。
- 遇到 PWA、GitHub、Vercel、二维码或手机离线问题时，先参考 `D:\CodexProjects\记账小程序` 的已验证结构和 `PROJECT_CONTEXT.md` 记录；只复用流程，不复用旧项目名称、网址或品牌资源。

---

### Task 1: PWA 清单、离线缓存与页面接入

**Files:**
- Create: `manifest.webmanifest`
- Create: `sw.js`
- Modify: `index.html`
- Modify: `tests/standalone-page.test.js`

**Interfaces:**
- Produces: 浏览器可读取的 `manifest.webmanifest`，以及作用域为 `./` 的 Service Worker。
- Consumes: 现有 `index.html` 与稍后生成的 `assets/icon-180.png`、`icon-192.png`、`icon-512.png`。

- [ ] **Step 1: 写入失败测试**

在 `tests/standalone-page.test.js` 增加断言：

```js
test('page exposes install metadata and registers offline support', () => {
  assert.match(page, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(page, /rel="apple-touch-icon" href="\.\/assets\/icon-180\.png"/);
  assert.match(page, /name="theme-color" content="#000000"/);
  assert.match(page, /serviceWorker\.register\('\.\/sw\.js'\)/);
});
```

创建 `tests/pwa-files.test.js`，读取并验证清单和 Service Worker：

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.join(__dirname, '..');

test('manifest defines the installable mobile app', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.name, '小飞牛计时');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#000000');
  assert.deepEqual(manifest.icons.map(icon => icon.sizes), ['192x192', '512x512']);
});

test('service worker precaches the complete app shell', () => {
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  for (const file of ['./index.html', './manifest.webmanifest', './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png']) {
    assert.match(worker, new RegExp(file.replaceAll('.', '\\\\.')));
  }
  assert.match(worker, /caches\.match\('\.\/index\.html'\)/);
});
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `node --test tests/standalone-page.test.js tests/pwa-files.test.js`

Expected: FAIL，因为页面尚未接入清单，且两个 PWA 文件不存在。

- [ ] **Step 3: 添加最小 PWA 实现**

`manifest.webmanifest` 使用：

```json
{
  "id": "./",
  "name": "小飞牛计时",
  "short_name": "小飞牛计时",
  "description": "飞行航段时长与航时汇总计算器",
  "lang": "zh-CN",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    { "src": "./assets/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "./assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

`sw.js` 使用版本化缓存 `xiaofeiniu-shell-v1`，安装时 `cache.addAll(APP_SHELL)`，激活时删除旧缓存，导航失败时回退 `./index.html`，其他同源 GET 资源使用缓存优先。

在 `index.html` 的 `<head>` 加入清单、主题色、Apple 图标，在页面脚本末尾加入：

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
```

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `node --test`

Expected: 所有测试通过，0 failures。

- [ ] **Step 5: 提交 PWA 基础代码**

```powershell
git add -- index.html flight-duration.js manifest.webmanifest sw.js tests
git commit -m "Add installable offline app shell"
```

### Task 2: 导出手机桌面图标

**Files:**
- Create: `scripts/build-icons.py`
- Create: `assets/icon-180.png`
- Create: `assets/icon-192.png`
- Create: `assets/icon-512.png`
- Create: `tests/icon-assets.test.js`

**Interfaces:**
- Consumes: `assets/xiaofeiniu-logo-source.jpg`。
- Produces: RGB/RGBA 正方形 PNG 图标，供 Manifest 与 Apple Touch Icon 使用。

- [ ] **Step 1: 写入失败测试**

`tests/icon-assets.test.js` 使用 PNG 文件头读取宽高并断言三个文件存在、尺寸分别为 180、192、512，且每个文件大于 5KB。

- [ ] **Step 2: 运行测试确认 RED**

Run: `node --test tests/icon-assets.test.js`

Expected: FAIL，提示 `assets/icon-180.png` 不存在。

- [ ] **Step 3: 编写并运行图标导出脚本**

`scripts/build-icons.py` 用 Pillow 将源图居中裁成正方形，缩放主体到约 88% 安全区，铺在纯黑 RGB 画布上，并分别保存 180、192、512 PNG。执行：

```powershell
& 'C:\Users\AW\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build-icons.py
```

- [ ] **Step 4: 验证图标尺寸与小尺寸辨识度**

Run: `node --test tests/icon-assets.test.js`

Expected: PASS。随后查看 `assets/icon-180.png`，确认牛角、外圈和时针未被边缘裁切。

- [ ] **Step 5: 提交图标**

```powershell
git add -- assets scripts/build-icons.py tests/icon-assets.test.js
git commit -m "Add Xiaofeiniu mobile app icons"
```

### Task 3: 本地在线与离线验收

**Files:**
- Modify: `tests/pwa-files.test.js`（仅在验收发现静态缺项时修改）

**Interfaces:**
- Consumes: Task 1 和 Task 2 的完整静态应用。
- Produces: 可发布的、经过在线和离线验证的应用版本。

- [ ] **Step 1: 启动本地 HTTP 服务并以 390×844 视口打开**

```powershell
& 'C:\Users\AW\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 8767 --bind 127.0.0.1
```

- [ ] **Step 2: 验证主要交互**

确认航段默认 `10:01 → 11:17 = 1 小时 16 分钟`；汇总默认 `1:00 + 1:00 = 2 小时 0 分钟`；两页签滚轮高亮可见；两个按钮均为“清空”；页面没有横向溢出。

- [ ] **Step 3: 验证离线重载**

首次在线打开并等待 Service Worker 激活，然后把浏览器网络切换为离线并重新加载。Expected: 页面仍显示、两个计算器仍可操作、Manifest 与三个图标均来自缓存。

- [ ] **Step 4: 运行完整自动测试**

Run: `node --test`

Expected: 0 failures。

### Task 4: 创建 GitHub 仓库并推送源码

**Files:**
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Consumes: 已通过 Task 3 验收的本地提交。
- Produces: 公开仓库 `https://github.com/y111zmkd/xiaofeiniu-timer`。

- [ ] **Step 1: 添加仓库说明与忽略规则**

README 写明用途、正式网址、离线安装方法和本地测试命令；`.gitignore` 排除 `.vercel/`、`.vercel-production-url.txt`、`.env*`、临时服务器日志和系统文件。

- [ ] **Step 2: 检查并提交发布说明**

```powershell
git status -sb
git add -- .gitignore README.md
git commit -m "Document Xiaofeiniu timer"
node --test
```

- [ ] **Step 3: 安装并认证 GitHub CLI（如仍缺失）**

Run: `winget install --id GitHub.cli --exact`

Then: `gh auth status`；如未登录，仅打开一次 `gh auth login --web` 让用户完成浏览器授权，禁止保存验证码或令牌到仓库。

- [ ] **Step 4: 创建公开仓库并推送**

```powershell
git branch -M main
gh repo create y111zmkd/xiaofeiniu-timer --public --source . --remote origin --push
```

Expected: `origin` 指向 `https://github.com/y111zmkd/xiaofeiniu-timer.git`，远端 `main` 包含全部源码。

- [ ] **Step 5: 只读验证 GitHub**

Run: `gh repo view y111zmkd/xiaofeiniu-timer --json nameWithOwner,isPrivate,url,defaultBranchRef`

Expected: `isPrivate=false`、默认分支 `main`。

### Task 5: 部署 Vercel 正式站点

**Files:**
- Create: `vercel.json`
- Ignore: `.vercel/`

**Interfaces:**
- Consumes: GitHub `main` 分支静态文件。
- Produces: Vercel 项目 `xiaofeiniu-timer` 的稳定生产 HTTPS URL。

- [ ] **Step 1: 添加静态部署配置**

`vercel.json`：

```json
{
  "cleanUrls": true,
  "headers": [
    {
      "source": "/sw.js",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    },
    {
      "source": "/manifest.webmanifest",
      "headers": [{ "key": "Content-Type", "value": "application/manifest+json" }]
    }
  ]
}
```

- [ ] **Step 2: 测试、提交并推送部署配置**

```powershell
node --test
git add -- vercel.json .gitignore
git commit -m "Configure Vercel static hosting"
git push origin main
```

- [ ] **Step 3: 安装并认证 Vercel CLI**

Run: `npx vercel@latest login`；如需要，仅让用户在一个浏览器页面完成 GitHub OAuth。禁止把 `.vercel/project.json` 中的本地标识或任何令牌提交到仓库。

- [ ] **Step 4: 创建并部署生产项目**

先运行 `npx vercel@latest project add xiaofeiniu-timer`，再运行 `npx vercel@latest link --yes --project xiaofeiniu-timer`。生产部署时保存 CLI 返回的正式地址：

```powershell
$productionUrl = (npx vercel@latest deploy --prod --yes | Select-Object -Last 1).Trim()
Set-Content -LiteralPath '.vercel-production-url.txt' -Value $productionUrl
```

Expected: 部署状态 READY，并返回生产 HTTPS URL。

- [ ] **Step 5: 验证线上资源和交互**

对生产 URL、`/manifest.webmanifest`、`/sw.js`、三个图标逐一检查 HTTP 200；使用 390×844 视口复测两个计算器、无横向溢出以及在线后离线重载。

### Task 6: 生成并验证分享二维码

**Files:**
- Create: `scripts/build-qr.py`
- Create: `小飞牛计时-分享二维码.png`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 5 返回的稳定 Vercel 生产 URL。
- Produces: 可直接发送给他人扫码的 PNG，以及 README 中的正式网址。

- [ ] **Step 1: 安装本地二维码生成依赖**

```powershell
& 'C:\Users\AW\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pip install qrcode
```

- [ ] **Step 2: 编写二维码生成脚本**

`scripts/build-qr.py` 接收一个 HTTPS URL，使用 `qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=12, border=4)` 生成黑白 PNG，并把 URL 写入 PNG 元数据 `URL` 字段。

- [ ] **Step 3: 生成二维码并验证解码结果**

```powershell
$productionUrl = (Get-Content -LiteralPath '.vercel-production-url.txt' -Raw).Trim()
& 'C:\Users\AW\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build-qr.py $productionUrl '小飞牛计时-分享二维码.png'
```

用二维码识别工具确认解码内容与 Vercel 生产 URL 完全一致，不包含预览部署域名或查询参数。

- [ ] **Step 4: 更新 README、测试、提交并推送**

```powershell
node --test
git add -- README.md scripts/build-qr.py '小飞牛计时-分享二维码.png'
git commit -m "Add production sharing QR code"
git push origin main
```

- [ ] **Step 5: 最终验收**

扫描二维码打开正式站点；检查 Logo、桌面名称、iPhone/安卓安装提示入口；首次在线加载后断网重开；确认 GitHub 仓库公开且 Vercel 生产部署 READY。
