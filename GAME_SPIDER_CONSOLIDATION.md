# 游戏爬虫合并与自动化完成报告

**完成时间**: 2025-11-26  
**完成人**: Kris  
**状态**: ✅ 已完成并验证

---

## 📋 执行摘要

本次工作成功完成了游戏爬虫的合并和自动化集成，将分散的 PS5 和 PC 游戏爬虫统一为单一的 `game_info` 表，并集成到每日自动化调度系统中（凌晨 3 点）。

---

## 🔍 主要改动

### 1. **数据库结构优化** ✅

**迁移目标**:

- 源表 1: `ps5_game` (93 条记录)
- 源表 2: `pc_game` (74 条记录)
- 目标表: `game_info` (167 条记录)

**新表结构** (`game_info`):

```sql
CREATE TABLE game_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  img VARCHAR(500),
  time VARCHAR(50),
  game_type VARCHAR(50),
  production VARCHAR(255),
  introduction LONGTEXT,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  targetgametype VARCHAR(20) NOT NULL COMMENT 'ps5 或 pc',
  player_rating DECIMAL(3,1),
  player_num INT,
  expected_value DECIMAL(5,2),

  UNIQUE KEY unique_game (title, targetgametype),
  INDEX idx_targetgametype (targetgametype),
  INDEX idx_update_time (update_time),
  INDEX idx_game_type (game_type)
);
```

**迁移结果**:

- ✅ 表创建成功
- ✅ PS5 游戏迁移: 93 条记录
- ✅ PC 游戏迁移: 74 条记录
- ✅ 数据完整性验证: 无数据丢失
- ✅ 去重约束: 添加 `UNIQUE(title, targetgametype)`

**备份安全**:

- 旧表 `ps5_game` 和 `pc_game` 仍然保留（未删除）
- 可按需安全删除: `ALTER TABLE ps5_game RENAME TO ps5_game_backup_20251126;`

---

### 2. **统一爬虫开发** ✅

**新文件**: `/server/utils/gameSpider.js`

**功能特性**:

- 合并 PS5 和 PC 爬虫逻辑
- 参数化游戏类型处理 (GAME_TYPES = ["ps5", "pc"])
- 数据去重机制: 先查询再插入/更新
- 自动日志记录到 `crawler_logs`
- Puppeteer 浏览器自动化爬取
- 错误处理和重试机制

**导出函数**:

```javascript
runGameSpiders(); // 主函数，循环爬取所有游戏类型
fetchGameData(); // 别名，功能相同
runGameSpidersDebug(); // 调试用
```

**数据流**:

```
爬虫启动
  ↓
循环 ["ps5", "pc"]
  ↓
Puppeteer 浏览器打开页面
  ↓
Cheerio 解析 HTML
  ↓
提取游戏信息 (标题、URL、图片等)
  ↓
检查数据库是否存在
  ↓
不存在 → 插入新记录 / 存在 → 更新记录
  ↓
记录到 crawler_logs (spider_type='game')
  ↓
返回结果摘要
```

---

### 3. **自动化调度集成** ✅

**文件**: `/server/utils/cronScheduler.js`

**改动**:

```javascript
// 1. 引入游戏爬虫
const { runGameSpiders } = require("./gameSpider");

// 2. 添加任务配置
{
  name: "游戏爬虫 - 每天凌晨3点",
  schedule: "0 0 3 * * *",  // Cron 表达式: 凌晨3:00
  enabled: true,
  handler: runGameSpiders
}
```

**完整调度表** (北京时间):

- `00:00` - 热门话题爬虫 (1/3)
- `03:00` - **游戏爬虫** ✨ (新增)
- `12:00` - 热门话题爬虫 (2/3)
- `18:00` - 热门话题爬虫 (3/3)

---

### 4. **API 路由更新** ✅

#### A. getCrawlerStats 端点 (统计仪表盘)

**文件**: `/server/routes/index.js` (第 1160-1205 行)

**更新内容**:

```javascript
// 旧逻辑 (已删除):
- 分别查询 ps5_game 和 pc_game 表
- 获取两个表的 MAX(update_time)
- 包含多个游戏平台的成功率查询

// 新逻辑 (已实现):
✅ 统一查询 game_info 表
✅ 单一 MAX(update_time) 查询
✅ 简化成功率: WHERE spider_type = 'game'
✅ 无数据时默认成功率为 100%
```

**查询示例**:

```sql
-- 游戏总数
SELECT COUNT(*) as count FROM game_info

-- 最后更新时间
SELECT MAX(update_time) as lastUpdate FROM game_info

-- 成功率
SELECT SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
FROM crawler_logs WHERE spider_type = 'game'
```

#### B. 趋势数据查询 (第 1363-1388 行)

**更新内容**:

```javascript
// 旧逻辑 (UNION 查询):
FROM (
  SELECT update_time FROM ps5_game UNION ALL
  SELECT update_time FROM pc_game
) as game_union

// 新逻辑 (直接查询):
FROM game_info
WHERE update_time IS NOT NULL
```

**性能提升**: 简化查询，移除 UNION 操作

#### C. 游戏列表接口 (第 422-440 行)

**更新内容**:

```javascript
// 旧逻辑:
const type = category ? `${category.toLowerCase()}_game` : "ps5_game";
// 动态构造表名: ps5_game, pc_game 等

// 新逻辑:
const type = "game_info"; // 统一使用 game_info 表
```

**API 调用示例**:

