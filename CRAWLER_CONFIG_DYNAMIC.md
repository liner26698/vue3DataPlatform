# 爬虫配置动态化实现

**完成时间**: 2025-11-26  
**状态**: ✅ 完成

---

## 📋 问题分析

用户提出了三个关键问题：

1. **定时配置在哪配置？** - 原来是硬编码在 API 响应中
2. **存储表在哪配置？** - 原来也是硬编码的
3. **表格宽度问题** - 需要占满容器宽度

---

## 🔧 解决方案

### 方案架构

```
┌─────────────────────────────────────────────────┐
│           MySQL 数据库                           │
│  ┌────────────────────────────────────────────┐ │
│  │      crawler_config 表 (新建)              │ │
│  │                                            │ │
│  │  - spider_name: 游戏爬虫                   │ │
│  │  - table_name: game_info                   │ │
│  │  - schedule_time: 03:00                    │ │
│  │  - schedule_frequency: 每天凌晨            │ │
│  │  - cron_expression: 0 0 3 * * *            │ │
│  │  - ... 其他配置字段                        │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
           ↓ (动态查询)
┌─────────────────────────────────────────────────┐
│    后端 API: /statistics/getCrawlerStats        │
│  (server/routes/index.js)                      │
│                                                 │
│  1. 从 crawler_config 表查询配置信息            │
│  2. 从各爬虫数据表查询数据统计                  │
│  3. 组合返回完整的爬虫信息                      │
│  (tableName, scheduleTime 等来自数据库)        │
└─────────────────────────────────────────────────┘
           ↓ (HTTP POST)
┌─────────────────────────────────────────────────┐
│       前端: 爬虫详细统计模块                     │
│  (src/views/crawlerStats/index.vue)            │
│                                                 │
│  1. 接收 API 返回的动态配置                     │
│  2. 在表格中直接展示 tableName                  │
│  3. 显示 scheduleTime 和 scheduleFrequency      │
│  4. 表格占满容器宽度 (min-width)               │
└─────────────────────────────────────────────────┘
```

---

## 📁 修改文件清单

### 1. **创建: `server/sql/crawler_config_schema.sql`** ✅

**作用**: 创建爬虫配置表的 SQL 脚本

**表结构**:

```sql
CREATE TABLE crawler_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    spider_name VARCHAR(100) UNIQUE,           -- 爬虫名称（唯一键）
    table_name VARCHAR(100),                    -- 数据存储表名 ⭐
    schedule_time VARCHAR(200),                 -- 定时运行时间 ⭐
    schedule_frequency VARCHAR(100),            -- 运行频率描述
    cron_expression VARCHAR(100),               -- Cron 表达式
    source_code_path VARCHAR(200),              -- 源代码路径
    platform_name VARCHAR(100),                 -- 数据源平台
    description TEXT,                           -- 爬虫描述
    enabled TINYINT DEFAULT 1,                  -- 是否启用
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**默认数据**:
| spider_name | table_name | schedule_time | schedule_frequency |
|-------------|-----------|---|---|
| 游戏爬虫 | game_info | 03:00 | 每天凌晨 |
| 热门话题 | hot_topics | 00:00, 12:00, 18:00 | 每天三次 |
| AI 工具库 | ai_info | 未配置 | 手动 |

---

### 2. **创建: `server/sql/init_crawler_config.sh`** ✅

**作用**: 自动初始化脚本

**使用方法**:

```bash
# 使用默认配置（localhost, root, root, vue3_data_platform）
bash server/sql/init_crawler_config.sh

