# 登录状态缓存修复

## 问题描述

重启项目后，路由跳转到 `/login` 页面，需要重新输入账号和密码，即使之前已登录过。

## 根本原因

1. **pinia-plugin-persist 的时序问题**：

   - Pinia 初始化时 state 为空 (`token=""`)
   - piniaPersist 插件在状态被访问时才从 localStorage 加载数据
   - 路由守卫 `beforeEach` 在初始化后立即执行，可能在 persist 加载前就检查了 token

2. **状态恢复顺序不正确**：
   - 路由导航 → 路由守卫 (beforeEach) → localStorage 恢复
   - 导致守卫检查 token 时还未恢复

## 解决方案

在 `/src/routers/index.ts` 中添加显式的初始化函数 `initializeStore()`：

```typescript
// 在路由守卫首次执行前，主动从 localStorage 恢复 pinia state
function initializeStore() {
	// 读取 GlobalState (包含 token 和用户信息)
	const globalStateJson = localStorage.getItem("GlobalState");
	if (globalStateJson) {
		// 恢复到 globalStore
		globalStore.setToken(globalState.token);
		// ... 其他字段
	}

	// 读取 AuthState (包含权限信息)
	const authStateJson = localStorage.getItem("AuthState");
	if (authStateJson) {
		// 恢复到 authStore
		authStore.setAuthRouter(authState.authRouter);
		// ... 其他字段
	}
}

// 在第一次路由导航时调用初始化
router.beforeEach((to, from, next) => {
	if (!initialized) {
		initializeStore();
		initialized = true;
	}
	// ... 继续路由守卫逻辑
});
```

## 修改文件

- **文件**：`src/routers/index.ts`
- **更改**：添加 `initializeStore()` 函数和初始化检查
- **影响范围**：无破坏性变更，仅在路由守卫首次执行时多做一次操作

## 验证方法

1. **首次登录**：

   ```bash
   npm run dev
   # 输入账号和密码，成功登录进入主页
   ```

2. **刷新页面**：

   ```
   F5 或 Ctrl+R
   # 页面应该保持登录状态，不会跳转到 /login
   ```

3. **关闭浏览器再打开**：

   ```
   1. 关闭浏览器窗口
   2. 重新打开浏览器访问项目
   # 页面应该保持登录状态
   ```

4. **检查浏览器开发者工具**：
   ```
   右键 → 检查 → Application → Local Storage
   # 应该能看到 GlobalState 和 AuthState 的数据
   ```

## 工作流程

```
应用启动
  ↓
路由导航开始
  ↓
beforeEach 路由守卫执行 (首次)
  ↓
initializeStore() 执行
  ↓
从 localStorage 读取 GlobalState
  ↓
调用 globalStore.setToken() 恢复 token
  ↓
调用 globalStore.setUserInfo() 恢复用户信息
  ↓
调用 authStore.setAuthRouter() 恢复权限
  ↓
afterwards: globalStore.token 已有值
  ↓
通过权限检查，进入主页 ✅
```

## 性能影响

- ✅ 仅在应用首次加载时执行一次
- ✅ 从 localStorage 读取（毫秒级快速）
- ✅ 无网络请求
- ✅ 无明显性能开销

## 向后兼容性

- ✅ 无破坏性变更
- ✅ 第一次使用的新用户不受影响（localStorage 为空）
- ✅ 已有数据的用户自动恢复

## 注意事项

1. **手动清空 localStorage**：

   - 如果想重新登录，可以在浏览器开发者工具中删除 `GlobalState` 和 `AuthState`
   - 或者使用浏览器隐私模式（无痕浏览）启动

2. **多标签页同步**：

   - localStorage 在同一域名下所有标签页共享
   - 一个标签页登出，其他标签页也会自动清除

3. **不同浏览器隔离**：
   - Firefox、Chrome、Safari 各自维护独立的 localStorage
   - 在不同浏览器中需要分别登录

---

**更新时间**：2025-11-26  
**修复版本**：v1.1
