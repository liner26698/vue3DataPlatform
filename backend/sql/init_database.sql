-- ====================================================
-- vue3 数据平台 数据库初始化 SQL
-- 生成时间: 2026-03
-- ====================================================

USE vue3;

-- --------------------------
-- 1. 用户表
-- --------------------------
CREATE TABLE IF NOT EXISTS `user_info` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(100) NOT NULL COMMENT '密码',
  `nickname` VARCHAR(100) COMMENT '昵称',
  `avatar` VARCHAR(500) COMMENT '头像URL',
  `role` VARCHAR(20) DEFAULT 'user' COMMENT '角色: admin/user',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户信息表';

-- 插入默认管理员账户 (密码: admin123)
INSERT IGNORE INTO `user_info` (`username`, `password`, `nickname`, `role`) 
VALUES ('admin', 'admin123', '管理员', 'admin');

-- --------------------------
-- 2. 数据大屏表
-- --------------------------
CREATE TABLE IF NOT EXISTS `data_screen` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `realTimeVisitorNum` INT DEFAULT 0 COMMENT '实时访客数',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='大屏数据表';

INSERT IGNORE INTO `data_screen` (`id`, `realTimeVisitorNum`) VALUES (1, 1024);

-- --------------------------
-- 3. 男女比例表
-- --------------------------
CREATE TABLE IF NOT EXISTS `sex_ratio` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `male_count` INT DEFAULT 0 COMMENT '男性数量',
  `female_count` INT DEFAULT 0 COMMENT '女性数量',
  `male_ratio` DECIMAL(5,2) DEFAULT 0.00 COMMENT '男性比例',
  `female_ratio` DECIMAL(5,2) DEFAULT 0.00 COMMENT '女性比例',
  `total_count` INT DEFAULT 0 COMMENT '总人数',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='男女比例表';

INSERT IGNORE INTO `sex_ratio` (`id`, `male_count`, `female_count`, `male_ratio`, `female_ratio`, `total_count`) 
VALUES (1, 6200, 3800, 62.00, 38.00, 10000);

-- --------------------------
-- 4. 告警列表表
-- --------------------------
CREATE TABLE IF NOT EXISTS `alarm` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL COMMENT '告警标题',
  `level` ENUM('info', 'warning', 'danger') DEFAULT 'info' COMMENT '告警级别',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 1=活跃 0=已处理',
  `message` TEXT COMMENT '告警内容',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警表';

INSERT IGNORE INTO `alarm` (`id`, `title`, `level`, `status`, `message`) VALUES
(1, 'CPU使用率超过80%', 'warning', 1, '服务器CPU使用率已超过80%，请关注'),
(2, '内存使用率超过90%', 'danger', 1, '服务器内存使用率已超过90%，请立即处理'),
(3, '磁盘空间不足20%', 'warning', 1, '磁盘可用空间不足20%，请及时清理'),
(4, '数据库连接正常', 'info', 1, 'MySQL数据库连接池运行正常'),
(5, '爬虫任务执行成功', 'info', 1, '最新一次爬虫任务执行完成');

-- --------------------------
-- 5. 携程旅游/热门景点表
-- --------------------------
CREATE TABLE IF NOT EXISTS `xiecheng_travel` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL COMMENT '景点名称',
  `city` VARCHAR(100) COMMENT '城市',
  `category` VARCHAR(100) COMMENT '分类',
  `score` DECIMAL(3,1) COMMENT '评分',
  `comment_count` INT DEFAULT 0 COMMENT '评论数',
  `img` VARCHAR(500) COMMENT '图片URL',
  `url` VARCHAR(500) COMMENT '跳转链接',
  `description` TEXT COMMENT '描述',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='热门景点表';

INSERT IGNORE INTO `xiecheng_travel` (`id`, `name`, `city`, `category`, `score`, `comment_count`) VALUES
(1, '故宫博物院', '北京', '历史文化', 4.8, 128650),
(2, '西湖风景区', '杭州', '自然风光', 4.7, 98230),
(3, '张家界国家森林公园', '张家界', '自然风光', 4.9, 75640),
(4, '黄山风景区', '黄山', '自然风光', 4.8, 86320),
(5, '九寨沟风景名胜区', '阿坝', '自然风光', 4.9, 92100);

