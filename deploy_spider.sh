#!/bin/bash

# ========================================
# Python爬虫部署和启动脚本
# ========================================

set -e

SERVER_IP="8.166.130.216"
SERVER_USER="root"
SERVER_PORT="443"
REMOTE_PATH="/home/dataPlatform/server"
LOCAL_SERVER="./server"

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

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo "================================"
echo "  Python爬虫部署开始"
echo "================================"
echo ""

# 1. 上传爬虫脚本
print_status "上传Python爬虫脚本..."
scp -P "$SERVER_PORT" "$LOCAL_SERVER/utils/hot_topics_spider.py" "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/utils/" > /dev/null 2>&1
scp -P "$SERVER_PORT" "$LOCAL_SERVER/utils/scheduler.py" "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/utils/" > /dev/null 2>&1
print_status "爬虫脚本上传完成"

# 2. 远程安装Python依赖
print_status "安装Python依赖..."
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" << 'EOF'
    cd /home/dataPlatform/server
    python3 -m pip install --user requests beautifulsoup4 PyMySQL schedule -q 2>&1 | grep -v "already satisfied" || true
    echo "✅ Python依赖安装完成"
EOF

# 3. 创建日志目录
print_status "创建日志目录..."
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "mkdir -p /home/dataPlatform/logs"

# 4. 测试爬虫
print_status "测试爬虫脚本..."
ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" << 'EOF'
    cd /home/dataPlatform/server
    timeout 120 python3 utils/hot_topics_spider.py
    if [ $? -eq 0 ]; then
        echo "✅ 爬虫测试成功"
    else
        echo "⚠ 爬虫测试有警告"
    fi
EOF

echo ""
echo "================================"
echo "部署完成！"
echo "================================"
echo ""
echo "启动爬虫调度器的方式:"
echo ""
echo "1️⃣ 方式一: nohup (后台运行)"
echo "   ssh $SERVER_USER@$SERVER_IP -p $SERVER_PORT 'nohup python3 /home/dataPlatform/server/utils/scheduler.py > /home/dataPlatform/logs/scheduler.log 2>&1 &'"
echo ""
echo "2️⃣ 方式二: systemd service (推荐)"
echo "   执行: ./setup_systemd.sh"
echo ""
echo "3️⃣ 方式三: supervisor (进程管理)"
echo "   执行: ./setup_supervisor.sh"
echo ""
echo "4️⃣ 方式四: PM2 (Node风格)"
echo "   执行: pm2 start utils/scheduler.py --name 'spider-scheduler' --interpreter python3"
echo ""
echo "📝 查看日志:"
echo "   ssh $SERVER_USER@$SERVER_IP -p $SERVER_PORT 'tail -f /home/dataPlatform/logs/scheduler.log'"
echo ""
