# 小飞牛计时离线优先与桌面图标修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 首次联网准备完成后，让 iPhone 和安卓从主屏幕优先读取本地应用，并稳定显示银色牛头时针 Logo。

**Architecture:** Service Worker v4 将首页导航改成缓存优先、后台更新，并通过消息通知页面完整离线壳已准备完成。图标使用新文件名打破 iOS 的旧图标缓存；页面只有在首页、Manifest 和三张图标均已缓存后才显示“已可离线使用”。

**Tech Stack:** 静态 HTML/CSS/JavaScript、Service Worker、Web App Manifest、Node.js `node:test`、GitHub Pages Actions。

## Global Constraints

- 正式网址保持 `https://y111zmkd.github.io/xiaofeiniu-timer/`。
- Manifest、Service Worker 与图标路径必须兼容 `/xiaofeiniu-timer/` 子目录。
- 不修改计算规则、滚轮、页签、二维码和现有主界面结构。
- 首次安装必须联网；缓存成功后支持 iPhone 和安卓离线启动。

---

### Task 1: Service Worker 离线优先启动

**Files:**
- Modify: `tests/pwa-files.test.js`
- Modify: `sw.js`

**Interfaces:**
- Produces: `CACHE_NAME = 'xiaofeiniu-shell-v4'`、`isOfflineReady()`、`notifyOfflineReady()`。
- Consumes: `HOME_URL` 与 `APP_SHELL` 中的相对站点资源。

- [ ] **Step 1: 写失败测试**

在 `tests/pwa-files.test.js` 断言缓存版本为 v4；导航先执行 `caches.match(HOME_URL)`，命中后立即返回，并通过 `event.waitUntil(updateHomeCache(...))` 后台更新；断言存在 `OFFLINE_READY` 消息和完整资源检查。

- [ ] **Step 2: 验证测试失败**

运行：`node --test tests/pwa-files.test.js`

预期：因当前仍为 v3、导航为网络优先而失败。

- [ ] **Step 3: 实现最小修复**

在 `sw.js` 中实现：

```js
const CACHE_NAME = 'xiaofeiniu-shell-v4';

async function updateHomeCache(request) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(HOME_URL, response.clone());
  }
  return response;
}

// navigate: cached first; network only when uncached; cached launches update in background
const cached = await caches.match(HOME_URL);
if (cached) {
  event.waitUntil(updateHomeCache(event.request).catch(() => undefined));
  return cached;
}
return updateHomeCache(event.request);
```

安装阶段逐项缓存并有限重试。激活、运行时补齐资源或收到 `CHECK_OFFLINE_READY` 时，仅在全部资源命中缓存后发送 `{ type: 'OFFLINE_READY' }`。

- [ ] **Step 4: 验证测试通过**

运行：`node --test tests/pwa-files.test.js`

预期：全部通过。

### Task 2: 强制刷新桌面 Logo 并显示离线就绪状态

**Files:**
- Create: `assets/icon-180-v4.png`
- Create: `assets/icon-192-v4.png`
- Create: `assets/icon-512-v4.png`
- Modify: `tests/icon-assets.test.js`
- Modify: `tests/standalone-page.test.js`
- Modify: `manifest.webmanifest`
- Modify: `index.html`

**Interfaces:**
- Consumes: Service Worker 消息 `OFFLINE_READY` 与请求 `CHECK_OFFLINE_READY`。
- Produces: 页面状态元素 `#offline-status`，文字固定为“已可离线使用”。

- [ ] **Step 1: 写失败测试**

断言 Manifest 使用 `icon-192-v4.png`、`icon-512-v4.png`；HTML 的 `apple-touch-icon` 使用 `icon-180-v4.png`；三个新 PNG 尺寸正确；HTML 注册消息监听并向激活的 Service Worker 发送 `CHECK_OFFLINE_READY`；成功消息显示 `#offline-status`。

- [ ] **Step 2: 验证测试失败**

运行：`node --test tests/icon-assets.test.js tests/standalone-page.test.js tests/pwa-files.test.js`

预期：因版本化图标和离线状态元素不存在而失败。

- [ ] **Step 3: 实现最小修复**

复制现有三个已确认 Logo PNG 到版本化文件名，更新 Manifest、苹果触摸图标和 Service Worker 预缓存列表。页面先监听消息，再注册 Service Worker：

```js
const offlineStatus = document.querySelector('#offline-status');
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data?.type === 'OFFLINE_READY') offlineStatus.hidden = false;
});
const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });
const readyRegistration = await navigator.serviceWorker.ready;
readyRegistration.active?.postMessage({ type: 'CHECK_OFFLINE_READY' });
```

状态元素使用 `role="status"` 和 `aria-live="polite"`，不弹窗、不阻挡计算操作。

- [ ] **Step 4: 验证测试通过**

运行：`node --test tests/icon-assets.test.js tests/standalone-page.test.js tests/pwa-files.test.js`

预期：全部通过。

### Task 3: 发布与线上验证

**Files:**
- Modify: `README.md`
- Verify: `.github/workflows/pages.yml`

**Interfaces:**
- Produces: GitHub Pages v4 离线应用。

- [ ] **Step 1: 更新安装说明并测试**

README 明确要求：用可访问站点的网络首次打开；等待“已可离线使用”；删除旧桌面入口并重新添加；以后联网打开一次、完全关闭、再次打开即可更新。

运行：`node --test tests/*.test.js`。

预期：全部通过。

- [ ] **Step 2: 执行语法与差异验证**

运行：`node --check sw.js`、解析 `index.html` 内联脚本、`git diff --check`。

预期：均为成功且无错误。

- [ ] **Step 3: 提交并推送**

提交生产文件、测试、版本化图标、README 与本计划，推送 `main` 触发 GitHub Pages。

- [ ] **Step 4: 验证线上资源**

确认首页、Manifest、Service Worker 与 `icon-180-v4.png`、`icon-192-v4.png`、`icon-512-v4.png` 均返回 200；线上 Service Worker 包含 `xiaofeiniu-shell-v4` 和缓存优先导航逻辑。

- [ ] **Step 5: 手机验收说明**

用户删除旧桌面入口，用手机流量打开正式网址，等待“已可离线使用”后重新添加。完全关闭应用，分别在飞行模式和无法访问 GitHub Pages 的 Wi‑Fi 下从桌面图标重开。