-- --------------------------
-- 6. AI工具信息表
-- --------------------------
CREATE TABLE IF NOT EXISTS `ai_info` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL COMMENT 'AI工具名称',
  `category` VARCHAR(100) COMMENT '分类',
  `description` TEXT COMMENT '描述',
  `url` VARCHAR(500) COMMENT '官网链接',
  `img` VARCHAR(500) COMMENT '图标/截图',
  `tags` VARCHAR(500) COMMENT '标签(逗号分隔)',
  `visit_count` INT DEFAULT 0 COMMENT '访问量',
  `is_free` TINYINT DEFAULT 1 COMMENT '是否免费: 1=是 0=否',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_category` (`category`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI工具信息表';

INSERT IGNORE INTO `ai_info` (`id`, `name`, `category`, `description`, `url`, `visit_count`, `is_free`) VALUES
(1, 'ChatGPT', '对话AI', 'OpenAI开发的智能对话AI', 'https://chat.openai.com', 5000000, 0),
(2, 'Claude', '对话AI', 'Anthropic开发的AI助手', 'https://claude.ai', 2000000, 0),
(3, 'Midjourney', '图像生成', 'AI图像生成工具', 'https://midjourney.com', 3000000, 0),
(4, 'Stable Diffusion', '图像生成', '开源AI图像生成模型', 'https://stability.ai', 1500000, 1),
(5, 'GitHub Copilot', '代码辅助', 'GitHub AI代码补全工具', 'https://github.com/features/copilot', 4000000, 0);

-- --------------------------
-- 7. 轮播图表
-- --------------------------
CREATE TABLE IF NOT EXISTS `rollover_image` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) COMMENT '图片标题',
  `img_url` VARCHAR(500) NOT NULL COMMENT '图片URL',
  `link_url` VARCHAR(500) COMMENT '跳转链接',
  `sort` INT DEFAULT 0 COMMENT '排序',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否启用',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轮播图表';

INSERT IGNORE INTO `rollover_image` (`id`, `title`, `img_url`, `sort`, `is_active`) VALUES
(1, '轮播图1', 'https://picsum.photos/1200/400?random=1', 1, 1),
(2, '轮播图2', 'https://picsum.photos/1200/400?random=2', 2, 1),
(3, '轮播图3', 'https://picsum.photos/1200/400?random=3', 3, 1);

-- --------------------------
-- 8. 用户上传照片表
-- --------------------------
CREATE TABLE IF NOT EXISTS `user_photo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `file_url` VARCHAR(500) NOT NULL COMMENT '文件URL',
  `file_id` VARCHAR(100) COMMENT '文件ID',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `address` VARCHAR(200) COMMENT '地址',
  `description` TEXT COMMENT '描述'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户上传照片表';

-- --------------------------
-- 9. 游戏信息表 (统一 game_info)
-- --------------------------
CREATE TABLE IF NOT EXISTS `game_info` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(300) NOT NULL COMMENT '游戏名称',
  `url` VARCHAR(500) COMMENT '游戏链接',
  `img` VARCHAR(500) COMMENT '封面图',
  `time` VARCHAR(20) COMMENT '发售时间 (YYYY-MM-DD)',
  `game_type` VARCHAR(100) COMMENT '游戏类型',
  `production` VARCHAR(200) COMMENT '开发商/发行商',
  `introduction` TEXT COMMENT '游戏简介',
  `targetgametype` VARCHAR(50) COMMENT '目标平台 (ps5/xbox/ns/pc)',
  `player_rating` DECIMAL(3,1) COMMENT '玩家评分',
  `player_num` INT DEFAULT 0 COMMENT '评分人数',
  `expected_value` INT DEFAULT 0 COMMENT '期待值',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_targetgametype` (`targetgametype`),
  KEY `idx_time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏信息表';

