#!/bin/bash

################################################################################
# 📦 vue3DataPlatform 一键部署脚本
# 
# 用途: 快速同步代码到生产环境
# 使用: ./deploy.sh [backend|frontend|all]
#
# 示例:
#   ./deploy.sh backend   - 仅部署后端
#   ./deploy.sh frontend  - 仅部署前端
#   ./deploy.sh all       - 同时部署前后端（默认）
#   ./deploy.sh          - 同时部署前后端
#
# 前提条件: 
#   1. 代码已提交到 GitHub (git commit && git push)
#   2. 前端代码需要先本地构建 (npm run build)
#
################################################################################

set -e  # 任何错误都会停止脚本执行

# ============================================================================
# 配置信息
# ============================================================================

# 本地项目根目录
LOCAL_PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 生产服务器配置
PROD_SERVER="8.166.130.216"
PROD_PORT="443"
PROD_USER="root"
PROD_HOME="/home/dataPlatform"

# 颜色定义（用于美化输出）
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# 辅助函数
# ============================================================================

# 打印信息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 打印成功
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 打印警告
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 打印错误
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 打印分隔线
print_separator() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================================================
# 检查前置条件
# ============================================================================

check_prerequisites() {
    print_info "检查前置条件..."
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ]; then
        print_error "必须在项目根目录运行此脚本！"
        print_info "当前目录: $(pwd)"
        exit 1
    fi
    
    # 检查 Git 状态
    if ! git status > /dev/null 2>&1; then
        print_error "Git 不可用或不在 Git 仓库中！"
        exit 1
    fi
    
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "检测到未提交的文件更改！"
        echo -e "${YELLOW}请先运行以下命令提交:${NC}"
        echo "  git add ."
        echo "  git commit -m '描述你的修改'"
        echo "  git push origin main"
        read -p "是否继续? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "已取消部署"
            exit 1
        fi
    fi
    
    print_success "前置条件检查通过"
}

# ============================================================================
# 后端部署
# ============================================================================

