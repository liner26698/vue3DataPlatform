# 🚀 快速参考指南

**项目**: Vue3 数据平台  
**版本**: 1.0 (规范化后)  
**最后更新**: 2025-11-27

---

## 📋 快速导航

### 📁 项目结构一览

```
项目根目录: /Users/xulin/自己的gitHub和项目/liner26698/vue3DataPlatform

配置文件位置:      项目根目录 (ecosystem.config.js, package.json, tsconfig.json 等)
后端代码位置:      ./server/
前端代码位置:      ./src/
脚本位置:          ./scripts/

生产服务器:        47.110.66.121:3001
服务器项目路径:    /home/dataPlatform
PM2 配置文件:      /home/dataPlatform/ecosystem.config.js
Koa 启动文件:      /home/dataPlatform/server/koaapp-production.js
```

---

## 🔑 关键文件速查

### 后端配置和启动

| 文件                   | 位置       | 作用             |
| ---------------------- | ---------- | ---------------- |
| `ecosystem.config.js`  | 项目根目录 | PM2 进程配置     |
| `koaapp-production.js` | `server/`  | 生产环境启动文件 |
| `config.js`            | `server/`  | 后端配置         |
| `db.js`                | `server/`  | 数据库连接       |

### 路由和 API

| 文件                | 位置             | 作用          |
| ------------------- | ---------------- | ------------- |
| `routes/index.js`   | `server/routes/` | 所有 API 路由 |
| `routes/bookApi.js` | `server/routes/` | 图书 API      |

### 爬虫和定时任务

| 文件                       | 位置             | 作用         |
| -------------------------- | ---------------- | ------------ |
| `scheduleCrawler.js`       | `server/`        | 定时爬虫入口 |
| `utils/cronScheduler.js`   | `server/utils/`  | 定时任务调度 |
| `utils/hotTopicsSpider.js` | `server/utils/`  | 热门话题爬虫 |
| `config/crawlerConfig.js`  | `server/config/` | 爬虫配置     |

### 工具函数

| 文件              | 位置            | 作用               |
| ----------------- | --------------- | ------------------ |
| `utils/common.js` | `server/utils/` | 菜单配置和通用工具 |

---

## 🌐 常用 API 端点

```
POST http://47.110.66.121/statistics/getHotTopics
  -> 获取所有平台的热门话题

POST http://47.110.66.121/statistics/getHotTopicsByPlatform
  -> 获取指定平台的热门话题 (需要 platform 参数)

GET  http://47.110.66.121/menu/getMenuList
  -> 获取菜单列表

POST http://47.110.66.121/login
  -> 用户登录
```

---

## 🔧 常用命令

### 本地操作

#### 启动开发服务器

```bash
npm run dev
```

#### 构建前端

```bash
npm run build
```

#### Git 提交

```bash
git add .
git commit -m "描述你的改动"
git push origin main
```

### 生产环境操作

#### SSH 登录

```bash
ssh -p 443 root@47.110.66.121
```

#### 查看 PM2 进程

```bash
pm2 list
pm2 logs
pm2 monit
```

#### 重启 Koa 服务器

```bash
pm2 restart koa-server
```

#### 重启爬虫定时任务

```bash
pm2 restart scheduler
```

#### 重启所有进程

```bash
pm2 restart all
```

#### 查看 Koa 日志

```bash
tail -f /root/.pm2/logs/koa-server-out.log
tail -f /root/.pm2/logs/koa-server-error.log
```

#### 查看爬虫日志

```bash
tail -f /root/.pm2/logs/scheduler-out.log
tail -f /root/.pm2/logs/scheduler-error.log
```

#### 验证热门话题爬虫是否运行

```bash
curl -X POST http://47.110.66.121/statistics/getHotTopics \
  -H 'Content-Type: application/json'
```

---

## 📊 定时任务时间表

### 热门话题爬虫 (cronScheduler.js)

```
每天 00:00  -> runAllSpiders() 爬取所有平台热门话题
每天 12:00  -> runAllSpiders() 爬取所有平台热门话题
每天 18:00  -> runAllSpiders() 爬取所有平台热门话题
每天 03:00  -> runGameSpiders() 爬取游戏数据
```

