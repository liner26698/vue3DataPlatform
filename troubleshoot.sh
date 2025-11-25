#!/bin/bash

echo "========== 故障排查脚本 =========="

echo "1. 查看占用 3001 的进程..."
lsof -i :3001 2>/dev/null || netstat -tlnp 2>/dev/null | grep 3001

echo ""
echo "2. 查看 PM2 状态..."
pm2 status

echo ""
echo "3. 杀掉占用的进程..."
killall -9 node 2>/dev/null && echo "✓ 已杀死所有 node 进程"

echo ""
echo "4. 重启 PM2..."
pm2 kill
sleep 1

echo ""
echo "5. 启动应用..."
cd /home/dataPlatform/server
pm2 start koaapp.js --name koa-server

sleep 2

echo ""
echo "6. 检查状态..."
pm2 status

echo ""
echo "7. 查看应用日志..."
pm2 logs koa-server --lines 20 --nostream
