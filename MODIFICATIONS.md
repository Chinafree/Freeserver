# Freeserver 项目修改文档

## 概述

本文档记录了相较于 upstream 项目 (`https://github.com/XCQ0607/lxserver.git`) 所做的所有功能修改和修复。

---

## 一、自定义源管理功能

### 1.1 公开源上传逻辑修复

**问题**：管理员上传的源无条件放到公共区，未考虑公开源开关状态

**修复**：修改 `public/music/app.js` 中的 `uploadCustomSource` 函数

```javascript
// 修复后逻辑
const isAdmin = !!adminPass;
const isPublicEnabled = settings.enablePublicSources !== false;
const targetUsername = (isAdmin && isPublicEnabled) ? 'open' : (currentListData?.username || 'default');
```

**文件**：`public/music/app.js`

---

### 1.2 公开源可见性控制

**问题**：普通用户也能看到公开源

**修复**：修改 `renderCustomSources` 函数，添加管理员权限检查

```javascript
// 仅管理员能看到公开源
if (list && !isAdmin) {
    list = list.filter(item => item.owner !== 'open');
}
```

**文件**：`public/music/app.js`

---

### 1.3 公开源默认启用状态

**问题**：新上传的源默认禁用，导致无法调用

**修复**：修改服务器端 `src/server/customSourceHandlers.ts`，将默认启用状态改为 `true`

**文件**：`src/server/customSourceHandlers.ts`

---

## 二、系统错误修复

### 2.1 Pitch Shifter 初始化错误

**错误信息**：`[SoundEffects] Failed to initialize pitch shifter: TypeError: Cannot read properties of undefined (reading 'addModule')`

**原因**：`audioContext.audioWorklet` 未初始化或不存在

**修复**：在 `public/music/js/sound-effects.js` 中添加存在性检查

**文件**：`public/music/js/sound-effects.js`

---

### 2.2 Client not Init 错误

**错误信息**：`Push Failed Error: Client not Init`

**原因**：调用 `sync.push` 时，同步客户端未初始化

**修复**：
1. 在 `public/music/login.html` 中保存同步配置（用户名、密码、同步模式）
2. 在 `public/music/app.js` 的 `pushDataChange` 函数中添加 fallback 逻辑

**文件**：`public/music/login.html`, `public/music/app.js`

---

## 三、数据同步功能修复

### 3.1 登录页面同步配置

**问题**：登录页面未保存同步所需的关键信息

**修复**：在登录成功后保存：
- `lx_sync_user` - 用户名
- `lx_sync_pass` - 密码  
- `lx_sync_mode` - 同步模式（设置为 'local'）

**文件**：`public/music/login.html`

---

### 3.2 服务器端认证逻辑

**问题**：服务器端用户名密码认证逻辑被注释，导致本地模式无法认证

**修复**：取消 `src/server/server.ts` 中 `verifyUserAuth` 函数的注释

**文件**：`src/server/server.ts`

---

### 3.3 单首歌曲收藏同步

**问题**：单首歌曲收藏只调用 `pushDataChange()`，在本地模式下无法同步

**修复**：修改 `handleTogglePlaylist` 函数，添加本地模式的 API 调用

**文件**：`public/music/app.js`

---

### 3.4 pushDataChange Fallback 逻辑

**问题**：`pushDataChange()` 在 `SyncManager.client` 不存在时直接返回，导致数据无法同步

**修复**：添加本地模式 fallback，直接调用 `/api/user/list` API

```javascript
async function pushDataChange() {
    if (!currentListData) return;
    
    const hasValidSyncManager = window.SyncManager && window.SyncManager.client;
    
    if (hasValidSyncManager) {
        await window.SyncManager.push(currentListData);
    } else {
        // 本地模式 fallback
        await fetch('/api/user/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getUserAuthHeaders() },
            body: JSON.stringify(currentListData)
        });
    }
}
```

**文件**：`public/music/app.js`

---

## 四、静态资源优化

### 4.1 CDN 替换与 SRI

