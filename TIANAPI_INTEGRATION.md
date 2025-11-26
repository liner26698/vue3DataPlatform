# 天行数据 API 集成方案

## 概述

你提供的是**天行数据**的抖音热搜 API，这是一个付费的数据服务。

## 接口信息

| 项目 | 内容 |
|------|------|
| **API 地址** | https://apis.tianapi.com/douyinhot/index |
| **请求方式** | GET / POST |
| **返回格式** | UTF-8 JSON |
| **文档** | https://www.tianapi.com/apilist |

## 使用方式

### 基础调用

```bash
curl https://apis.tianapi.com/douyinhot/index?key=你的APIKEY
```

### 返回格式（成功）

```json
{
  "code": 0,
  "msg": "成功",
  "data": [
    {
      "positionName": "1",
      "title": "热搜标题",
      "heat": "热度值",
      "status": 1,
      "url": "跳转链接"
    }
  ]
}
```

### 返回格式（失败）

```json
{
  "code": 230,
  "msg": "key错误或为空"
}
```

## 当前实现情况

### ✅ 已集成的平台

1. **百度热搜** - Axios + Cheerio 爬虫 ✅ 获取 20 条
2. **微博热搜** - Puppeteer + Cheerio ✅ 获取 15 条
3. **B站热门** - Axios + Cheerio ✅ 获取 15 条
4. **抖音热点** - 缓存 + 兜底 ⚠️ 获取 2 条

### ❌ 无法实现的平台

- **知乎热榜** - 返回 ZSE_CK 加密数据，即使 Puppeteer 也被检测为自动化
  - 原因：极强反爬虫，需要代理或 VPN
  - 方案：使用云爬虫服务（如 ScraperAPI）或放弃

## 升级方案

### 方案 A：使用天行数据 API（推荐）

如果你有 API Key，可以这样集成：

```javascript
async function crawlDouyinAPI(apiKey) {
  try {
    const response = await axios.get('https://apis.tianapi.com/douyinhot/index', {
      params: { key: apiKey },
      timeout: 10000
    });
    
    if (response.data.code === 0 && response.data.data) {
      return response.data.data.map((item, idx) => ({
        platform: "douyin",
        rank: idx + 1,
        title: item.title,
        heat: parseInt(item.heat) || (100 - idx) * 80000,
        category: "热点",
        trend: "stable",
        tags: ["抖音", "热点"],
        url: item.url || "https://www.douyin.com",
        description: item.title,
        is_active: 1
      }));
    }
  } catch (error) {
    console.error("API 调用失败:", error.message);
  }
  return [];
}
```

**优点**：
- 数据准确度高
- 更新实时
- 不需要浏览器自动化

**缺点**：
- 需要付费
- 需要有效的 API Key

### 方案 B：使用爬虫 + 缓存（当前方案）

**优点**：
- 完全免费
- 独立自主

**缺点**：
- 反爬虫限制
- 数据更新不稳定
- 需要 Puppeteer（消耗资源）

## 获取 API Key 步骤

1. 访问 [天行数据官网](https://www.tianapi.com/)
2. 注册账号
3. 实名认证
4. 查看 [API 列表](https://www.tianapi.com/apilist)
5. 选择"抖音热搜"API
6. 复制 API Key
7. 在环境变量中设置：`TIANAPI_KEY=你的key`

## 成本估算

| 套餐 | 价格 | 包含请求数 |
|------|------|----------|
| 试用 | 免费 | 100/天 |
| 基础 | ¥99/月 | 3000 |
| 高级 | ¥299/月 | 10000 |

## 文件修改记录

- `/server/utils/hotTopicsSpider.js` - 抖音爬虫改进
- 添加缓存机制 - 6 小时有效期
- 添加 API 备用方案

## 总结

| 场景 | 推荐方案 |
|------|--------|
| **没有 API Key** | 继续使用爬虫 + 缓存 |
| **有 API Key** | 使用天行数据 API（更稳定）|
| **需要高质量数据** | 整合多个数据源 |
| **需要低成本** | 爬虫方案 |

---

**更新时间**: 2025年11月26日  
**版本**: 1.0
