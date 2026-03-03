# 🚀 服务器部署完整指南

## 📋 服务器信息

```
服务器 IP: 47.110.66.121
SSH 端口: 443
远程路径: /home/dataPlatform/server
当前用户: root
```

## 🔧 服务器环境检查

### 前置要求

```bash
# SSH 连接到服务器
ssh -p 443 root@47.110.66.121

# 检查 Node.js 版本
node -v          # 应为 v21.7.3+
npm -v            # 应为 10.0.0+

# 检查 MySQL
mysql --version   # 应为 8.0+

# 检查 Git
git --version     # 应为 2.0+
```

## 📥 服务器部署步骤

### Step 1: 同步代码到服务器

```bash
# 在本地执行
cd /path/to/vue3DataPlatform

# 方案 A: 使用 deploy.sh 脚本 (推荐)
./deploy.sh --full

# 方案 B: 手动上传 (如果脚本失败)
scp -P 443 -r . root@47.110.66.121:/home/dataPlatform/server/

# 方案 C: Git 拉取 (如果已有仓库)
ssh -p 443 root@47.110.66.121
cd /home/dataPlatform/server
git pull origin main
```

### Step 2: 安装依赖

```bash
# SSH 登录到服务器
ssh -p 443 root@47.110.66.121

# 进入项目目录
cd /home/dataPlatform/server

# 安装主应用依赖
npm install

# 安装爬虫服务依赖
cd spider-service
npm install
cd ..
```

### Step 3: 配置环境变量

#### 主应用配置

编辑 `server/config.js` 或创建 `.env`:

```bash
cat > /home/dataPlatform/server/.env << 'EOF'
# 主应用配置
NODE_ENV=production
PORT=3001
API_HOST=0.0.0.0

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=data_platform
DB_PORT=3306
EOF
```

#### 爬虫服务配置

```bash
cat > /home/dataPlatform/server/spider-service/.env << 'EOF'
# 爬虫服务配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=data_platform
DB_PORT=3306

# 爬虫超时时间 (毫秒)
SPIDER_TIMEOUT=30000
MAX_RETRIES=3

# 定时任务 (cron 表达式)
CRON_SCHEDULE_1=0 0 0 * * *     # 每天 00:00
CRON_SCHEDULE_2=0 0 12 * * *    # 每天 12:00
CRON_SCHEDULE_3=0 0 18 * * *    # 每天 18:00
EOF
```

### Step 4: 数据库配置

```bash
# 连接到 MySQL
mysql -u root -p

# 创建数据库 (如果不存在)
CREATE DATABASE IF NOT EXISTS data_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 导入数据库脚本
mysql -u root -p data_platform < /home/dataPlatform/server/server/sql/hot_topics_schema.sql

# 验证
USE data_platform;
SHOW TABLES;
SELECT COUNT(*) FROM hot_topics;
```

## 🚀 服务器启动方案

### 方案 A: PM2 管理 (推荐生产环境)

#### 安装 PM2

```bash
npm install -g pm2

# 验证安装
pm2 -v
```

#### 配置 PM2

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      // API 服务
      name: 'api',
      script: 'koaapp.js',
      cwd: '/home/dataPlatform/server',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/api-error.log',
      out_file: '/var/log/pm2/api-out.log',
      log_file: '/var/log/pm2/api.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      watch: false
    },
    {
      // 爬虫服务
      name: 'spider',
      script: 'app.js',
      cwd: '/home/dataPlatform/server/spider-service',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/spider-error.log',
      out_file: '/var/log/pm2/spider-out.log',
      log_file: '/var/log/pm2/spider.log',
      time: true,
      autorestart: true,
      max_memory_restart: '300M',
      watch: false
    }
  ]
};
```

#### 使用 PM2 启动

```bash
cd /home/dataPlatform/server

# 启动所有应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs api        # API 日志
pm2 logs spider     # 爬虫日志

# 监控
pm2 monit

# 保存配置
pm2 save
pm2 startup         # 开机自启

# 停止/重启
pm2 stop all
pm2 restart all
pm2 delete all
```

### 方案 B: Systemd Service (系统级管理)

#### 创建 API 服务

```bash
sudo tee /etc/systemd/system/dataPlatform-api.service > /dev/null << 'EOF'
[Unit]
Description=Vue3 Data Platform API Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/dataPlatform/server
ExecStart=/usr/bin/node koaapp.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment="NODE_ENV=production"
Environment="PORT=3001"

[Install]
WantedBy=multi-user.target
EOF

# 启用和启动
sudo systemctl daemon-reload
sudo systemctl enable dataPlatform-api.service
sudo systemctl start dataPlatform-api.service
```

#### 创建爬虫服务

```bash
sudo tee /etc/systemd/system/dataPlatform-spider.service > /dev/null << 'EOF'
[Unit]
Description=Vue3 Data Platform Spider Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/dataPlatform/server/spider-service
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF

# 启用和启动
sudo systemctl daemon-reload
sudo systemctl enable dataPlatform-spider.service
sudo systemctl start dataPlatform-spider.service
```

#### 管理服务

```bash
# 查看状态
sudo systemctl status dataPlatform-api.service
sudo systemctl status dataPlatform-spider.service

# 查看日志
sudo journalctl -u dataPlatform-api.service -f
sudo journalctl -u dataPlatform-spider.service -f

