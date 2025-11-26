#!/bin/bash

# ========================================
# 服务器自动部署和启动脚本
# ========================================
# 使用方法: 在服务器上执行此脚本
# bash /home/dataPlatform/server/server-setup.sh
# ========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then 
    print_error "此脚本需要 root 权限"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Vue3 数据平台 服务器自动部署脚本              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. 检查系统环境
print_info "检查系统环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    print_warning "Node.js 未安装，正在安装..."
    curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash -
    apt-get install -y nodejs
fi
NODE_VERSION=$(node -v)
print_status "Node.js 版本: $NODE_VERSION"

# 检查 npm
NPM_VERSION=$(npm -v)
print_status "npm 版本: $NPM_VERSION"

# 检查 MySQL
if ! command -v mysql &> /dev/null; then
    print_error "MySQL 未安装，请先安装: apt-get install -y mysql-server"
    exit 1
fi
MYSQL_VERSION=$(mysql --version)
print_status "MySQL 版本: $MYSQL_VERSION"

# 检查 Git
if ! command -v git &> /dev/null; then
    print_warning "Git 未安装，正在安装..."
    apt-get install -y git
fi
GIT_VERSION=$(git --version)
print_status "Git 版本: $GIT_VERSION"

echo ""

# 2. 安装 PM2
print_info "检查 PM2..."
if ! npm list -g pm2 > /dev/null 2>&1; then
    print_warning "PM2 未安装，正在安装..."
    npm install -g pm2
fi
PM2_VERSION=$(pm2 -v)
print_status "PM2 版本: $PM2_VERSION"

# 3. 创建项目目录
print_info "检查项目目录..."
PROJECT_DIR="/home/dataPlatform/server"
if [ ! -d "$PROJECT_DIR" ]; then
    print_warning "项目目录不存在，正在创建..."
    mkdir -p "$PROJECT_DIR"
fi
print_status "项目目录: $PROJECT_DIR"

# 4. 安装项目依赖
print_info "安装项目依赖..."
cd "$PROJECT_DIR"

if [ ! -f "package.json" ]; then
    print_error "package.json 不存在，请先上传项目代码"
    exit 1
fi

npm install --production > /dev/null 2>&1
print_status "主应用依赖安装完成"

# 5. 安装爬虫服务依赖
print_info "安装爬虫服务依赖..."
cd spider-service
npm install --production > /dev/null 2>&1
print_status "爬虫服务依赖安装完成"
cd ..

# 6. 创建日志目录
print_info "创建日志目录..."
mkdir -p /var/log/pm2
print_status "日志目录创建完成"

# 7. 创建 PM2 配置文件
print_info "创建 PM2 配置..."
cat > "$PROJECT_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'koaapp.js',
      cwd: '/home/dataPlatform/server',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/api-error.log',
      out_file: '/var/log/pm2/api-out.log',
      log_file: '/var/log/pm2/api.log',
      time: true,
      autorestart: true,
      max_memory_restart: '500M',
      watch: false,
      kill_timeout: 5000
    },
    {
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
      watch: false,
      kill_timeout: 5000,
      delay_between_restart: 5000
    }
  ]
};
EOF
print_status "PM2 配置创建完成"

# 8. 启动应用
print_info "启动应用服务..."
pm2 delete all > /dev/null 2>&1 || true
pm2 start ecosystem.config.js > /dev/null 2>&1
pm2 save > /dev/null 2>&1

# 等待应用启动
sleep 3

# 9. 设置开机自启
print_info "配置开机自启..."
pm2 startup systemd -u root --hp /root > /dev/null 2>&1
print_status "开机自启配置完成"

# 10. 验证应用状态
print_info "验证应用状态..."
echo ""
pm2 status

echo ""
print_status "========================================="
print_status "部署完成! 所有服务已启动"
print_status "========================================="

# 显示服务信息
echo ""
echo -e "${BLUE}📊 服务信息:${NC}"
echo "  API 服务:"
echo "    URL: http://localhost:3001"
echo "    进程: $(ps aux | grep 'koaapp.js' | grep -v grep | wc -l) 个"
echo ""
echo "  爬虫服务:"
echo "    状态: $(pm2 status spider | grep online | wc -l) 运行中"
echo "    进程: $(ps aux | grep 'spider-service' | grep -v grep | wc -l) 个"
echo ""

# 显示快速命令
echo -e "${BLUE}⚡ 快速命令:${NC}"
echo "  查看状态:   pm2 status"
echo "  查看日志:   pm2 logs"
echo "  重启应用:   pm2 restart all"
echo "  停止应用:   pm2 stop all"
echo "  监控应用:   pm2 monit"
echo ""

# 提示后续步骤
echo -e "${YELLOW}📝 后续步骤:${NC}"
echo "  1. 检查 API 是否可访问:"
echo "     curl http://localhost:3001/statistics/getHotTopics"
echo ""
echo "  2. 查看实时日志:"
echo "     pm2 logs"
echo ""
echo "  3. 配置防火墙 (如果需要):"
echo "     ufw allow 3001/tcp"
echo ""

print_status "脚本执行完成!"