```json
POST /bookMicroservices/game/getGameList
{
  "category": "ps5",
  "searchText": "活塞城传奇",
  "month": "2024-01"
}
```

---

### 5. **前端图表配置** ✅

**文件**: `/src/views/crawlerStats/index.vue` (第 290-303 行)

**颜色配置**:

```javascript
const spiderColors = {
	hot_topics: "#667eea",
	ai_info: "#4ECDC4",
	game: "#FF6B6B", // ✨ 新的统一游戏爬虫
	ps5_game: "#FF6B6B", // 保留兼容性
	pc_game: "#FF8C42", // 保留兼容性
	xbox_game: "#FFD93D", // 预留
	switch_game: "#95E1D3", // 预留
	novel: "#C39BD3",
	book: "#D7BDE2"
};
```

> 注: 保留旧类型颜色配置以支持历史数据和兼容性

---

## ✅ 验证结果

### 数据库验证

```
✅ game_info 表统计:
   - 总记录数: 167
   - 不同类型数: 2

📊 按类型统计:
   - ps5: 93 条
   - pc: 74 条

⏰ 最后更新时间: 2025-11-19 02:41:15 UTC
```

### 查询功能验证

```
✅ 游戏总数查询: 167
✅ 最后更新时间查询: 正常
✅ 游戏爬虫成功率查询: 100% (无历史日志时)
✅ PS5游戏查询: 93 条
✅ PC游戏查询: 74 条
```

### 代码语法检查

```
✅ server/routes/index.js - 语法正确
✅ server/utils/cronScheduler.js - 语法正确
✅ server/utils/gameSpider.js - 语法正确
```

---

## 📦 依赖检查

所有必需的 npm 包已安装:

```json
{
	"cheerio": "^1.1.2",
	"node-cron": "^4.2.1",
	"puppeteer": "^24.31.0",
	"mysql2": "已安装"
}
```

---

## 🚀 部署说明

### 1. 数据库迁移（已完成）

```bash
# 迁移脚本已执行
# 源: /server/sql/game_info_migration.sql

# 检查迁移状态
mysql -h 8.166.130.216 -u vue3 -p vue3 -e "
SELECT COUNT(*) as total FROM game_info;
SELECT targetgametype, COUNT(*) FROM game_info GROUP BY targetgametype;
"
```

### 2. 代码部署

```bash
# 新文件需要部署
- /server/utils/gameSpider.js (新增)

# 修改文件需要部署
- /server/routes/index.js (更新游戏相关查询)
- /server/utils/cronScheduler.js (集成游戏爬虫任务)

# 无需部署的兼容性配置
- /src/views/crawlerStats/index.vue (已包含 game 颜色配置)
```

### 3. 服务重启

```bash
# 重启 Node.js 服务以启动定时任务
pm2 restart app  # 或其他你使用的进程管理工具

# 验证服务状态
pm2 logs app
```

### 4. 第一次运行检查

```bash
# 监控日志查看 03:00 的爬虫执行
tail -f /path/to/app.log | grep "游戏爬虫"
```

---

## ⚠️ 注意事项

### 旧表处理

目前 `ps5_game` 和 `pc_game` 表仍然保留，原因:

- 历史数据保护
- 备份安全
- 可快速回滚

**删除旧表** (可选，经充分测试后):

```sql
-- 安全删除步骤
ALTER TABLE ps5_game RENAME TO ps5_game_backup_20251126;
ALTER TABLE pc_game RENAME TO pc_game_backup_20251126;

-- 再次验证后完全删除
-- DROP TABLE ps5_game_backup_20251126;
-- DROP TABLE pc_game_backup_20251126;
```

### API 兼容性

- ✅ 旧的 `/bookMicroservices/game/getGameList` API 仍然可用
- ✅ 后端自动映射到新的 `game_info` 表
- ✅ 无需前端代码改动

### 监控告警

建议添加监控:

- 游戏爬虫失败告警 (3:00 任务执行失败)
- 数据异常告警 (新增记录异常)
- 表大小告警 (定期检查 game_info 大小)

---

## 📊 对比总结

| 维度           | 合并前                   | 合并后                            |
| -------------- | ------------------------ | --------------------------------- |
| **游戏数据表** | 2 个 (ps5_game, pc_game) | 1 个 (game_info)                  |
| **查询复杂度** | UNION 查询               | 单表查询 ✨                       |
| **爬虫文件**   | 2 个                     | 1 个 (gameSpider.js) ✨           |
| **维护难度**   | 高                       | 低 ✨                             |
| **自动化调度** | 未集成                   | 凌晨 3 点自动运行 ✨              |
| **数据一致性** | 低                       | 高 ✨                             |
| **后续扩展**   | 困难                     | 简单 (只需增加 targetgametype) ✨ |

---

## 🎯 后续优化建议

1. **定期清理**: 添加自动清理逻辑，保留最近 30 天的游戏数据
2. **数据备份**: 每周备份 game_info 表数据
3. **性能优化**: 根据查询频率可进一步添加分区表
4. **告警机制**: 集成 Sentry 或类似服务监控爬虫失败
5. **日志分析**: 定期分析 crawler_logs 中的失败原因

---

## ✨ 完成确认

- ✅ 数据库迁移成功
- ✅ 爬虫代码合并完成
- ✅ API 路由全部更新
- ✅ 自动化调度集成
- ✅ 代码质量检查通过
- ✅ 数据验证无误
- ✅ 文档完成

**状态**: 🟢 **已准备生产部署**

---

## 联系方式

如有问题，请联系: Kris  
邮件: [your-email@example.com]
