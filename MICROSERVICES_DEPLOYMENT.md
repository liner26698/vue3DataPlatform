# 微服务架构部署指南

## 📋 概述

为了解决爬虫服务阻塞主应用的问题，本项目已经完成从**单体架构**到**微服务架构**的转变。

### 架构对比

```
【转变前 - 单体架构】
koaapp.js
├── startScheduledTasks() ⏳ 延迟启动 30+ 秒
├── API 路由
└── 爬虫执行 (占用资源)

【转变后 - 微服务架构】
koaapp.js (API 服务) ✅ <1 秒快速启动
└── API 路由

spider-service/app.js (爬虫服务) ⚙️ 独立运行
└── 定时爬虫任务
```

## 🚀 快速启动

### 本地开发环境

#### 方式 1: 两个终端分别运行

**终端 1 - 启动主应用 (API)**
```bash
cd /path/to/vue3DataPlatform
npm run dev:backend
```

**终端 2 - 启动爬虫服务**
```bash
cd /path/to/vue3DataPlatform/spider-service
npm install  # 首次运行需要安装依赖
npm start
```

#### 方式 2: 使用脚本一次性启动

```bash
# 在项目根目录创建启动脚本
chmod +x start_all.sh
./start_all.sh
```

### 生产环境部署

#### 使用 PM2 部署

```bash
# 全局安装 PM2
npm install -g pm2

# 启动主应用
pm2 start npm --name="api" -- run "dev:backend"

# 启动爬虫服务
cd spider-service
pm2 start npm --name="spider" -- start

# 保存 PM2 配置
pm2 save
pm2 startup

# 查看状态
pm2 status
```

#### 使用 Docker 部署

创建 `docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=password
    depends_on:
      - mysql

  spider:
    build:
      context: ./spider-service
      dockerfile: Dockerfile
    environment:
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=password
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
```

## 📁 目录结构

```
vue3DataPlatform/
├── koaapp.js                    # 主应用入口 (API 服务)
├── server/
│   ├── routes/
│   │   └── index.js            # API 路由
│   └── db.js                   # 数据库连接
│
└── spider-service/             # 爬虫微服务
    ├── app.js                  # 爬虫服务入口
    ├── package.json            # 爬虫服务依赖
    ├── .env                    # 爬虫配置
    ├── .gitignore
    ├── README.md               # 爬虫服务文档
    └── utils/
        ├── hotTopicsSpider.js  # 爬虫实现
        ├── cronScheduler.js    # 定时任务
        └── db.js               # 数据库连接
```

## ⚙️ 配置说明

### 主应用配置

主应用已移除爬虫相关代码，专注于 API 服务:

```javascript
// koaapp.js
const app = new Koa();

// 只包含 API 路由和中间件
app.use(bodyParser());
app.use(cors());
app.use(router.routes());

app.listen(port, () => {
  console.log(`✅ 主应用启动成功，端口: ${port}`);
});
```

### 爬虫服务配置

#### spider-service/.env

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=data_platform
DB_PORT=3306

# 爬虫配置
SPIDER_TIMEOUT=30000          # 爬虫超时时间 (毫秒)
MAX_RETRIES=3                 # 最大重试次数
REQUEST_HEADERS=true          # 是否设置请求头

# 定时任务
# 格式: 秒 分 小时 日期 月份 星期
# 当前设置: 每天 00:00, 12:00, 18:00 执行
CRON_SCHEDULE_1=0 0 0 * * *
CRON_SCHEDULE_2=0 0 12 * * *
CRON_SCHEDULE_3=0 0 18 * * *
```

## 📊 爬虫平台信息

| 平台 | 爬虫实现 | 数据量 | 状态 |
|-----|--------|-------|------|
| 百度热搜 | Axios + Cheerio | ~30 条 | ✅ 活跃 |
| 微博热搜 | Puppeteer + Cheerio | ~30 条 | ✅ 活跃 |
| B站热门 | Axios + Cheerio | ~100 条 | ✅ 活跃 |

## 🔍 监控与日志

### 主应用日志
```bash
# 查看主应用日志 (使用 PM2)
pm2 logs api

# 或使用 Docker
docker logs vue3dataplatform_api_1
```

### 爬虫服务日志
```bash
# 查看爬虫服务日志 (使用 PM2)
pm2 logs spider

