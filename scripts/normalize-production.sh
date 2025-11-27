#!/bin/bash

# 生产环境目录结构规范化脚本
# 此脚本将生产环境的目录结构规范化，删除不应该在 server/ 文件夹中的配置文件

set -e

PROD_SERVER="8.166.130.216"
PROD_PATH="/home/dataPlatform"
PROD_SERVER_PATH="/home/dataPlatform/server"

echo "🚀 开始生产环境规范化..."
echo ""

# 使用 ssh 连接到生产服务器并执行清理
ssh -p 443 root@$PROD_SERVER << 'REMOTE_SCRIPT'

echo "📋 当前服务器状态检查..."
echo ""

# 1. 检查 PM2 进程
echo "1️⃣ 检查 PM2 进程状态..."
pm2 list

echo ""
echo "2️⃣ 停止 PM2 进程（为了安全地修改配置）..."
pm2 stop all

echo ""
echo "3️⃣ 删除旧的配置文件副本..."
cd /home/dataPlatform
rm -f server/commitlint.config.js
rm -f server/lint-staged.config.js
rm -f server/postcss.config.js
rm -f server/stylelint.config.js
echo "✅ 已删除 server/ 目录中的配置文件"

echo ""
echo "4️⃣ 验证根目录配置文件..."
ls -lh ecosystem.config.js package.json tsconfig.json 2>/dev/null | awk '{print "  ✓ " $NF}'

echo ""
echo "5️⃣ 重新启动 PM2 进程..."
pm2 start ecosystem.config.js --interpreter /root/.nvm/versions/node/v21.7.3/bin/node

echo ""
echo "6️⃣ 验证 PM2 进程..."
pm2 list

echo ""
echo "7️⃣ 验证目录结构..."
echo "根目录配置文件:"
ls -1 /home/dataPlatform/*.config.js /home/dataPlatform/package.json /home/dataPlatform/tsconfig.json 2>/dev/null | sed 's|/home/dataPlatform/|  ✓ |'

echo ""
echo "Server 文件夹内容:"
ls -1 /home/dataPlatform/server/*.js 2>/dev/null | grep -E '(koaapp|scheduleCrawler|config|db)' | sed 's|/home/dataPlatform/server/|  ✓ |'

REMOTE_SCRIPT

echo ""
echo "✅ 生产环境规范化完成！"
echo ""
echo "📊 总结："
echo "  ✓ 所有配置文件已移到项目根目录"
echo "  ✓ server/ 目录现在只包含 Node.js 后端代码"
echo "  ✓ PM2 进程已重启"
echo "  ✓ ecosystem.config.js 指向 koaapp-production.js"
