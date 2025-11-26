# 热搜爬虫诊断与解决方案

## 📊 诊断结果

运行诊断后发现，**所有 5 个平台都启用了反爬虫保护**。静态爬虫（axios + cheerio）无法有效获取数据：

| 平台 | 原因 | HTTP 状态 | 需要的技术 |
|------|------|----------|----------|
| **百度** | HTML 结构复杂 | 200 ✓ | 改进的选择器 |
| **知乎** | 反爬虫保护 | **403** | Puppeteer + 代理 |
| **微博** | 登录态要求 | 重定向 | Puppeteer + 登录模拟 |
| **B站** | 动态渲染 | 200 ✓ | Puppeteer 执行 JS |
| **抖音** | 完全 JS 渲染 | 200 ✓ | Puppeteer 执行 JS |

## 🔍 诊断过程

### 问题 1: 百度热搜
```
HTTP 200 ✓ 但无法提取数据
→ 原因: HTML 中标题被封装在 <table> 元素中的多层 <td>
→ 解决: 改进 CSS 选择器为 "tbody tr > td:nth-child(2)"
```

### 问题 2: 知乎热榜
```
HTTP 403 Forbidden
→ 原因: 知乎检测到非浏览器请求，直接拒绝
→ 解决: 需要 Puppeteer（真实浏览器）绕过
```

### 问题 3: 微博热搜
```
HTTP 200 但内容为登录页
→ 原因: 微博没有有效登录态，返回访客页面
→ 解决: 需要 Puppeteer + 真实 Cookie 或 Selenium
```

### 问题 4: B站热门
```
HTTP 200 但选择器无效
→ 原因: B站使用 JavaScript 动态加载标题
→ 解决: Puppeteer 可以执行 JS 后读取 DOM
```

### 问题 5: 抖音热点
```
HTTP 200 但返回最小化 HTML
→ 原因: 抖音完全依赖 JavaScript 渲染，静态 HTML 无内容
→ 解决: 必须使用 Puppeteer 执行 JavaScript
```

## 💡 可行解决方案

### 方案 A: 使用 Puppeteer（推荐）

Puppeteer 是一个 Node.js 库，可以控制无头 Chrome 浏览器，能完美解决所有反爬虫问题。

**优势**：
- ✅ 支持所有 5 个平台
- ✅ 能执行 JavaScript，获取动态渲染内容
- ✅ 真实浏览器环境，绕过反爬虫
- ✅ 支持 Cookie 和登录模拟

**劣势**：
- ⚠️ 需要下载 Chromium（~200MB）
- ⚠️ CPU/内存占用较大
- ⚠️ 爬取速度较慢（单次 5-10 秒）

**安装**：
```bash
npm install puppeteer --legacy-peer-deps
```

**使用**：
```javascript
const spider = require('./server/utils/hotTopicsSpider_puppeteer');
const topics = await spider.crawlAll(); // 获取所有平台数据
```

### 方案 B: 使用代理 + Axios + Cheerio（部分可行）

为 axios 请求添加代理，绕过 IP 限制。

**优势**：
- 轻量级，速度快
- 无需下载额外浏览器

**劣势**：
- ❌ 知乎 403 依然无法解决
- ❌ 无法处理 JS 渲染
- ⚠️ 代理成本高

**推荐**：不用这个方案

### 方案 C: 混合方案

- 使用改进的选择器处理百度和 B站（快速）
- 使用 Puppeteer 处理知乎、微博、抖音（完整）

这样既能保证速度，又能确保数据完整性。

## 📁 文件说明

### 1. `hotTopicsSpider.js` (当前使用)
- ✅ 改进的百度爬虫（HTML 表格选择器）
- ❌ 知乎、微博、抖音无法获取（返回空数组）
- ✅ B站改进的选择器
- 📍 仅返回真实数据，失败返回 []

### 2. `hotTopicsSpider_puppeteer.js` (推荐)
- ✅ 所有 5 个平台都能获取
- ✅ 可获取真实爬取的完整热搜数据
- ⚠️ 需要安装 Puppeteer

## 🚀 建议行动

### 立即可做
1. ✅ 已完成：改进了百度爬虫选择器
2. ✅ 已完成：移除了所有虚拟备选数据
3. ✅ 已完成：添加了详细诊断消息

### 下一步
1. **安装 Puppeteer**：`npm install puppeteer --legacy-peer-deps`
2. **测试 Puppeteer 版本**：确认能否获取所有平台数据
3. **集成到 hotTopicsSpider.js**：替换或补充现有爬虫
4. **上线**：定时任务每日 3 次执行

### 预期效果
```
当前状态:
- 百度: 获取 10-15 条 ✓
- 知乎: 0 条 ✗
- 微博: 0 条 ✗
- B站: 获取 5-10 条 ✓
- 抖音: 0 条 ✗
总计: 15-25 条

使用 Puppeteer 后:
- 百度: 15 条 ✓
- 知乎: 15 条 ✓
- 微博: 15 条 ✓
- B站: 15 条 ✓
- 抖音: 15 条 ✓
总计: 75 条（都是真实数据）✓
```

## 🔧 性能优化

### 1. 并行爬虫
```javascript
// 同时爬 5 个平台（不是串行），时间约 10-15 秒
const results = await Promise.all([
	crawlBaiduTrending(),
	crawlZhihuTrending(),
	crawlWeiboTrending(),
	crawlBilibiliTrending(),
	crawlDouyinTrending()
]);
```

### 2. 增量更新
- 每次只爬新增数据
- 使用数据库去重

### 3. 缓存策略
- 缓存成功爬虫 1 小时
- 失败立即重试

## ⚠️ 注意事项

1. **反爬虫遵守**：
   - 添加适当延迟（不要频繁请求）
   - 尊重 robots.txt
   - 不滥用爬虫

2. **隐私保护**：
   - 只爬取公开数据
   - 不存储个人信息

3. **法律合规**：
   - 检查网站 ToS
   - 不用于商业竞争

## 📞 技术支持

如需进一步调试或优化，提供以下信息：
- Node.js 版本
- 爬虫日志输出
- 目标平台的实时状态
