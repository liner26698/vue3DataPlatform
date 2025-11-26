// db.js
const mysql = require("mysql2");

// 创建连接池
const pool = mysql.createPool({
	host: "8.166.130.216",
	user: "admin", //用户名
	password: "Admin@2025!", //密码
	database: "vue3", // 数据库名称
	port: "3306" //端口号
});

module.exports = {
	query: (sql, params) => {
		return new Promise((resolve, reject) => {
			pool.query(sql, params, (err, results) => {
				if (err) {
					console.error("数据库查询错误:", err); // 打印错误信息
					reject(err);
				} else {
					console.log("数据库查询成功:", results); // 打印查询结果
					resolve(results);
				}
			});
		});
	}
};

pool.getConnection((err, connection) => {
	if (err) {
		console.error("数据库连接失败:", err);
	} else {
		console.log("数据库连接成功");

		// 自动创建 crawler_config 表（如果不存在）
		initCrawlerConfigTable(connection);

		connection.release();
	}
});

/**
 * 初始化爬虫配置表
 */
function initCrawlerConfigTable(connection) {
	const createTableSQL = `
		CREATE TABLE IF NOT EXISTS crawler_config (
			id INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
			spider_name VARCHAR(100) NOT NULL UNIQUE COMMENT '爬虫名称（唯一）',
			table_name VARCHAR(100) NOT NULL COMMENT '数据存储表名',
			schedule_time VARCHAR(200) COMMENT '定时运行时间',
			schedule_frequency VARCHAR(100) COMMENT '运行频率描述',
			cron_expression VARCHAR(100) COMMENT 'Cron 表达式',
			source_code_path VARCHAR(200) COMMENT '源代码文件路径',
			platform_name VARCHAR(100) COMMENT '数据源平台',
			description TEXT COMMENT '爬虫描述',
			enabled TINYINT DEFAULT 1 COMMENT '是否启用',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
			INDEX idx_spider_name (spider_name),
			INDEX idx_table_name (table_name)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫配置表'
	`;

	connection.query(createTableSQL, err => {
		if (err) {
			console.error("创建爬虫配置表失败:", err.message);
		} else {
			console.log("✅ 爬虫配置表已创建或已存在");

			// 检查是否需要插入默认数据
			const checkSQL = `SELECT COUNT(*) as count FROM crawler_config`;
			connection.query(checkSQL, (err, results) => {
				if (!err && results[0].count === 0) {
					insertDefaultConfigs(connection);
				}
			});
		}
	});
}

/**
 * 插入默认爬虫配置
 */
function insertDefaultConfigs(connection) {
	const insertSQL = `
		INSERT INTO crawler_config (spider_name, table_name, schedule_time, schedule_frequency, cron_expression, source_code_path, platform_name, description, enabled)
		VALUES 
			('游戏爬虫', 'game_info', '03:00', '每天凌晨', '0 0 3 * * *', 'server/utils/gameSpider.js', 'PS5/PC Game', '爬取游戏平台数据', 1),
			('热门话题', 'hot_topics', '00:00, 12:00, 18:00', '每天三次', '0 0 0/12 * * *', 'server/utils/hotTopicsSpider.js', 'Baidu/Weibo/Bilibili', '爬取热门话题数据', 1),
			('AI工具库', 'ai_info', '未配置', '手动', '', 'server/utils/aiToolsSpider.js', '多源AI工具聚合', '爬取AI工具信息', 1)
		ON DUPLICATE KEY UPDATE 
			table_name = VALUES(table_name),
			schedule_time = VALUES(schedule_time),
			schedule_frequency = VALUES(schedule_frequency),
			updated_at = CURRENT_TIMESTAMP
	`;

	connection.query(insertSQL, err => {
		if (err) {
			console.error("插入默认爬虫配置失败:", err.message);
		} else {
			console.log("✅ 默认爬虫配置已导入");
		}
	});
}
