-- 游戏表合并迁移脚本
-- 将 ps5_game 和 pc_game 合并为统一的 game_info 表
-- 执行时间: 2025-11-26

-- 1. 创建新的统一游戏表
CREATE TABLE IF NOT EXISTS game_info (
  id int NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  url varchar(255) NOT NULL,
  img varchar(255) NOT NULL,
  time varchar(50) NOT NULL,
  game_type varchar(100) NOT NULL,
  production varchar(255) NOT NULL,
  introduction text NOT NULL,
  update_time datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  targetgametype varchar(50) NOT NULL COMMENT 'ps5 或 pc',
  player_rating varchar(10),
  player_rating2 varchar(10),
  player_num varchar(100),
  expected_value varchar(10),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_game (title, targetgametype),
  KEY idx_targetgametype (targetgametype),
  KEY idx_update_time (update_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一的游戏信息表 (ps5 + pc)';

-- 2. 迁移 ps5_game 数据到 game_info
INSERT INTO game_info (
  title, url, img, time, game_type, production, introduction, 
  update_time, targetgametype, player_rating, player_rating2, player_num, expected_value
)
SELECT 
  title, url, img, time, game_type, production, introduction,
  update_time, targetgametype, player_rating, player_rating2, player_num, expected_value
FROM ps5_game
ON DUPLICATE KEY UPDATE
  url = VALUES(url),
  img = VALUES(img),
  time = VALUES(time),
  game_type = VALUES(game_type),
  production = VALUES(production),
  introduction = VALUES(introduction),
  update_time = VALUES(update_time),
  player_rating = VALUES(player_rating),
  player_rating2 = VALUES(player_rating2),
  player_num = VALUES(player_num),
  expected_value = VALUES(expected_value);

-- 3. 迁移 pc_game 数据到 game_info
INSERT INTO game_info (
  title, url, img, time, game_type, production, introduction,
  update_time, targetgametype, player_rating, player_rating2, player_num, expected_value
)
SELECT
  title, url, img, time, game_type, production, introduction,
  update_time, targetgametype, player_rating, player_rating2, player_num, expected_value
FROM pc_game
ON DUPLICATE KEY UPDATE
  url = VALUES(url),
  img = VALUES(img),
  time = VALUES(time),
  game_type = VALUES(game_type),
  production = VALUES(production),
  introduction = VALUES(introduction),
  update_time = VALUES(update_time),
  player_rating = VALUES(player_rating),
  player_rating2 = VALUES(player_rating2),
  player_num = VALUES(player_num),
  expected_value = VALUES(expected_value);

-- 4. 验证数据
SELECT 
  targetgametype,
  COUNT(*) as count,
  MAX(update_time) as latest_update
FROM game_info
GROUP BY targetgametype;

-- 5. 备份原表（不删除，防止数据丢失）
-- ALTER TABLE ps5_game RENAME TO ps5_game_backup_20251126;
-- ALTER TABLE pc_game RENAME TO pc_game_backup_20251126;