**修改内容**：将静态资源（FontAwesome、Tailwind CSS 等）替换为 CDN 引用，并添加 Subresource Integrity (SRI) 和回退机制

**文件**：
- `public/music/index.html`
- `public/music/login.html`
- `public/index.html`（管理控制台）

**CDN 方案**：使用 jsDelivr + GitHub 方案解决国内访问问题

---

## 五、页面导航优化

### 5.1 管理控制台播放器导航按钮

**修改内容**：在根路径管理控制台登录页面上方添加醒目的播放器页面导航按钮

**文件**：
- `public/index.html` - 添加按钮 HTML
- `public/style.css` - 添加按钮样式（绿色渐变背景、脉冲动画）

---

## 六、Subsonic 协议支持

### 6.1 搜索接口

**现状**：Subsonic 搜索接口只能搜索用户已保存的歌单（收藏列表、默认列表、自定义歌单），不支持实时搜索在线音乐库

**文件**：`src/server/subsonic.ts`

---

## 七、注意事项

### 7.1 数据同步

1. **登录后自动同步**：登录成功后会自动从服务器加载用户数据
2. **操作即时同步**：收藏、创建歌单等操作会立即同步到服务器
3. **刷新数据恢复**：页面刷新后会自动重新登录并加载数据
4. **认证信息保存**：用户名和密码保存在 localStorage 中，便于自动登录

### 7.2 管理员权限

1. **公开源管理**：只有管理员能看到和管理公开源
2. **上传位置**：管理员上传源时，根据「启用公开源」开关决定上传位置
3. **认证方式**：管理员通过单独的密码验证获得管理员权限

### 7.3 CDN 资源

1. **回退机制**：CDN 资源加载失败时会自动回退到本地资源
2. **SRI 验证**：添加了 Subresource Integrity 验证，确保资源完整性
3. **国内访问**：使用 jsDelivr + GitHub 方案优化国内访问速度

### 7.4 安全注意事项

1. **密码存储**：用户密码以明文形式存储在 localStorage 中，注意清理浏览器缓存
2. **Token 有效期**：Session Token 有有效期限制，过期后需要重新登录
3. **HTTPS 建议**：建议配置 HTTPS，特别是在生产环境中

### 7.5 部署注意事项

1. **Docker 构建**：每次修改需要重新构建 Docker 镜像
2. **缓存清理**：部署后用户可能需要强制刷新页面 (`Ctrl+Shift+R`)
3. **日志查看**：可以通过 Docker 日志查看服务器运行状态和错误信息

---

## 八、待改进项

1. **PWA 安装按钮**：需要 HTTPS 环境才能显示（当前使用 HTTP）
2. **Subsonic 实时搜索**：目前只能搜索用户已保存的歌曲
3. **密码加密存储**：考虑对 localStorage 中的密码进行加密存储
4. **批量操作优化**：批量收藏/删除操作的性能优化

---

## 九、修改文件清单

| 文件路径 | 修改类型 | 说明 |
|---------|---------|------|
| `public/music/app.js` | 修改 | 自定义源上传逻辑、收藏同步逻辑、pushDataChange fallback |
| `public/music/login.html` | 修改 | 保存同步配置（用户名、密码、同步模式） |
| `public/music/js/sound-effects.js` | 修改 | 添加 audioWorklet 存在性检查 |
| `public/music/js/user_sync.js` | 修改 | SyncManager 相关逻辑 |
| `public/music/index.html` | 修改 | CDN 资源替换、SRI、回退机制 |
| `public/index.html` | 修改 | 添加播放器导航按钮 |
| `public/style.css` | 修改 | 播放器导航按钮样式 |
| `src/server/server.ts` | 修改 | 恢复用户名密码认证逻辑 |
| `src/server/customSourceHandlers.ts` | 修改 | 公开源默认启用状态 |
| `src/server/subsonic.ts` | 查看 | Subsonic 协议实现 |

---

**文档生成时间**：2026年6月16日