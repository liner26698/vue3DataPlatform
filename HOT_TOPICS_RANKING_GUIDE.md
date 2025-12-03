# 🔥 热门话题排行模块使用指南

## 📋 项目概述

"热门话题排行"是数据平台的核心展示模块，位于屏幕中央。它提供了三种炫彩显示模式，支持虚拟数据和真实 API 数据。

---

## 🎨 三种显示模式

### 1️⃣ **流动列表模式** （📋 流动列表）

- **特点**：经典排行榜风格，展示排名、热度、趋势等详细信息
- **适用场景**：需要快速浏览热门话题详情的用户
- **显示元素**：
  - 排名编号 + 奖牌图标（Top 3）
  - 话题标题、热度、变化趋势
  - 话题描述、来源、标签
  - 讨论/分享/参与数据卡
  - 热度进度条

### 2️⃣ **网格卡片模式** （📦 网格卡片）

- **特点**：可视化卡片布局，突出热度和趋势，3×3 网格显示
- **适用场景**：快速对比多个话题的热度和参与度
- **显示元素**：
  - 排名徽章（圆形，带热度颜色）
  - 热度条（顶部，渐变色）
  - 主要数据块（热度 + 变化趋势）
  - 迷你趋势图（SVG Sparkline）
  - 来源和参与人数徽章

### 3️⃣ **对比分析模式** （📊 对比分析）

- **特点**：多维度数据分析，深度洞察热门话题生态
- **适用场景**：数据分析师、管理员查看详细统计
- **显示元素**：
  - TOP 3 排名卡片
  - 三个并行对比图表：
    - 📊 热度对比（按热度排序）
    - 👥 参与度对比（按参与人数排序）
    - 🔗 分享热度对比（按分享数排序）
  - 统计概览（4 个总数卡片）

---

## 📊 数据结构

### Topic 接口定义

```typescript
interface Topic {
	id: number; // 唯一标识
	title: string; // 话题标题
	hotValue: number; // 热度值（0-100000+）
	trend: number; // 变化趋势（百分比，-100 to +100）
	source: string; // 数据来源（微博热搜、抖音热点等）
	description: string; // 话题描述
	discussions: number; // 讨论数
	shares: number; // 分享数
	participants: number; // 参与人数
	tags: string[]; // 话题标签
	color: string; // 主题色（十六进制）
	colorLight: string; // 亮色变体
	sparkline: number[]; // 趋势数据（用于迷你图表）
}
```

---

## 🔄 切换真实数据集成步骤

### Step 1: 创建 API 接口

在 `frontend/api/dataScreen/index.ts` 中添加：

```typescript
/**
 * 获取热门话题排行数据
 */
export const getHotTopicsRankingApi = () => {
	return request.get("/hotTopics/ranking", {
		// 可选参数：
		// limit: 10,           // 返回记录数
		// timeRange: "24h",    // 时间范围：24h, 7d, 30d
		// source: "all"        // 数据来源过滤
	});
};
```

### Step 2: 修改组件获取数据

编辑 `HotTopicsRanking.vue` 的 `<script setup>` 部分：

```typescript
import { getHotTopicsRankingApi } from "@/api/dataScreen/index";

// 替换 mockTopics 的代码
const topics = ref<Topic[]>([]);
const loading = ref(false);

// 获取真实数据的函数
const fetchTopicsData = async () => {
	try {
		loading.value = true;
		const res = await getHotTopicsRankingApi();

		if (res.data && res.data.topics) {
			topics.value = res.data.topics.map((topic: any) => ({
				id: topic.id,
				title: topic.title,
				hotValue: topic.hot_value || topic.hotValue,
				trend: topic.trend || 0,
				source: topic.source || "未知",
				description: topic.description || "",
				discussions: topic.discussions || 0,
				shares: topic.shares || 0,
				participants: topic.participants || 0,
				tags: topic.tags ? topic.tags.split(",") : [],
				color: getRandomColor(), // 或从数据库读取
				colorLight: getLightColor(), // 或从数据库读取
				sparkline: generateSparkline() // 或从数据库读取趋势数据
			}));
		}
	} catch (error) {
		console.error("获取热门话题数据失败:", error);
		// 降级到虚拟数据
		topics.value = mockTopics();
	} finally {
		loading.value = false;
	}
};

// 在 onMounted 中调用
onMounted(() => {
	fetchTopicsData();
	// 定期刷新（每5分钟）
	setInterval(fetchTopicsData, 5 * 60 * 1000);
});
```

### Step 3: 后端 API 实现示例（Node.js/Koa）

