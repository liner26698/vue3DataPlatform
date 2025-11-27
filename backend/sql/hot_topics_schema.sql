-- 创建热门话题表
CREATE TABLE `hot_topics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `platform` VARCHAR(50) NOT NULL COMMENT '平台名称(douyin/baidu/zhihu/weibo/bilibili)',
  `rank` INT NOT NULL COMMENT '排名',
  `title` VARCHAR(255) NOT NULL COMMENT '话题标题',
  `category` VARCHAR(100) COMMENT '分类',
  `heat` BIGINT NOT NULL DEFAULT 0 COMMENT '热度值',
  `trend` ENUM('up', 'down', 'stable') DEFAULT 'stable' COMMENT '趋势',
  `tags` VARCHAR(255) COMMENT '标签(JSON格式或逗号分隔)',
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

-- 创建话题历史表（可选，用于记录热度变化）
CREATE TABLE `hot_topics_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `topic_id` INT NOT NULL COMMENT '话题ID',
  `platform` VARCHAR(50) NOT NULL COMMENT '平台名称',
  `rank` INT NOT NULL COMMENT '当时排名',
  `heat` BIGINT NOT NULL COMMENT '当时热度',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  FOREIGN KEY (`topic_id`) REFERENCES `hot_topics`(`id`) ON DELETE CASCADE,
  KEY `idx_platform_date` (`platform`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='热门话题历史表';

-- 创建爬虫任务日志表
DROP TABLE IF EXISTS `crawler_logs`;
CREATE TABLE `crawler_logs` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
