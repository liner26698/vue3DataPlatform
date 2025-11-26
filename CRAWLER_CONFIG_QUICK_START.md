# 🚀 爬虫配置动态化 - 快速部署指南

## 📦 三个新增/修改的文件

### 1. 新增 SQL 文件

```
server/sql/crawler_config_schema.sql
```

创建 `crawler_config` 表并导入默认配置

### 2. 新增初始化脚本

```
server/sql/init_crawler_config.sh
```

自动执行上述 SQL 脚本

### 3. 修改后端路由

```
server/routes/index.js
```

- 添加从 `crawler_config` 表查询配置的逻辑
- 返回动态的 `tableName`, `scheduleTime`, `scheduleFrequency`

### 4. 修改前端组件

```
src/views/crawlerStats/index.vue
```

- 表格列从固定 `width` 改为 `min-width`（占满容器）
- 从 API 动态接收 `tableName`, `scheduleTime`, `scheduleFrequency`

---

## ⚡ 一键部署

### 步骤 1: 创建配置表（必做）

```bash
# 进入项目根目录
cd /Users/xulin/自己的gitHub和项目/liner26698/vue3DataPlatform

# 执行初始化脚本
bash server/sql/init_crawler_config.sh
```

如果遇到连接问题，指定参数：

```bash
bash server/sql/init_crawler_config.sh localhost root root vue3_data_platform
```

### 步骤 2: 验证表结构

```bash
# 连接数据库
mysql -u root -p vue3_data_platform

# 在 MySQL 中执行
DESCRIBE crawler_config;
SELECT * FROM crawler_config;
```

### 步骤 3: 启动项目

```bash
npm run dev
```

### 步骤 4: 验证功能

1. 打开浏览器 http://localhost:5173
2. 进入"爬虫详细统计"页面
3. 检查表格是否显示：
   - ✅ 📦 存储表（来自数据库）
   - ✅ ⏰ 定时配置（来自数据库）
   - ✅ 表格宽度占满容器

---

## 🎛️ 配置修改方法

### 修改定时时间

```sql
UPDATE crawler_config
SET schedule_time = '02:00'
WHERE spider_name = '游戏爬虫';
```

### 修改存储表名

```sql
UPDATE crawler_config
SET table_name = 'new_table_name'
WHERE spider_name = '热门话题';
```

### 查看所有配置

```sql
SELECT spider_name, table_name, schedule_time, schedule_frequency FROM crawler_config;
```

### 新增爬虫配置

```sql
INSERT INTO crawler_config (
    spider_name,
    table_name,
    schedule_time,
    schedule_frequency,
    cron_expression,
    source_code_path,
    platform_name,
    description
) VALUES (
    '新爬虫名称',
    '新表名',
    '定时时间',
    '运行频率',
    'cron表达式',
    '源代码路径',
    '平台名称',
    '爬虫描述'
);
```

---

## 📊 效果对比

### 修改前

```
❌ 定时配置硬编码在 API 返回值中
❌ 存储表硬编码在 API 返回值中
❌ 要修改配置必须改代码
❌ 表格宽度固定，不占满空间
```

### 修改后

```
✅ 定时配置存储在数据库 crawler_config 表
✅ 存储表存储在数据库 crawler_config 表
✅ 修改配置只需修改数据库记录
✅ 表格自动占满容器宽度
✅ 不需要重启项目，页面刷新立即生效
```

---

## 🔍 核心改动说明

### 后端改动

**before**:

```javascript
const crawlerStats = [
	{
		spiderName: "游戏爬虫",
		tableName: "game_info", // ❌ 硬编码
		scheduleTime: "03:00", // ❌ 硬编码
		scheduleFrequency: "每天凌晨" // ❌ 硬编码
	}
];
```

**after**:

```javascript
// 从数据库动态读取
const configMap = {};
const configs = await db.query("SELECT * FROM crawler_config WHERE enabled = 1");
configs.forEach(config => {
	configMap[config.spider_name] = {
		tableName: config.table_name, // ✅ 从数据库
		scheduleTime: config.schedule_time, // ✅ 从数据库
		scheduleFrequency: config.schedule_frequency // ✅ 从数据库
	};
});

const crawlerStats = [
	{
		spiderName: "游戏爬虫",
		tableName: configMap["游戏爬虫"]?.tableName,
		scheduleTime: configMap["游戏爬虫"]?.scheduleTime,
		scheduleFrequency: configMap["游戏爬虫"]?.scheduleFrequency
	}
];
```

### 前端改动

**before**:

```vue
<el-table-column prop="tableName" label="存储表" width="130" />
<!-- ❌ 宽度固定，表格不占满 -->
```

**after**:

```vue
<el-table-column prop="tableName" label="存储表" min-width="140" />
<!-- ✅ 最小宽度，自动拉伸占满 -->
```

---

## 📝 故障排除

### 1️⃣ 执行脚本报错 "Permission denied"

```bash
chmod +x server/sql/init_crawler_config.sh
bash server/sql/init_crawler_config.sh
```

### 2️⃣ MySQL 连接失败

```bash
# 检查 MySQL 是否运行
mysql -u root -p

# 如果提示命令不存在，可能需要安装或配置 PATH
which mysql
```

### 3️⃣ 表格显示"未配置"

检查数据库中是否有对应的爬虫配置：

```sql
SELECT * FROM crawler_config WHERE spider_name = '游戏爬虫';
```

如果没有，运行初始化脚本重新导入。

### 4️⃣ 修改了配置后，页面没有更新

**这是正常的！** 因为前端会缓存数据。

**解决**:

1. 点击"刷新所有数据"按钮，或
2. 按 F5 刷新页面

---

## ✨ 完成效果

打开"爬虫详细统计"模块后，你会看到：

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 爬虫详细统计                                                  │
├─────────────────────────────────────────────────────────────────┤
│ 爬虫名称  │ 数据源 │ 📦存储表  │ ⏰定时配置 │ 数据量│ 最后更新  │
├─────────────────────────────────────────────────────────────────┤
│ 🎮游戏爬虫│ PS5/PC│ game_info│ 03:00    │  167 │ 2025-11-19│
│ 🔥热门话题│ 百度  │hot_topics│ 00:00... │ 1234 │ 2025-11-26│
│ 🤖AI工具库│ 多源  │ ai_info  │ 未配置   │  89  │ 2025-11-25│
└─────────────────────────────────────────────────────────────────┘
```

**所有数据（包括存储表和定时时间）都来自数据库！**

---

## 🎉 大功告成！

配置已完全可配置化，不再需要修改代码来调整爬虫设置！

有问题？查看详细文档：`CRAWLER_CONFIG_DYNAMIC.md`