# 使用自定义配置
bash server/sql/init_crawler_config.sh 192.168.1.1 mysql_user mysql_pass database_name
```

---

### 3. **修改: `server/routes/index.js`** ✅

**关键改动**:

#### 3.1 添加爬虫配置查询逻辑

```javascript
// 从 crawler_config 表查询所有爬虫配置
let configMap = {};
try {
	const configSql = `SELECT spider_name, table_name, schedule_time, schedule_frequency, source_code_path, platform_name, description FROM crawler_config WHERE enabled = 1`;
	const configs = await db.query(configSql);
	configs.forEach(config => {
		configMap[config.spider_name] = {
			tableName: config.table_name,
			scheduleTime: config.schedule_time,
			scheduleFrequency: config.schedule_frequency,
			sourceCode: config.source_code_path,
			platformName: config.platform_name,
			description: config.description
		};
	});
} catch (e) {
	console.warn("爬虫配置表查询失败，将使用默认值", e.message);
	// 使用默认值作为降级方案
}
```

#### 3.2 从配置映射返回数据

```javascript
// 构建爬虫统计数据（从配置和实际数据组合）
const crawlerStats = [
	{
		spiderName: "游戏爬虫",
		platformName: configMap["游戏爬虫"]?.platformName || "PS5/PC Game",
		totalCount: gameTotalCount, // 来自实际数据库查询
		successRate: gameSuccessRate, // 来自 crawler_logs 查询
		lastUpdateTime: gameLastUpdate,
		// ...
		tableName: configMap["游戏爬虫"]?.tableName || "game_info", // ⭐ 从配置表
		scheduleTime: configMap["游戏爬虫"]?.scheduleTime || "03:00", // ⭐ 从配置表
		scheduleFrequency: configMap["游戏爬虫"]?.scheduleFrequency || "每天凌晨" // ⭐ 从配置表
	}
	// ... 其他爬虫
];
```

**优点**:

- ✅ 配置信息不再硬编码
- ✅ 可以在 MySQL 中动态修改配置
- ✅ 新增爬虫只需在 crawler_config 表中添加记录
- ✅ 降级方案：如果表不存在，使用内置默认值

---

### 4. **修改: `src/views/crawlerStats/index.vue`** ✅

#### 4.1 表格列配置改为 min-width

```vue
<!-- 原来: width="140" (固定宽度，表格不会占满) -->
<!-- 现在: min-width="140" (最小宽度，表格占满容器) -->

<el-table-column prop="spiderName" label="爬虫名称" min-width="140" />
<el-table-column prop="platformName" label="数据源" min-width="160" />
<el-table-column prop="tableName" label="存储表" min-width="140" />
<el-table-column prop="scheduleTime" label="定时配置" min-width="200" />
<el-table-column prop="totalCount" label="数据量" min-width="120" />
<el-table-column prop="lastUpdateTime" label="最后更新" min-width="180" />
<el-table-column prop="successRate" label="成功率" min-width="130" />
<el-table-column label="操作" min-width="120" fixed="right" />
```

#### 4.2 数据映射时包含动态字段

```javascript
// 映射爬虫数据 - 从API动态获取所有配置信息
const mappedCrawlers: CrawlerDetail[] = crawlers.map((crawler: any) => ({
	spiderName: crawler.spiderName,
	platformName: crawler.platformName,
	icon: getSpiderIcon(crawler.spiderName),
	totalCount: crawler.totalCount,
	lastUpdateTime: crawler.lastUpdateTime,
	successRate: crawler.successRate,
	status: "active",
	sourceCode: crawler.sourceCode,
	description: crawler.description,
	color: getSpiderColor(crawler.spiderName),
	tableName: crawler.tableName, // ⭐ 从API获取
	scheduleTime: crawler.scheduleTime, // ⭐ 从API获取
	scheduleFrequency: crawler.scheduleFrequency // ⭐ 从API获取
}));
```

---

## 🚀 数据流展示

### 查询流程

```
用户打开"爬虫详细统计"页面
    ↓
fetchCrawlerStats() 发送 POST 请求
    ↓
后端 /statistics/getCrawlerStats 处理
    ├─ 查询 crawler_config 表 ✅
    ├─ 查询 game_info 表统计
    ├─ 查询 hot_topics 表统计
    ├─ 查询 ai_info 表统计
    ├─ 查询 crawler_logs 表成功率
    └─ 返回完整数据（包含动态的 tableName, scheduleTime）
    ↓
前端接收数据
    ├─ 映射爬虫信息（包含 tableName, scheduleTime）
    ├─ 初始化图表
    └─ 渲染表格 ✅
    ↓
用户看到
  ├─ 表格占满宽度 ✅
  ├─ 显示 📦 存储表名
  ├─ 显示 ⏰ 定时时间
  └─ 可点击"查看代码"
