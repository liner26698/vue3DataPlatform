# Nginx配置问题排查与解决方案

## 问题描述
创建了新的test项目 `47.110.66.121/styg`，但访问该路径时仍然跳转到大屏项目。

## 问题根因分析

### 原始错误配置
```nginx
location /styg {
    root /home/test/dist;
    try_files $uri $uri/ /index.html;
    index  index.html index.htm;
}
```

### 问题所在

1. **路径拼接错误**：
   - 使用 `root` 时，nginx会将location路径拼接到root路径后面
   - 访问 `/styg` → 实际查找 `/home/test/dist/styg/`（不存在）
   - 实际文件在 `/home/test/dist/lp/`

2. **try_files回退陷阱**：
   ```nginx
   try_files $uri $uri/ /index.html;
   ```
   - 找不到 `/home/test/dist/styg/` 时，回退到 `/index.html`
   - 这个 `/index.html` 被 `location /` 捕获
   - 返回大屏项目的 `/home/dataPlatform/frontend/dist/index.html`

3. **location优先级问题**：
   - 更精确的 `location /styg` 应该先匹配
   - 但由于try_files回退，最终还是进入了 `location /`

## 解决方案

### 方案对比

#### ❌ 错误方案（使用root）
```nginx
location /styg {
    root /home/test/dist;  # 错误！
    # 访问 /styg → 查找 /home/test/dist/styg/
}
```

#### ✅ 正确方案（使用alias）
```nginx
location /styg/ {
    alias /home/test/dist/lp/;  # 正确！
    # 访问 /styg/ → 查找 /home/test/dist/lp/
    try_files $uri $uri/ /styg/index.html;
}
```

### 完整修复配置

```nginx
# 1. 重定向不带斜杠到带斜杠（推荐做法）
location = /styg {
    return 301 /styg/;
}

# 2. 主配置（使用alias）
location /styg/ {
    alias /home/test/dist/lp/;
    try_files $uri $uri/ /styg/index.html;
    index index.html index.htm;
    
    # 禁用缓存，方便调试
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

## root vs alias 关键区别

### root指令
```nginx
location /styg/ {
    root /home/test/dist;
}
# 访问 /styg/index.html
# 实际路径: /home/test/dist/styg/index.html  （拼接location路径）
```

### alias指令
```nginx
location /styg/ {
    alias /home/test/dist/lp/;
}
# 访问 /styg/index.html
# 实际路径: /home/test/dist/lp/index.html  （替换location路径）
```

**记忆口诀**：
- **root = 拼接路径**（追加）
- **alias = 替换路径**（替代）

## 测试验证

### 测试1: 不带斜杠访问（自动重定向）
```bash
$ curl -I http://47.110.66.121/styg
HTTP/1.1 301 Moved Permanently
Location: http://47.110.66.121/styg/
```

### 测试2: 带斜杠访问（返回test项目）
```bash
$ curl -s http://47.110.66.121/styg/ | grep '<title>'
<title>深圳生态环境监测中心遥感监测服务</title>  ✅ 正确
```

### 测试3: 根路径访问（返回大屏项目）
```bash
$ curl -s http://47.110.66.121/ | grep '<title>'
<title>数据平台管理系统</title>  ✅ 正确
```

## 常见陷阱总结

### 陷阱1: try_files回退问题
```nginx
# 错误示例
location /styg {
    root /wrong/path;
    try_files $uri $uri/ /index.html;  # ⚠️ 会回退到根项目
}

# 正确示例
location /styg/ {
    alias /correct/path/;
    try_files $uri $uri/ /styg/index.html;  # ✅ 明确指定回退路径
}
```

### 陷阱2: 末尾斜杠问题
```nginx
# 推荐：明确区分有无斜杠
location = /styg {    # 精确匹配 /styg
    return 301 /styg/;
}

location /styg/ {     # 匹配 /styg/ 及其子路径
    alias /path/;
}
```

### 陷阱3: alias末尾必须有斜杠
```nginx
# ❌ 错误
location /styg/ {
    alias /home/test/dist/lp;  # 缺少末尾斜杠
}

# ✅ 正确
location /styg/ {
    alias /home/test/dist/lp/;  # 末尾必须有斜杠
}
```

## 配置文件位置

```bash
# nginx主配置
/etc/nginx/nginx.conf

# 备份配置（自动创建）
/etc/nginx/nginx.conf.backup.20251219_103000

# 测试配置语法
nginx -t

# 重载配置（不中断服务）
systemctl reload nginx

# 查看nginx状态
systemctl status nginx
```

## 目录结构

```
服务器目录结构:
/home/
├── dataPlatform/           # 大屏项目
│   └── frontend/dist/
│       └── index.html      # 数据平台管理系统
│
└── test/                   # 测试项目
    └── dist/
        └── lp/
            └── index.html  # 深圳生态环境监测中心遥感监测服务

访问路径映射:
http://47.110.66.121/       → /home/dataPlatform/frontend/dist/
http://47.110.66.121/styg/  → /home/test/dist/lp/
```

## 调试技巧

### 1. 查看nginx错误日志
```bash
tail -f /var/log/nginx/error.log
```

### 2. 查看访问日志
```bash
tail -f /var/log/nginx/access.log
```

### 3. 测试特定文件访问
```bash
# 测试静态文件
curl -I http://47.110.66.121/styg/favicon.ico

# 测试JS文件
curl -I http://47.110.66.121/styg/static/js/app.js
```

### 4. 检查文件权限
```bash
# 确保nginx有读取权限
ls -la /home/test/dist/lp/
```

## 最佳实践建议

1. **使用alias而非root**：当location路径和实际文件路径不一致时
2. **明确指定try_files回退路径**：避免被其他location捕获
3. **添加斜杠重定向**：统一URL格式，避免404
4. **开发环境禁用缓存**：方便调试
5. **备份配置文件**：修改前务必备份
6. **测试后再重载**：使用 `nginx -t` 验证语法

---

**问题解决时间**: 2025年12月19日  
**状态**: ✅ 已解决  
**验证**: 三个测试全部通过