```javascript
// 在 backend/routes/index.js 中添加

router.get("/hotTopics/ranking", async ctx => {
	try {
		const { limit = 20, timeRange = "24h", source = "all" } = ctx.query;

		let query = "SELECT * FROM hot_topics WHERE 1=1";
		const params = [];

		// 时间范围过滤
		if (timeRange === "24h") {
			query += " AND create_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";
		} else if (timeRange === "7d") {
			query += " AND create_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
		}

		// 来源过滤
		if (source !== "all") {
			query += " AND source = ?";
			params.push(source);
		}

		// 按热度排序
		query += " ORDER BY hot_value DESC LIMIT ?";
		params.push(parseInt(limit));

		const topics = await db.query(query, params);

		// 计算趋势数据和其他字段
		const enrichedTopics = topics.map(topic => ({
			...topic,
			trend: calculateTrend(topic), // 计算变化趋势
			sparkline: getSparklineData(topic.id), // 获取趋势数据
			tags: topic.tags ? topic.tags.split(",") : []
		}));

		ctx.body = {
			code: 200,
			message: "成功",
			data: {
				topics: enrichedTopics,
				total: enrichedTopics.length,
				timestamp: new Date().toISOString()
			}
		};
	} catch (error) {
		ctx.body = {
			code: 500,
			message: "获取数据失败",
			error: error.message
		};
	}
});

// 计算趋势变化
function calculateTrend(topic) {
	// 对比前一小时/前一天的热度
	// 返回百分比变化
	return Math.floor(Math.random() * 200 - 100); // 示例：-100 ~ +100
}

// 获取趋势数据点（用于 Sparkline）
function getSparklineData(topicId) {
	// 获取过去24小时的热度数据点（10个）
	return [30, 45, 52, 48, 65, 72, 80, 88, 95, 98]; // 示例数据
}
```

### Step 4: 数据库 Schema 参考

```sql
CREATE TABLE hot_topics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,           -- 话题标题
  hot_value INT DEFAULT 0,               -- 热度值
  source VARCHAR(50),                    -- 来源（微博、抖音等）
  description TEXT,                      -- 话题描述
  discussions INT DEFAULT 0,             -- 讨论数
  shares INT DEFAULT 0,                  -- 分享数
  participants INT DEFAULT 0,            -- 参与人数
  tags VARCHAR(500),                     -- 标签（逗号分隔）
  create_time TIMESTAMP DEFAULT NOW(),
  update_time TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_hot_value (hot_value),
  INDEX idx_create_time (create_time)
);
```

---

## 🎯 功能亮点

### ✨ 动画效果

- **模式切换**：柔和的淡入淡出动画
- **列表项**：从左到右的滑入动画（错延迟）
- **卡片**：缩放 + 淡入动画（3×3 网格）
- **交互反馈**：Hover 时的发光和浮起效果

### 🎨 视觉设计

- **赛博朋克主题**：霓虹色、渐变、发光效果
- **响应式布局**：自适应容器大小
- **数据可视化**：进度条、趋势图、对比图表
- **色彩系统**：每个话题都有独特的配色方案

### 📈 性能优化

- **虚拟滚动**：大数据量下的流畅显示
- **按需加载**：图表和数据延迟加载
- **防抖处理**：模式切换时的性能优化

---

## 🚀 快速开始

### 使用虚拟数据（开发/演示）

组件默认使用虚拟数据，无需任何配置，直接就能看到效果。

### 切换到真实数据

1. 确保后端 API 已实现
2. 在组件中执行 Step 2 的修改
3. 热部署应自动重新加载

### 自定义数据

可以在 `mockTopics()` 函数中修改虚拟数据，或通过 Props 传入自定义数据：

```vue
<HotTopicsRanking :initialTopics="myCustomTopics" />
```

---

## 🔧 配置选项

在模块中的常量区域添加：

```typescript
// 显示配置
const CONFIG = {
	DISPLAY_MODE: "流动列表", // 默认显示模式
	AUTO_SWITCH_MODE: false, // 是否自动切换模式
	AUTO_SWITCH_INTERVAL: 30000, // 自动切换间隔（毫秒）
	ITEMS_PER_PAGE: {
		list: 10, // 流动列表显示数
		grid: 9, // 网格显示数（3×3）
		comparison: 5 // 对比分析显示数
	},
	ANIMATION_DURATION: 0.3, // 动画时长（秒）
	REFRESH_INTERVAL: 5 * 60 * 1000 // 数据刷新间隔
};
```

---

## 📱 适配建议

- **大屏幕（1920×1080）**：所有模式都能充分展示
- **平板（768×1024）**：推荐使用"流动列表"模式
- **手机**：可考虑添加响应式视图

---

## 🐛 常见问题

### Q: 数据更新不及时？

A: 检查 `fetchTopicsData()` 的刷新间隔，或手动调用该函数。

### Q: 模式切换卡顿？

A: 确保虚拟滚动已启用，减少每个模式的显示项数。

### Q: 颜色不匹配？

A: 修改 `getRandomColor()` 函数或从数据库读取颜色配置。

### Q: 趋势图不显示？

A: 确保 `sparkline` 数组有足够的数据点（推荐 10 个）。

---

## 📚 相关文件

- **组件**：`frontend/views/dataScreenInk/components/HotTopicsRanking.vue`
- **主页面**：`frontend/views/dataScreenInk/index.vue`
- **API**：`frontend/api/dataScreen/index.ts`
- **后端**：`backend/routes/index.js`
- **样式**：组件内嵌 SCSS

---

## 🎓 设计理念

这个模块打破了传统的数据展示方式，采用了：

1. **多模式设计**：满足不同用户的不同需求
2. **渐进式体验**：从简单列表到深度分析的层级递进
3. **视觉优先**：数据可视化是核心，不是表格
4. **交互友好**：每个操作都有视觉反馈
5. **可扩展性**：支持自定义模式和数据源

---

**完成时间**：2025-11-28  
**模块状态**：✅ 完成（虚拟数据）| 🔄 等待真实数据集成

---
