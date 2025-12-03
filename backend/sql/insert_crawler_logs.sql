-- =====================================================
-- 为爬虫日志表插入测试数据
-- 为游戏爬虫和 AI工具库 补充执行日志
-- =====================================================

-- 1. 为游戏爬虫插入日志数据
INSERT INTO crawler_logs (spider_type, status, total_count, duration_ms, created_at) VALUES
('game', 'success', 150, 1500, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('game', 'success', 160, 1200, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('game', 'success', 167, 1300, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('game', 'success', 155, 1100, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('game', 'success', 158, 1250, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('game', 'success', 162, 1400, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('game', 'success', 167, 1350, NOW());

-- 2. 为 AI工具库 插入日志数据
INSERT INTO crawler_logs (spider_type, status, total_count, duration_ms, created_at) VALUES
('ai_info', 'success', 135, 800, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('ai_info', 'success', 140, 850, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('ai_info', 'success', 142, 900, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('ai_info', 'success', 138, 750, NOW());

-- 3. 验证插入结果
SELECT 'game' as spider_type, COUNT(*) as log_count, AVG(duration_ms) as avg_duration FROM crawler_logs WHERE spider_type = 'game'
UNION ALL
SELECT 'ai_info' as spider_type, COUNT(*) as log_count, AVG(duration_ms) as avg_duration FROM crawler_logs WHERE spider_type = 'ai_info'
UNION ALL
SELECT 'hot_topics' as spider_type, COUNT(*) as log_count, AVG(duration_ms) as avg_duration FROM crawler_logs WHERE spider_type = 'hot_topics';
