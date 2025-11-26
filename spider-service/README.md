# 独立爬虫微服务 (Spider Service)

## 📋 概述

这是一个独立于主应用的爬虫微服务，负责定时采集热门话题数据。

### 为什么分离爬虫服务？

**问题背景：**
- 爬虫任务 (尤其是 Puppeteer) 消耗 CPU/内存资源
- 网络请求超时会影响 API 响应速度
- 爬虫异常可能导致整个应用崩溃
- 爬虫维护更新需要重启整个应用

**解决方案：**
通过微服务架构分离爬虫：
- ✅ 爬虫异常不影响 API 服务
- ✅ 爬虫可独立更新和维护
- ✅ 资源隔离，避免相互竞争
- ✅ API 响应不被爬虫阻塞
- ✅ 可单独扩展爬虫性能

## 🚀 快速开始

### 安装依赖

```bash
cd spider-service
npm install
```

### 启动爬虫服务

```bash
npm start              # 生产环境
npm run dev            # 开发环境（带热重启）
```

### 查看日志

```bash
# 查看爬虫执行日志
tail -f logs/spider.log

# 查看实时执行情况
# 爬虫会每天在 00:00、12:00、18:00 自动执行
```

## 📊 架构说明

```
主应用 (vue3DataPlatform)
├── API 服务 (端口 3001)
│   ├── /statistics/getHotTopics
│   ├── /book/*
│   └── ...
└── 数据库 (MySQL)
     ↑
     │ 共享
     │ 数据库
     ↓
爬虫服务 (spider-service)
├── 定时任务调度 (node-cron)
├── 爬虫执行引擎
│   ├── 百度热搜爬虫
│   ├── 微博热搜爬虫 (Puppeteer)
│   └── B站热门爬虫
└── 数据保存

```

## ⚙️ 配置

### 环境变量

在 `.env` 文件中配置：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=data_platform
DB_PORT=3306

# 日志级别
LOG_LEVEL=info
```

### 定时任务

在 `utils/cronScheduler.js` 中修改执行时间：

```javascript
const taskConfigs = [
    {
        name: '热门话题爬虫 - 每天凌晨',
        schedule: '0 0 0 * * *',  // Cron 表达式
        description: '凌晨更新热门话题'
    },
    // ...
];
```

**Cron 表达式格式：**
```
┌───────────── 秒 (0 - 59)
│ ┌───────────── 分 (0 - 59)
│ │ ┌───────────── 小时 (0 - 23)
│ │ │ ┌───────────── 日期 (1 - 31)
│ │ │ │ ┌───────────── 月份 (1 - 12)
│ │ │ │ │ ┌───────────── 星期 (0 - 7，其中 0 和 7 为周日)
│ │ │ │ │ │
│ │ │ │ │ │
* * * * * *
```

常用示例：
- `0 0 0 * * *` - 每天凌晨 00:00:00
- `0 0 12 * * *` - 每天中午 12:00:00
- `0 0 18 * * *` - 每天傍晚 18:00:00
- `0 */6 * * * *` - 每 6 小时执行一次

## 📝 API 说明

虽然爬虫服务是独立的，但它共享主应用的数据库。

**前端通过以下 API 获取数据：**

```javascript
// 获取所有平台的热门话题
POST /statistics/getHotTopics

// 响应格式
{
  "code": 200,
  "message": "成功获取热门话题",
  "data": {
    "topics": {
      "baidu": [...],        // 百度热搜
      "weibo": [...],        // 微博热搜
      "bilibili": [...]      // B站热门
    }
  }
}
```

## 🛠️ 手动触发爬虫

有时需要手动触发爬虫任务（如测试新代码）：

### 方式1：直接运行爬虫

```bash
cd spider-service
node utils/hotTopicsSpider.js
```

### 方式2：通过 Node REPL

```bash
node
> const spider = require('./utils/hotTopicsSpider');
> spider.runAllSpiders().then(() => process.exit(0));
```

## 📊 支持的平台

| 平台 | 爬虫类型 | 状态 | 备注 |
|-----|---------|------|------|
| 百度 | Axios + Cheerio | ✅ 工作 | 稳定 |
| 微博 | Puppeteer + Cheerio | ✅ 工作 | 需要浏览器渲染 |
| B站 | Axios + Cheerio | ✅ 工作 | 稳定 |
| 头条 | Axios + Cheerio | ⏸️ 禁用 | 反爬虫机制 |
| 小红书 | Axios + Cheerio | ❌ 移除 | 数据质量问题 |
| 抖音 | - | ❌ 不支持 | 反爬虫太强 |
| 知乎 | - | ❌ 不支持 | 需要加密认证 |

## 🐛 故障排查

### 问题：爬虫不执行

**检查清单：**
1. 服务是否启动？ `ps aux | grep "node app.js"`
2. 定时任务是否配置？ 查看控制台输出
3. 数据库是否连接？ 查看错误日志
4. 防火墙是否阻止？ 检查网络连接

### 问题：爬虫执行失败

**常见原因：**
- 网络超时：增加超时时间
- 反爬虫检测：添加随机延迟
- 页面结构变化：更新选择器

### 问题：内存溢出

**解决方案：**
- 减少并发爬虫数量
- 增加爬虫之间的延迟
- 定期重启爬虫服务

## 📈 监控和日志

### 查看爬虫日志

```bash
# 实时查看
tail -f logs/spider.log

# 查看历史日志
cat logs/spider.log | grep "成功"
cat logs/spider.log | grep "失败"
```

### 监控爬虫健康状态

```bash
# 查看最后一次执行时间
SELECT * FROM crawler_logs ORDER BY created_at DESC LIMIT 1;

# 统计成功率
SELECT platform, COUNT(*) as total, 
       SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
FROM crawler_logs 
GROUP BY platform;
```

## 🔄 升级和维护

### 更新爬虫代码

```bash
cd spider-service
# 编辑爬虫代码
vim utils/hotTopicsSpider.js

# 重启服务（自动重新加载）
npm run dev
```

### 测试新爬虫

```bash
# 单独测试新平台爬虫
node utils/hotTopicsSpider.js

# 检查输出是否正常
```

### 回滚版本

```bash
git checkout HEAD -- spider-service/
npm install
npm start
```

## 📚 相关文档

- [node-cron 文档](https://github.com/kelektiv/node-cron)
- [Puppeteer 文档](https://pptr.dev/)
- [Cheerio 文档](https://cheerio.js.org/)
- [Axios 文档](https://axios-http.com/)

## 👨‍💻 开发者

- **创建者：** kris
- **创建日期：** 2025年11月26日
- **目的：** 数据平台的热门话题爬虫微服务

## 📄 许可证

MIT

---

**最后更新：** 2025年11月26日