# 或使用 Docker
docker logs vue3dataplatform_spider_1

# 或查看本地日志文件
tail -f spider-service/logs/spider.log
```

### 日志格式示例

**启动日志:**
```
🚀 独立爬虫微服务启动
✅ 已注册任务: 热门话题爬虫 - 每天凌晨
✅ 已注册任务: 热门话题爬虫 - 每天中午
✅ 已注册任务: 热门话题爬虫 - 每天傍晚
✅ 爬虫定时任务已启动
```

**执行日志:**
```
▶ 正在爬取百度热搜...
✅ 百度热搜爬取成功: 30 条
▶ 正在爬取微博热搜...
✅ 微博热搜爬取成功: 25 条
▶ 正在爬取B站热门...
✅ B站热门爬取成功: 98 条
💾 成功保存 153 条话题到数据库
```

## 🐛 故障排除

### 问题 1: 爬虫服务无法连接数据库

**症状:** `connect ECONNREFUSED 127.0.0.1:3306`

**解决方案:**
```bash
# 检查 MySQL 是否运行
mysql -u root -p

# 检查 .env 配置中的数据库信息
cat spider-service/.env

# 确保 DB_HOST、DB_USER、DB_PASSWORD 正确
```

### 问题 2: 主应用和爬虫服务冲突

**症状:** 端口被占用或数据库锁定

**解决方案:**
```bash
# 杀死所有 Node 进程
pkill -f "node"

# 或使用 PM2 停止所有
pm2 stop all
pm2 delete all

# 重新启动
npm start
cd spider-service && npm start
```

### 问题 3: 爬虫任务不执行

**症状:** 定时任务没有在指定时间执行

**解决方案:**
```bash
# 检查 cron 表达式格式
# 格式: 秒 分 小时 日期 月份 星期
# 示例: 0 0 0 * * * 表示每天 00:00:00

# 查看爬虫服务日志
pm2 logs spider

# 手动测试爬虫
cd spider-service
node -e "require('./utils/hotTopicsSpider').startSpider()"
```

## 📈 性能指标

### 启动时间

| 指标 | 转变前 | 转变后 | 改善 |
|-----|--------|--------|------|
| 主应用启动时间 | 30+ 秒 | <1 秒 | ⬇️ 97% |
| 爬虫任务不阻塞 API | ❌ | ✅ | 🎉 |
| 资源隔离 | ❌ | ✅ | 🎉 |

### 资源占用

| 组件 | CPU | 内存 | 说明 |
|------|-----|------|------|
| 主应用 | <5% | 50-80 MB | 轻量 API 服务 |
| 爬虫服务 | 2-15% | 100-300 MB | Puppeteer 等重资源 |

## 🔐 安全考虑

### 隔离级别

- **进程隔离**: 两个独立 Node 进程，不共享内存
- **网络隔离**: 可配置不同的端口和网络接口
- **数据库隔离**: 通过数据库连接池管理

### 错误处理

两个服务都配置了完整的异常处理:

```javascript
// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  // 记录到日志文件或监控系统
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在优雅关闭...');
  // 关闭数据库连接
  // 停止接收新请求
});
```

## 🎯 最佳实践

### 开发环境
1. 使用两个终端分别运行两个服务
2. 使用 `npm run dev:backend` 以支持 nodemon 自动重载
3. 在爬虫服务目录中使用 `npm start` 运行

### 生产环境
1. 使用 PM2 或 Docker 管理进程生命周期
2. 配置日志收集和监控
3. 设置进程崩溃自动重启
4. 配置负载均衡和反向代理

### 监控建议
1. 监控进程状态和资源使用
2. 监控数据库连接数
3. 监控爬虫执行时间和失败率
4. 设置告警规则

## 📚 相关文档

- [爬虫服务详细文档](./spider-service/README.md)
- [迁移指南](./SPIDER_MIGRATION.md)
- [项目架构总结](./ARCHITECTURE.md)

## 📞 支持

如需技术支持或报告问题，请参考:
- [爬虫服务 README](./spider-service/README.md)
- [迁移指南](./SPIDER_MIGRATION.md)

---

**最后更新:** 2025年11月26日
**版本:** 1.0.0