### 修改时间表的步骤

1. 编辑 `server/utils/cronScheduler.js`
2. 修改对应的 cron 表达式
3. 提交到 Git 并推送
4. SSH 登录生产环境执行：
   ```bash
   cd /home/dataPlatform && git pull origin main
   pm2 restart scheduler
   ```

---

## 🐛 常见问题速解

### 问题 1: API 返回 500 错误

```bash
# 检查 Koa 错误日志
tail -50 /root/.pm2/logs/koa-server-error.log

# 重启 Koa 服务器
pm2 restart koa-server

# 如果问题持续，检查数据库连接
ps aux | grep node
```

### 问题 2: 热门话题没有更新

```bash
# 检查定时任务日志
tail -100 /root/.pm2/logs/scheduler-out.log
tail -50 /root/.pm2/logs/scheduler-error.log

# 检查 PM2 进程状态
pm2 status scheduler

# 重启爬虫
pm2 restart scheduler
```

### 问题 3: 文件上传后更改没有生效

```bash
# 这通常是因为 Node.js 模块缓存问题
# 完全杀死并重启 PM2：
pkill -9 node
pm2 start /home/dataPlatform/ecosystem.config.js --interpreter /root/.nvm/versions/node/v21.7.3/bin/node
```

### 问题 4: 模块找不到错误

```bash
# 检查相对路径是否正确
# koaapp-production.js 应该使用:
require("./routes")        ✅
require("./utils/common")  ✅

# 而不是:
require("./server/routes")  ❌
require("./server/utils/common")  ❌
```

---

## 📚 重要文档

| 文档                      | 描述                   |
| ------------------------- | ---------------------- |
| `DIRECTORY_STRUCTURE.md`  | 项目目录结构规范和说明 |
| `NORMALIZATION_REPORT.md` | 规范化改动的详细报告   |
| `QUICKSTART.md`           | 项目快速启动指南       |
| `README.md`               | 项目主文档             |

---

## 🎯 部署流程检查表

### 本地完成

- [ ] 代码修改完成
- [ ] 本地测试通过
- [ ] `git commit` 并附加清晰的说明
- [ ] `git push origin main`

### 生产部署

- [ ] SSH 登录生产服务器
- [ ] `cd /home/dataPlatform && git pull origin main`
- [ ] 检查 `ecosystem.config.js` 中的路径是否正确
- [ ] `pm2 restart all` 重启所有进程
- [ ] 验证 PM2 进程状态：`pm2 list`
- [ ] 测试 API：`curl -X POST http://47.110.66.121/statistics/getHotTopics`
- [ ] 检查日志：`tail -f /root/.pm2/logs/koa-server-out.log`

---

## 💡 最佳实践

### ✅ 推荐做法

1. 所有配置文件保存在项目根目录
2. require 语句使用相对于当前文件的相对路径
3. 在生产环境部署前，总是在本地测试
4. 修改定时任务后，记得重启 scheduler 进程
5. 定期检查日志，及时发现问题

### ❌ 避免做法

1. 在 server/ 文件夹中复制配置文件
2. 使用错误的相对路径（多层级访问）
3. 直接修改生产环境的文件（始终通过 Git 同步）
4. 忘记重启 PM2 进程（修改配置后）
5. 长期不清理日志文件（定期清理 /root/.pm2/logs/）

---

## 📞 快速故障排查流程

1. **问题现象**

   - API 返回错误?
   - 数据没有更新?
   - 进程崩溃?

2. **检查日志**

   ```bash
   tail -50 /root/.pm2/logs/*-error.log
   ```

3. **检查 PM2 状态**

   ```bash
   pm2 list
   pm2 status
   ```

4. **重启对应进程**

   ```bash
   pm2 restart <process-name>
   ```

5. **验证修复**

   ```bash
   # 测试 API 或重新检查日志
   curl http://47.110.66.121/...
   ```

6. **如果问题持续**
   - 检查是否有文件路径问题
   - 是否需要清除 Node.js 模块缓存
   - 联系开发者进行深入诊断

---

**最后更新**: 2025-11-27  
**维护者**: Copilot AI Assistant  
**项目状态**: ✅ 规范化完成，生产环境运行正常
