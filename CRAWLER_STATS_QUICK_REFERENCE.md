# 🎯 爬虫统计模块 - 快速参考

## 📂 文件结构

```
src/views/crawlerStats/
├── index.vue                      # 📊 主仪表板（数据概览）
├── game/index.vue                 # 🎮 游戏爬虫（已存在）
├── hotTopics/index.vue            # 🔥 热门话题
├── aiTools/index.vue              # 🤖 AI工具
└── novels/index.vue               # 📚 小说数据
```

## 🔗 路由导航

| 页面 | 路由 | 说明 |
|------|------|------|
| 主仪表板 | `/crawler-stats/overview` | 所有爬虫类型汇总统计 |
| 游戏数据 | `/crawler-stats/game` | 游戏爬虫详细数据 |
| 热门话题 | `/crawler-stats/hot-topics` | 百度/微博/B站热搜 |
| AI工具 | `/crawler-stats/ai-tools` | AI工具库统计 |
| 小说数据 | `/crawler-stats/novels` | 小说库统计 |

## 🎨 模块功能速览

### 📊 主仪表板 (index.vue)
```typescript
✨ 4个KPI卡片
  - 总数据量
  - 平均成功率
  - 活跃爬虫数
  - 日均更新频率

📈 2个图表
  - 饼图：爬虫分布
  - 折线图：7天趋势

📋 详细表格
  - 所有爬虫统计信息
```

### 🔥 热门话题 (hotTopics/index.vue)
```typescript
🔍 筛选
  - 平台选择（百度/微博/B站）
  - 排序（热度/更新时间）
  - 关键词搜索

🏆 排行展示
  - 动画排名徽章
  - 热度可视化
  - 标签分类

📑 分页
  - 12/24/36/48条选择
```

### 🤖 AI工具 (aiTools/index.vue)
```typescript
📂 分类
  - 生产力工具
  - 创意工具
  - 开发工具
  - 学习工具

📊 统计卡片
  - 工具总数
  - 平均评分
  - 用户数
  - 热门工具数

💾 工具卡片
  - 评分显示
  - 特性标签
  - 用户统计
```

### 📚 小说数据 (novels/index.vue)
```typescript
📖 分类
  - 悬疑推理
  - 言情恋爱
  - 奇幻冒险
  - 都市生活

📊 统计盒子
  - 总数/已完成/连载中
  - 平均章节数

📈 卡片内容
  - 书籍封面+状态
  - 作者、描述、标签
  - 更新进度条
```

## 🚀 快速开发

### 添加新爬虫类型

1. **创建新组件**
```bash
# 在 src/views/crawlerStats/ 下创建新文件夹
mkdir src/views/crawlerStats/newSpider
touch src/views/crawlerStats/newSpider/index.vue
```

2. **复制基础模板**
```vue
<template>
  <div class="crawler-newSpider-container">
    <!-- 筛选卡片 -->
    <!-- 统计卡片 -->
    <!-- 数据展示 -->
    <!-- 分页 -->
  </div>
</template>

<script setup lang="ts" name="crawlerNewSpider">
// 同上
</script>

<style lang="scss" scoped>
// 样式
</style>
```

3. **更新路由配置** (`src/routers/modules/crawlerStats.ts`)
```typescript
{
  path: "/crawler-stats/new-spider",
  name: "crawlerStatsNewSpider",
  component: () => import("@/views/crawlerStats/newSpider/index.vue"),
  meta: {
    keepAlive: true,
    requiresAuth: true,
    title: "新爬虫统计",
    key: "newSpiderStats"
  }
}
```

### 集成API

1. **创建API接口** (`src/api/modules/statistics.ts`)
```typescript
export const getStatisticsApi = {
  getNewSpiderData: (params) =>
    http.get("/statistics/getNewSpider", { params })
};
```

2. **在组件中使用**
```typescript
import { getStatisticsApi } from "@/api/modules/statistics";

const loadData = async () => {
  try {
    const res = await getStatisticsApi.getNewSpiderData({
      page: currentPage.value,
      pageSize: pageSize.value
    });
    allData.value = res.items;
    totalCount.value = res.total;
  } catch (error) {
    console.error("加载数据失败", error);
  }
};

onMounted(() => {
  loadData();
});
```

## 🎨 样式快速参考

### 常用渐变色
```scss
// 紫色渐变
$gradient-purple: linear-gradient(135deg, #667eea, #764ba2);

// 粉色渐变
$gradient-pink: linear-gradient(135deg, #f093fb, #f5576c);

// 青色渐变
$gradient-cyan: linear-gradient(135deg, #4facfe, #00f2fe);

// 绿色渐变
$gradient-green: linear-gradient(135deg, #43e97b, #38f9d7);
```

### 常用动画
```scss
// 进入动画
@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 应用到元素
animation: cardEnter 0.6s ease-out;
```

### 响应式网格
```scss
// 基础网格
display: grid;
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
gap: 20px;

// 手机适配
@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

## 📊 常用数据处理

### 格式化数字
```typescript
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// 使用
{{ formatNumber(1500000) }}  // 输出: 1.5M
{{ formatNumber(5000) }}     // 输出: 5K
```

### 分页计算
```typescript
const pageSize = ref(12);
const currentPage = ref(1);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredData.value.slice(start, start + pageSize.value);
});
```

### 搜索过滤
```typescript
const searchKeyword = ref("");

const filteredData = computed(() => {
  const keyword = searchKeyword.value.toLowerCase();
  return data.filter(item =>
    item.title.toLowerCase().includes(keyword) ||
    item.description.toLowerCase().includes(keyword)
  );
});
```

### 排序
```typescript
const sortBy = ref("popularity_desc");

const sortedData = computed(() => {
  let result = [...data];
  if (sortBy.value === "popularity_desc") {
    result.sort((a, b) => b.popularity - a.popularity);
  } else if (sortBy.value === "rating_desc") {
    result.sort((a, b) => b.rating - a.rating);
  }
  return result;
});
```

## 🔧 常见操作

### 刷新数据
```typescript
const refreshData = async () => {
  ElMessage.loading("正在加载...");
  await loadData();
  ElMessage.success("刷新成功");
};
```

### 平滑滚动
```typescript
const handlePageChange = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};
```

### 打开外部链接
```typescript
const openUrl = (url: string) => {
  window.open(url, "_blank");
};
```

### 复制到剪贴板
```typescript
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("复制成功");
  } catch (error) {
    ElMessage.error("复制失败");
  }
};
```

## 🧪 验证检查清单

- [ ] 所有组件都能正常加载
- [ ] 动画流畅无卡顿
- [ ] 分页功能正确
- [ ] 搜索过滤有效
- [ ] 排序结果正确
- [ ] 响应式布局正常
- [ ] 图表显示完整
- [ ] 没有控制台错误

## 📞 获取帮助

- 查看完整文档: `CRAWLER_STATS_IMPLEMENTATION.md`
- 参考现有代码: `/src/views/crawlerStats/`
- 检查路由配置: `/src/routers/modules/crawlerStats.ts`

---

**提示**: 使用Ctrl+F快速搜索本文档中的内容！
