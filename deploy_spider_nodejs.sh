#!/bin/bash

# ========================================
# Node.js 爬虫定时调度器部署脚本
# （推荐方式 - 因为服务器已有 Node.js 环境）
# ========================================

set -e

SERVER_IP="8.166.130.216"
SERVER_USER="root"
SERVER_PORT="443"
REMOTE_PATH="/home/dataPlatform/server"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo "================================"
echo "  Node.js爬虫调度器部署"
echo "================================"
echo ""

# 1. 检查本地文件
if [ ! -f "./server/utils/scheduler-node.js" ]; then
    print_warning "找不到 scheduler-node.js 文件"
    exit 1
fi

if [ ! -f "./server/utils/hotTopicsSpider.js" ]; then
    print_warning "找不到 hotTopicsSpider.js 文件"
    exit 1
fi

# 2. 上传调度器脚本
print_status "上传调度器脚本到服务器..."
scp -P "$SERVER_PORT" "./server/utils/scheduler-node.js" "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/utils/" > /dev/null 2>&1

# 3. 确保 node-cron 依赖已安装
print_status "检查并安装 node-cron 依赖..."
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" << 'EOF'
    cd /home/dataPlatform/server
    npm list node-cron >/dev/null 2>&1 || npm install node-cron --save
    echo "✅ node-cron 依赖就绪"
EOF

# 4. 创建日志目录
print_status "创建日志目录..."
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "mkdir -p /home/dataPlatform/logs"

# 5. 提示用户选择启动方式
echo ""
echo "================================"
echo "部署完成！"
echo "================================"
echo ""
echo "选择启动方式:"
echo ""
echo "1️⃣ 方式一: PM2 启动（推荐）"
echo "   命令: ssh $SERVER_USER@$SERVER_IP -p $SERVER_PORT 'cd /home/dataPlatform/server && pm2 start utils/scheduler-node.js --name spider-scheduler'"
echo ""
echo "2️⃣ 方式二: PM2 后台运行"
echo "   命令: ssh $SERVER_USER@$SERVER_IP -p $SERVER_PORT 'cd /home/dataPlatform/server && pm2 start utils/scheduler-node.js --name spider-scheduler --no-autorestart'"
echo ""
echo "3️⃣ 方式三: Nohup 后台运行"
echo "   命令: ssh $SERVER_USER@$SERVER_IP -p $SERVER_PORT 'cd /home/dataPlatform/server && nohup node utils/scheduler-node.js > ../logs/spider-scheduler.log 2>&1 &'"
echo ""
echo "📝 查看日志:"
echo "   ssh $SERVER_USER@$SERVER_IP -p $SERVER_PORT 'tail -f /home/dataPlatform/logs/spider-scheduler.log'"
echo ""
echo "⏰ 运行时间: 每天 00:00、12:00、18:00"
echo ""