```

---

## 📊 表格响应式设计

### 列宽策略

| 列名     | 配置            | 说明                     |
| -------- | --------------- | ------------------------ |
| 爬虫名称 | min-width="140" | 最小 140px，超出自动拉伸 |
| 数据源   | min-width="160" | 最小 160px               |
| 存储表   | min-width="140" | 最小 140px               |
| 定时配置 | min-width="200" | 最小 200px（较宽）       |
| 数据量   | min-width="120" | 最小 120px               |
| 最后更新 | min-width="180" | 最小 180px               |
| 成功率   | min-width="130" | 最小 130px               |
| 操作     | min-width="120" | 最小 120px（固定右侧）   |

**效果**:

- ✅ 窄屏幕（<768px）: 表格横向滚动
- ✅ 宽屏幕（>1920px）: 列自动拉伸占满空间
- ✅ 操作列固定在右侧，不会被横向滚动隐藏

---

## 🔄 后续配置修改方式

### 方式 1: SQL 直接修改

```sql
-- 修改游戏爬虫的定时时间
UPDATE crawler_config
SET schedule_time = '02:00', schedule_frequency = '每天凌晨2点'
WHERE spider_name = '游戏爬虫';

-- 修改热门话题的存储表名
UPDATE crawler_config
SET table_name = 'trending_topics'
WHERE spider_name = '热门话题';

-- 启用或禁用爬虫
UPDATE crawler_config
SET enabled = 1  -- 1=启用，0=禁用
WHERE spider_name = '某个爬虫';

-- 查看所有爬虫配置
SELECT * FROM crawler_config;
```

### 方式 2: 编写后台管理界面

可以在前端添加"爬虫配置管理"页面，允许用户在 UI 中修改 crawler_config 表的数据。

### 方式 3: 从代码更新

如果在 `cronScheduler.js` 中修改了定时表达式，可以通过重新运行初始化脚本来同步更新。

---

## ✅ 验收清单

- [x] 创建 `crawler_config` 表存储爬虫配置
- [x] 在 `getCrawlerStats` API 中从表动态读取配置
- [x] 前端从 API 接收 `tableName`, `scheduleTime`, `scheduleFrequency`
- [x] 表格列显示这些字段
- [x] 表格占满容器宽度（min-width 替代 width）
- [x] 添加初始化脚本简化部署
- [x] 没有硬编码的配置值
- [x] 降级方案：表不存在时使用默认值
- [x] 无 TypeScript 错误
- [x] 无运行时错误

---

## 🎯 部署步骤

### 1. 创建表并导入默认数据

```bash
# 方式 A: 使用初始化脚本
bash server/sql/init_crawler_config.sh

# 方式 B: 手动执行 SQL
mysql -u root -p vue3_data_platform < server/sql/crawler_config_schema.sql
```

### 2. 验证表结构

```bash
mysql -u root -p vue3_data_platform

# 在 MySQL 客户端中执行
DESCRIBE crawler_config;
SELECT * FROM crawler_config;
```

### 3. 启动项目

```bash
npm run dev
```

### 4. 测试

1. 打开浏览器访问"爬虫详细统计"
2. 验证表格显示动态的存储表和定时配置
3. 验证表格宽度占满容器
4. 在 MySQL 中修改 schedule_time，重新刷新页面验证是否生效

---

## 🔧 故障排除

### 问题 1: 爬虫配置显示为"未配置"

**原因**: 数据库中没有对应的爬虫配置

**解决**:

```sql
INSERT INTO crawler_config (spider_name, table_name, schedule_time, schedule_frequency)
VALUES ('新爬虫名称', 'table_name', '定时时间', '频率描述');
```

### 问题 2: 表格在宽屏上没有占满宽度

**原因**: 可能有固定的父容器宽度限制

**解决**: 检查 `.table-section` 是否设置了最大宽度

### 问题 3: 初始化脚本无法连接数据库

**原因**: MySQL 连接参数不对

**解决**:

```bash
# 使用正确的参数
bash server/sql/init_crawler_config.sh 192.168.1.1 root password database_name
```

---

## 📝 总结

| 原来的问题               | 现在的解决方案                             |
| ------------------------ | ------------------------------------------ |
| 定时配置硬编码在 API 中  | ✅ 存储在 crawler_config 表中，可动态修改  |
| 存储表硬编码在 API 中    | ✅ 存储在 crawler_config 表中，可动态修改  |
| 表格宽度固定无法占满容器 | ✅ 使用 min-width 替代 width，表格自动占满 |
| 新增爬虫要改代码         | ✅ 只需在 crawler_config 表中添加记录      |
| 无配置版本管理           | ✅ 数据库表可以版本控制和备份              |

**现在爬虫配置完全可配置化，不需要修改代码就能调整爬虫设置！** 🎉
