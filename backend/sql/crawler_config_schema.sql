-- =====================================================
-- 爬虫配置表
-- 用于存储爬虫的配置信息：存储表、定时时间、运行频率等
-- =====================================================

-- 创建爬虫配置表
CREATE TABLE IF NOT EXISTS crawler_config (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
    spider_name VARCHAR(100) NOT NULL UNIQUE COMMENT '爬虫名称（唯一）',
    table_name VARCHAR(100) NOT NULL COMMENT '数据存储表名',
    schedule_time VARCHAR(200) COMMENT '定时运行时间（如：03:00 或 00:00, 12:00, 18:00）',
    schedule_frequency VARCHAR(100) COMMENT '运行频率描述（如：每天凌晨、每天三次、手动等）',
    cron_expression VARCHAR(100) COMMENT 'Cron 表达式',
    source_code_path VARCHAR(200) COMMENT '源代码文件路径',
    platform_name VARCHAR(100) COMMENT '数据源平台',
    source_url VARCHAR(500) COMMENT '爬虫源地址',
    description TEXT COMMENT '爬虫描述',
    enabled TINYINT DEFAULT 1 COMMENT '是否启用（1=启用，0=禁用）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_spider_name (spider_name),
    INDEX idx_table_name (table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫配置表';

-- 插入默认配置数据
INSERT INTO crawler_config (spider_name, table_name, schedule_time, schedule_frequency, cron_expression, source_code_path, platform_name, source_url, description, enabled)
VALUES 
    (
        '游戏爬虫',
        'game_info',
        '03:00',
        '每天凌晨',
        '0 0 3 * * *',
        'server/utils/gameSpider.js',
        'PS5/PC Game',
        'https://ku.gamersky.com',
        '爬取游戏平台数据',
        1
    ),
    (
        '热门话题',
        'hot_topics',
        '00:00, 12:00, 18:00',
        '每天三次',
        '0 0 0/12 * * *',
        'server/utils/hotTopicsSpider.js',
        'Baidu/Weibo/Bilibili',
        '/',
        '爬取热门话题数据',
        1
    ),
    (
        'AI工具库',
        'ai_info',
        '未配置',
        '手动',
        '',
        'server/utils/aiToolsSpider.js',
        '多源AI工具聚合',
        '/',
        '爬取AI工具信息',
        1
    )
ON DUPLICATE KEY UPDATE 
    table_name = VALUES(table_name),
    schedule_time = VALUES(schedule_time),
    schedule_frequency = VALUES(schedule_frequency),
    cron_expression = VALUES(cron_expression),
    source_code_path = VALUES(source_code_path),
    platform_name = VALUES(platform_name),
    source_url = VALUES(source_url),
    description = VALUES(description),
    enabled = VALUES(enabled),
    updated_at = CURRENT_TIMESTAMP;
