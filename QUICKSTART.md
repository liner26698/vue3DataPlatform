# 🚀 快速启动指南

## 本地开发环境快速启动

### 前置要求

```bash
✅ Node.js 21.7.3+
✅ MySQL 8.0+
✅ npm 或 yarn
✅ Git
```

### Step 1: 克隆项目

```bash
git clone https://github.com/liner26698/vue3DataPlatform.git
cd vue3DataPlatform
```

### Step 2: 安装依赖

```bash
# 主应用依赖
npm install

# 爬虫服务依赖
cd spider-service
npm install
cd ..
```

### Step 3: 配置环境

#### 配置主应用

在根目录创建 `.env` 或修改 `server/config.js`:

```javascript
// server/config.js
module.exports = {
  mysql: {
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'data_platform',
    port: 3306
  }
};
```

#### 配置爬虫服务

编辑 `spider-service/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=data_platform
DB_PORT=3306
```

### Step 4: 启动服务

#### 方案 A: 两个终端 (推荐开发使用)

**终端 1 - 启动 API 服务:**

```bash
npm run dev:backend
```

输出示例:
```
✅ 主应用启动成功，端口: 3001
📝 爬虫服务已分离为独立微服务
   位置: ../spider-service
   启动命令: cd ../spider-service && npm start
```

**终端 2 - 启动爬虫服务:**

```bash
cd spider-service
npm start
```

输出示例:
```
🚀 独立爬虫微服务启动
✅ 已注册任务: 热门话题爬虫 - 每天凌晨
✅ 已注册任务: 热门话题爬虫 - 每天中午
✅ 已注册任务: 热门话题爬虫 - 每天傍晚
✅ 爬虫定时任务已启动
```

#### 方案 B: 单个终端 (快速测试)

只启动 API 服务 (爬虫任务不执行):

```bash
npm run dev:backend
```

## 📱 访问应用

### API 端点

```bash
# 获取热榜数据
curl http://localhost:3001/statistics/getHotTopics

# 返回示例:
{
  "code": 0,
  "data": {
    "baidu": [
      {
        "id": 1,
        "platform": "baidu",
        "rank": 1,
        "title": "热搜标题",
        "url": "https://www.baidu.com/s?wd=...",
        "heat": 1000000
      }
    ],
    "weibo": [...],
    "bilibili": [...]
  }
}
```

### 前端应用

```
http://localhost:5173  (Vite 开发服务器)
或
http://localhost:3001  (生产构建)
```

## 🔍 验证部署

### 检查 API 服务

```bash
# 检查 API 是否响应
curl http://localhost:3001/statistics/getHotTopics | jq .

# 检查进程
ps aux | grep "node koaapp.js"

# 查看日志 (如果使用 PM2)
pm2 logs api
```

### 检查爬虫服务

```bash
# 检查进程
ps aux | grep "spider-service"

# 查看日志 (如果使用 PM2)
pm2 logs spider

# 查看本地日志
tail -f spider-service/logs/spider.log
```

### 检查数据库

```bash
mysql -u root -p
use data_platform;
SELECT platform, COUNT(*) FROM hot_topics GROUP BY platform;

# 输出示例:
# | platform  | COUNT(*) |
# | baidu     |       31 |
# | weibo     |       29 |
# | bilibili  |       92 |
```

## 🛠️ 常见问题

### Q1: 爬虫服务无法启动

**错误信息:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**解决方案:**
```bash
# 1. 检查 MySQL 是否运行
mysql -u root -p

# 2. 检查 .env 配置
cat spider-service/.env

# 3. 确保数据库已创建
mysql> CREATE DATABASE data_platform;
```

### Q2: API 端口被占用

**错误信息:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决方案:**
```bash
# 1. 杀死占用端口的进程
lsof -i :3001
kill -9 <PID>

# 2. 或修改端口
# 编辑 koaapp.js, 改变 port 值
```

### Q3: Puppeteer 下载失败

**错误信息:**
```
Error: TimeoutError: Timeout waiting for event "browserclose"
```

**解决方案:**
```bash
# 1. 检查网络连接
ping github.com

# 2. 手动下载 Chromium
npm install --save puppeteer --unsafe-perm=true

# 3. 或设置代理
npm config set registry https://registry.npmmirror.com
```

### Q4: 前端无法获取数据

**错误信息:**
```
CORS error or 404 Not Found
```

**解决方案:**
```bash
# 1. 确保 API 服务运行
ps aux | grep "koaapp.js"

# 2. 检查前端配置中的 API 地址
# src/api/config/config.ts

# 3. 检查跨域配置
# koaapp.js 中的 cors 中间件
```

## 📊 性能指标

启动后应该看到:

| 指标 | 预期值 | 实际值 |
|-----|--------|--------|
| API 启动时间 | <1 秒 | ⏱️ |
| 爬虫启动时间 | 5-10 秒 | ⏱️ |
| API 响应时间 | <100ms | ⏱️ |
| 数据库连接 | 成功 | ✅ |

## 📚 更多文档

- [微服务部署指南](./MICROSERVICES_DEPLOYMENT.md)
- [爬虫服务详情](./spider-service/README.md)
- [项目完成报告](./PROJECT_COMPLETION_REPORT.md)
- [迁移指南](./SPIDER_MIGRATION.md)

## 💡 开发提示

### 本地开发流程

```bash
# 1. 启动两个服务
# 终端 1
npm run dev:backend

# 终端 2
cd spider-service && npm start

# 2. 修改代码
# nodemon 会自动重启服务

# 3. 测试 API
curl http://localhost:3001/statistics/getHotTopics

# 4. 查看日志
# 两个终端都会显示日志输出
```

### 生产部署流程

```bash
# 1. 构建项目
npm run build

# 2. 使用 PM2 启动
pm2 start npm --name="api" -- start
cd spider-service && pm2 start npm --name="spider" -- start

# 3. 监控
pm2 monit

# 4. 查看日志
pm2 logs
```

## 🎯 下一步

成功启动后，你可以:

- ✅ 访问前端应用查看热榜数据
- ✅ 调试爬虫任务执行
- ✅ 修改爬虫平台和策略
- ✅ 部署到生产环境

## 📞 获取帮助

遇到问题? 查看:

1. [常见问题解答](#-常见问题)
2. [爬虫服务文档](./spider-service/README.md)
3. [部署指南](./MICROSERVICES_DEPLOYMENT.md)
4. [完成报告](./PROJECT_COMPLETION_REPORT.md)

---

**准备好了? 开始吧! 🚀**

```bash
npm run dev:backend &
cd spider-service && npm start
```
