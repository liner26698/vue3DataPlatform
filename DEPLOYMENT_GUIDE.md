# 📦 代码同步与部署指南

**最后更新**: 2025-11-27  
**环境**: 本地开发 → GitHub → 生产服务器 (8.166.130.216)

---

## 🎯 快速总结

| 场景               | 命令                             | 时间     |
| ------------------ | -------------------------------- | -------- |
| **后端代码修改**   | 见下方 [后端部署](#后端部署流程) | 2-3 分钟 |
| **前端代码修改**   | 见下方 [前端部署](#前端部署流程) | 3-5 分钟 |
| **同时修改前后端** | 见下方 [完整部署](#完整部署流程) | 5-8 分钟 |

---

## 📋 目录结构参考

```
本地:
/Users/xulin/.../vue3DataPlatform/
├── backend/              ← 后端代码
│   ├── koaapp-production.js
│   ├── scheduleCrawler.js
│   ├── routes/
│   ├── utils/
│   └── ...
├── frontend/             ← 前端代码
│   ├── main.ts
│   ├── views/
│   ├── components/
│   └── ...

生产:
/home/dataPlatform/
├── backend/              ← 同步自本地 backend/
├── frontend/
│   ├── dist/             ← 前端编译后的文件（Nginx 读取这里）
│   └── public/           ← 静态资源
└── ecosystem.config.js   ← PM2 进程配置
```

---

## 🔧 后端部署流程

### 场景：修改后端代码（routes、utils、scheduleCrawler 等）

#### 步骤 1：本地测试（可选但推荐）

```bash
# 在本地测试后端服务
npm run dev:backend
# 或者用 node 直接运行
node backend/koaapp-production.js
```

#### 步骤 2：提交到 Git

```bash
cd /Users/xulin/自己的gitHub和项目/liner26698/vue3DataPlatform

# 查看修改
git status

# 添加修改文件
git add backend/  # 只添加 backend 文件夹的修改
# 或者
git add .        # 添加所有修改

# 提交修改
git commit -m "feat: 修改功能描述"
# 例如: git commit -m "feat: 优化热门话题爬虫效率"

# 推送到 GitHub
git push origin main
```

#### 步骤 3：同步到生产环境

```bash
# 登录到生产服务器
ssh -p 443 root@8.166.130.216

# 进入项目目录
cd /home/dataPlatform

# 拉取最新代码
git pull origin main

# 重启后端服务
pm2 restart koa-server

# 查看重启状态
pm2 list
```

#### 步骤 4：验证

```bash
# 检查后端是否正常运行
curl -X POST http://8.166.130.216/statistics/getHotTopics
# 应该返回 HTTP 200 和数据

# 或查看日志
pm2 logs koa-server
```

---

## 🎨 前端部署流程

### 场景：修改前端代码（Vue 组件、页面、样式等）

#### 步骤 1：本地测试

```bash
# 运行开发服务器
npm run dev
# 访问 http://localhost:5173 测试修改
```

#### 步骤 2：提交到 Git

```bash
cd /Users/xulin/自己的gitHub和项目/liner26698/vue3DataPlatform

# 查看修改
git status

# 添加修改文件
git add frontend/  # 只添加 frontend 文件夹的修改
# 或者
git add .        # 添加所有修改

# 提交修改
git commit -m "feat: 修改功能描述"
# 例如: git commit -m "feat: 优化登录页面UI"

# 推送到 GitHub
git push origin main
```

#### 步骤 3：本地构建

```bash
# 在本地生成 dist 文件夹
npm run build

# 验证 dist 文件是否生成成功
ls -la dist/ | head -20
```

#### 步骤 4：上传到生产环境

```bash
# 打包本地 dist 文件夹
tar -czf dist.tar.gz dist/

# 上传到生产服务器
scp -P 443 dist.tar.gz root@8.166.130.216:/tmp/

# 登录到生产服务器
ssh -p 443 root@8.166.130.216

# 在服务器上执行以下命令
cd /home/dataPlatform/frontend/dist
rm -rf *                    # 删除旧文件
tar -xzf /tmp/dist.tar.gz  # 解压新文件
mv dist/* .                # 展平目录结构
rm -rf dist /tmp/dist.tar.gz

# 验证文件
ls -la | head -15
```

#### 步骤 5：验证

```bash
# 访问首页
curl -s http://8.166.130.216/ | head -20
# 应该返回 HTML 内容

# 访问登录页面
# 浏览器访问: http://8.166.130.216/#/login
```

**注意**: Nginx 已配置缓存，新版本可能需要 Ctrl+Shift+R 硬刷新浏览器缓存。

---

## 🚀 完整部署流程

### 场景：同时修改前后端代码

#### 步骤 1：本地测试（同时启动前后端）

```bash
# 终端 1：启动后端
npm run dev:backend

# 终端 2：启动前端
npm run dev

# 访问 http://localhost:5173 测试整个应用
```

#### 步骤 2：提交到 Git

```bash
cd /Users/xulin/自己的gitHP和项目/liner26698/vue3DataPlatform

git add .
git commit -m "feat: 新功能描述，涉及前后端修改"
git push origin main
```

#### 步骤 3：本地构建前端

```bash
npm run build
```

#### 步骤 4：上传两部分内容

**4.1 上传后端代码**

```bash
# 打包后端代码
tar -czf backend.tar.gz backend/

# 上传
scp -P 443 backend.tar.gz root@8.166.130.216:/tmp/
```

**4.2 上传前端编译文件**

```bash
# 打包前端 dist
tar -czf dist.tar.gz dist/

# 上传
scp -P 443 dist.tar.gz root@8.166.130.216:/tmp/
```

#### 步骤 5：在生产服务器上部署

```bash
ssh -p 443 root@8.166.130.216

# 更新后端
cd /home/dataPlatform
tar -xzf /tmp/backend.tar.gz
# backend 文件夹会被覆盖

# 更新前端
cd /home/dataPlatform/frontend/dist
rm -rf *
tar -xzf /tmp/dist.tar.gz
mv dist/* .
rm -rf dist

# 重启 PM2 进程
pm2 restart all

# 查看状态
pm2 list
```

#### 步骤 6：验证

```bash
# 后端 API
curl -X POST http://8.166.130.216/statistics/getHotTopics

# 前端页面
curl -s http://8.166.130.216/ | head -20
```

---

## 🔍 常见操作

### 查看后端日志

```bash
ssh -p 443 root@8.166.130.216
pm2 logs koa-server

# 查看特定错误
pm2 logs koa-server --err
```

### 查看前端是否正确加载

```bash
# 检查 dist 文件是否存在
ssh -p 443 root@8.166.130.216 "ls -la /home/dataPlatform/frontend/dist/ | head -15"

# 检查 index.html 是否存在
ssh -p 443 root@8.166.130.216 "file /home/dataPlatform/frontend/dist/index.html"
```

### 手动重启 Nginx

```bash
ssh -p 443 root@8.166.130.216
nginx -t              # 测试配置
systemctl reload nginx # 重新加载
```

### 查看实时请求日志（后端）

```bash
ssh -p 443 root@8.166.130.216
pm2 logs koa-server --lines 100
```

### 回滚到之前的版本

```bash
# 本地查看提交历史
git log --oneline | head -20

# 回到某个提交
git reset --hard <commit-hash>
git push origin main -f  # 强制推送（谨慎使用！）

# 在生产环境重新部署
ssh -p 443 root@8.166.130.216
cd /home/dataPlatform
git pull origin main
pm2 restart all
```

---

## ⚡ 快速脚本

### 一键部署后端

```bash
#!/bin/bash
# 保存为 deploy-backend.sh

cd /Users/xulin/自己的gitHub和项目/liner26698/vue3DataPlatform

echo "📝 提交代码..."
git add backend/
git commit -m "update: 后端代码更新"
git push origin main

echo "📤 同步到生产环境..."
ssh -p 443 root@8.166.130.216 << 'EOF'
cd /home/dataPlatform
git pull origin main
pm2 restart koa-server
pm2 list
EOF

echo "✅ 后端部署完成！"
```

### 一键部署前端

```bash
#!/bin/bash
# 保存为 deploy-frontend.sh

cd /Users/xulin/自己的gitHub和项目/liner26698/vue3DataPlatform

echo "📝 提交代码..."
git add frontend/
git commit -m "update: 前端代码更新"
git push origin main

echo "🔨 构建前端..."
npm run build

echo "📦 打包..."
tar -czf dist.tar.gz dist/

echo "📤 上传到服务器..."
scp -P 443 dist.tar.gz root@8.166.130.216:/tmp/

echo "🚀 部署到生产环境..."
ssh -p 443 root@8.166.130.216 << 'EOF'
cd /home/dataPlatform/frontend/dist
rm -rf *
tar -xzf /tmp/dist.tar.gz
mv dist/* .
rm -rf dist
ls -la | head -10
EOF

echo "✅ 前端部署完成！"
```

**使用方式**:

```bash
# 保存脚本
chmod +x deploy-backend.sh
chmod +x deploy-frontend.sh

# 运行
./deploy-backend.sh
./deploy-frontend.sh
```

---

## 📊 部署检查清单

部署前检查：

- [ ] 本地测试通过
- [ ] 代码已提交到 Git
- [ ] 代码已推送到 GitHub (`git push origin main`)

部署后验证：

- [ ] 后端：API 请求返回 HTTP 200
- [ ] 前端：首页加载正常 (`curl http://8.166.130.216/`)
- [ ] 日志：`pm2 logs` 中没有明显错误
- [ ] 浏览器：能访问 http://8.166.130.216/#/login

---

## 🆘 问题排查

### 问题：前端页面显示 404

**解决**:

```bash
# 检查 dist 文件是否存在
ssh -p 443 root@8.166.130.216 "ls -la /home/dataPlatform/frontend/dist/"

# 如果为空，需要重新上传 dist
# 参考 "前端部署流程" 的步骤 4
```

### 问题：后端 API 返回 404

**解决**:

```bash
# 检查 PM2 进程状态
ssh -p 443 root@8.166.130.216 "pm2 list"

# 查看错误日志
ssh -p 443 root@8.166.130.216 "pm2 logs koa-server --err"

# 手动重启
ssh -p 443 root@8.166.130.216 "pm2 restart koa-server"
```

### 问题：浏览器访问时缓存旧版本

**解决**:

```bash
# Nginx 缓存有效期是 31536000 秒（1 年）
# 浏览器硬刷新: Ctrl+Shift+R (Windows/Linux) 或 Cmd+Shift+R (Mac)
# 或清空浏览器缓存
```

---

## 📝 提交信息规范

```
feat:    新功能 (feature)
fix:     修复 bug
docs:    文档修改
style:   代码风格修改（不影响功能）
refactor: 代码重构
perf:    性能优化
test:    添加测试
chore:   构建工具、依赖更新等

示例：
git commit -m "feat: 添加热门话题爬虫"
git commit -m "fix: 修复登录验证 bug"
git commit -m "perf: 优化数据查询性能"
```

---

## 🔐 安全建议

1. **不要在代码中存储敏感信息**

   - 数据库密码、API Key 等存放在 `.env` 或环境变量中
   - 生产服务器上单独配置这些变量

2. **定期备份数据库**

   ```bash
   ssh -p 443 root@8.166.130.216
   # 备份数据库
   mysqldump -u root -p database_name > backup.sql
   ```

3. **监控 PM2 进程**

   ```bash
   ssh -p 443 root@8.166.130.216
   pm2 status
   pm2 monit  # 实时监控
   ```

4. **定期检查日志**
   ```bash
   ssh -p 443 root@8.166.130.216
   pm2 logs koa-server --lines 500 | grep "ERROR"
   ```

---

## 📞 技术栈版本

- Node.js: 14.x+
- Vue: 3.x
- TypeScript: 4.x+
- Koa: 2.x
- PM2: 最新版本
- Nginx: 1.14+

---

**最后提醒**: 每次部署前都要本地测试，确保代码无误后再推送到生产环境！
