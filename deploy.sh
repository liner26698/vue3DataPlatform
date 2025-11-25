#!/bin/bash

# ========================================
# Vue3 数据平台 自动化部署脚本
# ========================================
# 用法: ./deploy.sh [--full]
# --full: 同时部署前端和后端（当后端代码有改动时使用）
# 默认: 只部署前端（dist文件夹）
# ========================================

set -e  # 出错立即退出

# 配置信息
SERVER_IP="8.166.130.216"
SERVER_USER="root"
SERVER_PORT="443"  # SSH 连接端口（已在安全组开放）
REMOTE_PATH="/home/dataPlatform/server"
LOCAL_DIST="./dist"
LOCAL_SERVER="./server"
APP_NAME="koa-server"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 函数：检查文件是否存在
check_file_exists() {
    if [ ! -d "$1" ]; then
        print_error "$1 不存在，请先运行 npm run build:pro"
        exit 1
    fi
}

# 检查参数
DEPLOY_FULL=false
if [ "$1" == "--full" ]; then
    DEPLOY_FULL=true
fi

echo "================================"
echo "   Vue3 数据平台 部署开始"
echo "================================"

# 步骤 1: 检查 dist 文件夹
print_status "检查 dist 文件夹..."
check_file_exists "$LOCAL_DIST"

# 步骤 2: 构建应用（如果 dist 不存在或过旧）
if [ ! -f "$LOCAL_DIST/index.html" ]; then
    print_warning "dist 文件夹为空，开始构建..."
    npm run build:pro
fi

# 步骤 3: 部署前端（dist）
print_status "部署前端文件到服务器..."
scp -P "$SERVER_PORT" -r "$LOCAL_DIST" "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/" > /dev/null 2>&1
print_status "前端文件部署完成"

# 步骤 4: 如果是完整部署，替换后端并重启
if [ "$DEPLOY_FULL" = true ]; then
    print_warning "执行完整部署（包括后端代码）..."
    
    # 检查 server 文件夹
    check_file_exists "$LOCAL_SERVER"
    
    # 部署后端文件
    print_status "部署后端文件到服务器..."
    scp -P "$SERVER_PORT" -r "$LOCAL_SERVER" "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/" > /dev/null 2>&1
    print_status "后端文件部署完成"
    
    # 安装依赖
    print_status "安装 npm 依赖..."
    ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "source ~/.bashrc && cd $REMOTE_PATH && npm install" > /dev/null 2>&1
    print_status "npm 依赖安装完成"
    
    # 重启 PM2 应用
    print_status "重启后端服务..."
    ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "pm2 restart $APP_NAME || pm2 start $REMOTE_PATH/koaapp.js --name $APP_NAME" > /dev/null 2>&1
    print_status "后端服务重启完成"
    
    sleep 2
    
    # 检查 PM2 状态
    print_status "检查服务状态..."
    ssh -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "pm2 status" | grep -q "$APP_NAME"
    print_status "服务运行正常"
else
    print_status "只部署了前端文件（dist）"
    print_warning "前端页面刷新浏览器即可看到更新"
fi

echo ""
echo "================================"
print_status "部署完成！"
echo "================================"
echo ""
echo "访问地址: http://$SERVER_IP"
echo ""
echo "查看日志:"
echo "  前端/应用: ssh $SERVER_USER@$SERVER_IP 'pm2 logs $APP_NAME'"
echo "  Nginx访问: ssh $SERVER_USER@$SERVER_IP 'tail -f /var/log/nginx/access.log'"
echo ""