deploy_backend() {
    print_separator
    print_info "开始部署后端代码..."
    print_separator
    
    # 检查后端目录
    if [ ! -d "backend" ]; then
        print_error "找不到 backend 目录！"
        exit 1
    fi
    
    print_info "1️⃣  验证本地后端代码..."
    if [ ! -f "backend/koaapp-production.js" ]; then
        print_error "找不到 backend/koaapp-production.js！"
        exit 1
    fi
    print_success "本地后端代码验证通过"
    
    print_info "2️⃣  连接到生产服务器并拉取代码..."
    ssh -p $PROD_PORT $PROD_USER@$PROD_SERVER << EOF
cd $PROD_HOME
git pull origin main
echo "✅ 代码拉取成功"
EOF
    
    if [ $? -eq 0 ]; then
        print_success "代码拉取成功"
    else
        print_error "代码拉取失败！"
        exit 1
    fi
    
    print_info "3️⃣  重启后端服务..."
    ssh -p $PROD_PORT $PROD_USER@$PROD_SERVER << EOF
pm2 restart koa-server
pm2 restart scheduler
sleep 2
pm2 list
EOF
    
    print_success "后端重启成功"
    
    print_info "4️⃣  验证后端服务..."
    sleep 3
    RESPONSE=$(curl -s -X POST http://$PROD_SERVER/statistics/getHotTopics -H "Content-Type: application/json" | head -c 100)
    if [ -n "$RESPONSE" ]; then
        print_success "后端服务正常运行"
    else
        print_warning "无法验证后端服务，请手动检查"
        print_info "运行命令: pm2 logs koa-server"
    fi
}

# ============================================================================
# 前端部署
# ============================================================================

deploy_frontend() {
    print_separator
    print_info "开始部署前端代码..."
    print_separator
    
    # 检查前端目录
    if [ ! -d "frontend" ]; then
        print_error "找不到 frontend 目录！"
        exit 1
    fi
    
    print_info "1️⃣  检查本地 dist 文件夹..."
    if [ ! -d "dist" ]; then
        print_warning "找不到 dist 文件夹，需要先构建前端"
        read -p "是否现在运行 npm run build? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "构建前端代码..."
            npm run build
            if [ $? -ne 0 ]; then
                print_error "前端构建失败！"
                exit 1
            fi
            print_success "前端构建成功"
        else
            print_error "缺少 dist 文件夹，无法继续部署"
            exit 1
        fi
    else
        print_success "dist 文件夹已存在"
    fi
    
    print_info "2️⃣  验证 dist 文件夹..."
    if [ ! -f "dist/index.html" ]; then
        print_error "dist/index.html 不存在！"
        exit 1
    fi
    print_success "dist/index.html 验证通过"
    
    print_info "3️⃣  打包前端文件..."
    rm -f dist.tar.gz
    tar -czf dist.tar.gz dist/
    if [ ! -f "dist.tar.gz" ]; then
        print_error "打包失败！"
        exit 1
    fi
    print_success "打包成功 ($(du -h dist.tar.gz | cut -f1))"
    
    print_info "4️⃣  上传到生产服务器..."
    scp -P $PROD_PORT dist.tar.gz $PROD_USER@$PROD_SERVER:/tmp/
    if [ $? -eq 0 ]; then
        print_success "上传成功"
    else
        print_error "上传失败！"
        exit 1
    fi
    
    print_info "5️⃣  在生产环境部署前端..."
    ssh -p $PROD_PORT $PROD_USER@$PROD_SERVER << EOF
cd $PROD_HOME/frontend/dist
rm -rf *
tar -xzf /tmp/dist.tar.gz
mv dist/* .
rm -rf dist
echo "✅ 前端文件部署成功"
ls -la | head -10
EOF
    
    if [ $? -eq 0 ]; then
        print_success "前端部署成功"
    else
        print_error "前端部署失败！"
        exit 1
    fi
    
    print_info "6️⃣  验证前端文件..."
    RESPONSE=$(curl -s http://$PROD_SERVER/ | head -c 100)
    if [[ $RESPONSE == *"<!doctype"* ]]; then
        print_success "前端页面加载正常"
    else
        print_warning "无法验证前端页面，请手动检查浏览器访问"
    fi
    
    # 清理本地压缩文件
    rm -f dist.tar.gz
}

# ============================================================================
# 显示帮助信息
# ============================================================================

show_help() {
    cat << EOF
${BLUE}📦 vue3DataPlatform 一键部署脚本${NC}

用法: ./deploy.sh [选项]

选项:
  backend   - 仅部署后端代码
  frontend  - 仅部署前端代码
  all       - 同时部署前后端（默认）
  help      - 显示此帮助信息

示例:
  ./deploy.sh              # 部署前后端
  ./deploy.sh backend      # 仅部署后端
  ./deploy.sh frontend     # 仅部署前端
  ./deploy.sh help         # 显示帮助

前提条件:
  1. 代码已提交到 GitHub
  2. 前端部署前需要运行 npm run build

${GREEN}快速开始:${NC}
  1. 修改代码（frontend/ 或 backend/）
  2. 提交到 Git: git add . && git commit -m "描述" && git push
  3. 前端修改需要构建: npm run build
  4. 运行此脚本: ./deploy.sh

${BLUE}技巧:${NC}
  - 可以设置别名加快部署:
    alias deploy='bash /path/to/deploy.sh'
  - 或在 package.json 中添加脚本

EOF
}

# ============================================================================
# 主程序
# ============================================================================

main() {
    print_separator
    echo -e "${BLUE}┌─────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│         🚀 vue3DataPlatform 一键部署系统         ${NC}"
    echo -e "${BLUE}└─────────────────────────────────────────────────────────┘${NC}"
    print_separator
    
    # 解析命令行参数
    DEPLOY_TYPE="${1:-all}"
    
    case $DEPLOY_TYPE in
        backend)
            check_prerequisites
            deploy_backend
            ;;
        frontend)
            check_prerequisites
            deploy_frontend
            ;;
        all)
            check_prerequisites
            deploy_backend
            deploy_frontend
            ;;
        help)
            show_help
            exit 0
            ;;
        *)
            print_error "未知的选项: $DEPLOY_TYPE"
            show_help
            exit 1
            ;;
    esac
    
    print_separator
    print_success "✨ 部署完成！"
    print_separator
    
    echo -e "${GREEN}部署信息:${NC}"
    echo "  服务器: $PROD_SERVER"
    echo "  前端URL: http://$PROD_SERVER/#/login"
    echo "  API: http://$PROD_SERVER/api/"
    echo ""
    echo -e "${BLUE}后续检查:${NC}"
    echo "  1. 访问 http://$PROD_SERVER/#/login 检查前端"
    echo "  2. 打开浏览器控制台 (F12) 查看是否有错误"
    echo "  3. 如遇到缓存问题，使用 Ctrl+Shift+R 硬刷新"
    echo ""
}

# 运行主程序
main "$@"