# 控制服务
sudo systemctl start/stop/restart dataPlatform-api.service
sudo systemctl start/stop/restart dataPlatform-spider.service
```

### 方案 C: Docker 部署

#### Dockerfile (API)

```dockerfile
FROM node:21-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "koaapp.js"]
```

#### Dockerfile (Spider)

```dockerfile
FROM node:21-alpine

WORKDIR /app

COPY spider-service/package.json spider-service/package-lock.json ./
RUN npm install --production

COPY spider-service .

ENV NODE_ENV=production

CMD ["node", "app.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # 数据库
  mysql:
    image: mysql:8.0
    container_name: dataPlatform-mysql
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: data_platform
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/sql:/docker-entrypoint-initdb.d
    restart: always

  # API 服务
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: dataPlatform-api
    ports:
      - "3001:3001"
    environment:
      DB_HOST: mysql
      DB_USER: root
      DB_PASSWORD: your_password
      DB_NAME: data_platform
    depends_on:
      - mysql
    restart: always

  # 爬虫服务
  spider:
    build:
      context: .
      dockerfile: spider-service/Dockerfile
    container_name: dataPlatform-spider
    environment:
      DB_HOST: mysql
      DB_USER: root
      DB_PASSWORD: your_password
      DB_NAME: data_platform
    depends_on:
      - mysql
    restart: always

volumes:
  mysql_data:
```

#### 启动 Docker

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f api
docker-compose logs -f spider

# 查看状态
docker-compose ps

# 停止服务
docker-compose down
```

## 📊 验证部署

### 检查 API 服务

```bash
# 检查进程
ps aux | grep "node koaapp.js"

# 检查端口
netstat -tulpn | grep 3001

# 测试 API
curl http://localhost:3001/statistics/getHotTopics | jq .

# 查看 PM2 日志
pm2 logs api
```

### 检查爬虫服务

```bash
# 检查进程
ps aux | grep "spider-service"

# 查看 PM2 日志
pm2 logs spider

# 查看定时任务日志
tail -f /var/log/pm2/spider.log
```

### 检查数据库

```bash
# 连接数据库
mysql -u root -p

# 检查数据
USE data_platform;
SELECT COUNT(*) FROM hot_topics;
SELECT DISTINCT platform FROM hot_topics;
```

## 🔄 更新和维护

### 更新代码

```bash
cd /home/dataPlatform/server

# 拉取最新代码
git pull origin main

# 安装新依赖 (如果有)
npm install

# 爬虫服务更新
cd spider-service
npm install
cd ..

# 使用 PM2 重启
pm2 restart all
```

### 数据备份

```bash
# 备份数据库
mysqldump -u root -p data_platform > /home/dataPlatform/backup/data_platform_$(date +%Y%m%d_%H%M%S).sql

# 备份上传到云存储或本地
scp -P 443 root@47.110.66.121:/home/dataPlatform/backup/*.sql ./local/backup/
```

### 日志管理

```bash
# 查看实时日志
pm2 logs

# 保存日志
pm2 save logs
pm2 log save

# 清理旧日志
pm2 flush

# 日志位置
# API: /var/log/pm2/api.log
# Spider: /var/log/pm2/spider.log
```

## 🐛 故障排除

### 问题 1: API 服务无法启动

```bash
# 检查端口占用
lsof -i :3001

# 检查依赖
npm ls

# 检查日志
pm2 logs api

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重启服务
pm2 restart api
```

### 问题 2: 爬虫服务无法连接数据库

```bash
# 检查数据库状态
mysql -u root -p -e "SELECT 1"

# 检查爬虫配置
cat spider-service/.env

# 检查日志
pm2 logs spider

# 测试连接
node -e "require('./spider-service/utils/db.js')"
```

### 问题 3: 爬虫任务不执行

```bash
# 检查 cron 配置
cat spider-service/.env | grep CRON

# 手动测试爬虫
cd spider-service
node -e "require('./utils/hotTopicsSpider.js').startSpider()"

# 查看日志
pm2 logs spider

# 验证定时任务
ps aux | grep "node app.js"
```

### 问题 4: 内存占用过高

```bash
# 检查进程内存
ps aux | grep "node"

# 重启服务
pm2 restart all

# 查看内存限制
pm2 show api
pm2 show spider
```

## 📈 性能监控

### 使用 PM2 监控

```bash
# 实时监控
pm2 monit

# 保存监控数据
pm2 install pm2-auto-pull
pm2 save

# 生成报告
pm2 generate-sample
```

### 日志分析

```bash
# 查看 API 响应时间
tail -f /var/log/pm2/api.log | grep "响应时间"

# 查看爬虫执行时间
tail -f /var/log/pm2/spider.log | grep "总耗时"

# 统计错误数
grep "ERROR" /var/log/pm2/*.log | wc -l
```

## 🎯 快速参考命令

```bash
# SSH 连接
ssh -p 443 root@47.110.66.121

# 进入项目目录
cd /home/dataPlatform/server

# 启动所有服务 (PM2)
pm2 start ecosystem.config.js

# 查看服务状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart all

# 停止服务
pm2 stop all

# 查看实时监控
pm2 monit
```

## 📞 获取帮助

遇到问题?

1. 查看 PM2 日志: `pm2 logs`
2. 查看系统日志: `systemctl status dataPlatform-api`
3. 检查错误日志: `/var/log/pm2/*.log`
4. 查看本地文档: `MICROSERVICES_DEPLOYMENT.md`

---

**服务器地址:** 47.110.66.121:443  
**最后更新:** 2025年11月26日  
**版本:** 1.0.0
