-- =====================================================
-- 迁移脚本：为 crawler_config 表添加 source_url 字段
-- =====================================================

-- 检查 source_url 字段是否存在，如果不存在则添加
ALTER TABLE crawler_config 
ADD COLUMN source_url VARCHAR(500) COMMENT '爬虫源地址' AFTER platform_name;

-- 更新现有数据
UPDATE crawler_config SET source_url = 'https://ku.gamersky.com' WHERE spider_name = '游戏爬虫';
UPDATE crawler_config SET source_url = '/' WHERE spider_name = '热门话题';
UPDATE crawler_config SET source_url = '/' WHERE spider_name = 'AI工具库';

-- 验证更新
SELECT id, spider_name, platform_name, source_url FROM crawler_config;