-- --------------------------
-- 10. PS5游戏表 (game_info 的别名视图或兼容表)
-- --------------------------
CREATE TABLE IF NOT EXISTS `ps5_game` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(300) NOT NULL COMMENT '游戏名称',
  `url` VARCHAR(500) COMMENT '游戏链接',
  `img` VARCHAR(500) COMMENT '封面图',
  `time` VARCHAR(20) COMMENT '发售时间',
  `game_type` VARCHAR(100) COMMENT '游戏类型',
  `production` VARCHAR(200) COMMENT '开发商',
  `introduction` TEXT COMMENT '游戏简介',
  `targetgametype` VARCHAR(50) DEFAULT 'ps5',
  `player_rating` DECIMAL(3,1),
  `player_num` INT DEFAULT 0,
  `expected_value` INT DEFAULT 0,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PS5游戏表';

CREATE TABLE IF NOT EXISTS `xbox_game` LIKE `ps5_game`;
CREATE TABLE IF NOT EXISTS `ns_game` LIKE `ps5_game`;
CREATE TABLE IF NOT EXISTS `pc_game` LIKE `ps5_game`;

-- --------------------------
-- 11. 热门话题表
-- --------------------------
CREATE TABLE IF NOT EXISTS `hot_topics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `platform` VARCHAR(50) NOT NULL COMMENT '平台名称(douyin/baidu/zhihu/weibo/bilibili)',
  `rank` INT NOT NULL COMMENT '排名',
  `title` VARCHAR(255) NOT NULL COMMENT '话题标题',
  `category` VARCHAR(100) COMMENT '分类',
  `heat` BIGINT NOT NULL DEFAULT 0 COMMENT '热度值',
  `trend` ENUM('up', 'down', 'stable') DEFAULT 'stable' COMMENT '趋势',
  `tags` VARCHAR(255) COMMENT '标签(JSON格式)',
  `url` VARCHAR(500) COMMENT '跳转链接',
  `description` TEXT COMMENT '话题描述',
  `image_url` VARCHAR(500) COMMENT '图片链接',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否活跃',
  KEY `idx_platform` (`platform`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_platform_rank` (`platform`, `rank`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='热门话题表';

-- --------------------------
-- 12. 话题历史表
-- --------------------------
CREATE TABLE IF NOT EXISTS `hot_topics_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `topic_id` INT NOT NULL COMMENT '话题ID',
  `platform` VARCHAR(50) NOT NULL COMMENT '平台名称',
  `rank` INT NOT NULL COMMENT '当时排名',
  `heat` BIGINT NOT NULL COMMENT '当时热度',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  KEY `idx_platform_date` (`platform`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='热门话题历史表';

-- --------------------------
-- 13. 爬虫任务日志表
-- --------------------------
CREATE TABLE IF NOT EXISTS `crawler_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `spider_type` VARCHAR(50) NOT NULL,
  `platform` VARCHAR(50),
  `status` ENUM('success', 'failed', 'pending') DEFAULT 'pending',
  `total_count` INT DEFAULT 0,
  `error_message` TEXT,
  `duration_ms` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_spider_type` (`spider_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫任务日志表';

-- --------------------------
-- 14. 爬虫配置表 (防止重复)
-- --------------------------
CREATE TABLE IF NOT EXISTS `crawler_config` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `spider_name` VARCHAR(100) NOT NULL COMMENT '爬虫名称',
  `table_name` VARCHAR(100) COMMENT '目标数据表',
  `platform_name` VARCHAR(100) COMMENT '平台名称',
  `schedule_time` VARCHAR(50) COMMENT '调度时间',
  `schedule_frequency` VARCHAR(50) COMMENT '调度频率',
  `cron_expression` VARCHAR(100) COMMENT 'Cron表达式',
  `source_url` VARCHAR(500) COMMENT '数据源URL',
  `source_code_path` VARCHAR(300) COMMENT '爬虫脚本路径',
  `description` TEXT COMMENT '描述',
  `enabled` TINYINT DEFAULT 1 COMMENT '是否启用',
  `last_run_at` DATETIME COMMENT '上次执行时间',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_spider_name` (`spider_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫配置表';

-- ====================================================
-- 初始化完成
-- ====================================================
SELECT 'Database initialization completed!' AS result;
SHOW TABLES;
