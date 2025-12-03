const mysql = require("mysql2/promise");

const pool = mysql.createPool({
	host: "8.166.130.216",
	user: "admin",
	password: "Admin@2025!",
	database: "vue3",
	port: 3306,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});

async function insertLogs() {
	let conn;
	try {
		conn = await pool.getConnection();

		// 插入游戏爬虫日志
		const gameInsertSql = `INSERT INTO crawler_logs (spider_type, status, total_count, duration_ms, created_at) VALUES
      ('game', 'success', 150, 1500, DATE_SUB(NOW(), INTERVAL 6 DAY)),
      ('game', 'success', 160, 1200, DATE_SUB(NOW(), INTERVAL 5 DAY)),
      ('game', 'success', 167, 1300, DATE_SUB(NOW(), INTERVAL 4 DAY)),
      ('game', 'success', 155, 1100, DATE_SUB(NOW(), INTERVAL 3 DAY)),
      ('game', 'success', 158, 1250, DATE_SUB(NOW(), INTERVAL 2 DAY)),
      ('game', 'success', 162, 1400, DATE_SUB(NOW(), INTERVAL 1 DAY)),
      ('game', 'success', 167, 1350, NOW())`;

		await conn.query(gameInsertSql);
		console.log("✅ 游戏爬虫日志插入成功 (7 条记录)");

		// 插入 AI工具库 日志
		const aiInsertSql = `INSERT INTO crawler_logs (spider_type, status, total_count, duration_ms, created_at) VALUES
      ('ai_info', 'success', 135, 800, DATE_SUB(NOW(), INTERVAL 6 DAY)),
      ('ai_info', 'success', 140, 850, DATE_SUB(NOW(), INTERVAL 4 DAY)),
      ('ai_info', 'success', 142, 900, DATE_SUB(NOW(), INTERVAL 2 DAY)),
      ('ai_info', 'success', 138, 750, NOW())`;

		await conn.query(aiInsertSql);
		console.log("✅ AI工具库爬虫日志插入成功 (4 条记录)");

		// 验证插入
		const verifySql = `SELECT spider_type, COUNT(*) as log_count, ROUND(AVG(duration_ms), 0) as avg_duration_ms
      FROM crawler_logs 
      GROUP BY spider_type 
      ORDER BY spider_type`;

		const [rows] = await conn.query(verifySql);
		console.log("\n📊 当前爬虫日志统计:");
		rows.forEach(row => {
			console.log(`  ${row.spider_type}: ${row.log_count} 条日志, 平均耗时 ${row.avg_duration_ms}ms`);
		});
	} catch (err) {
		console.error("❌ 插入失败:", err.message);
		console.error("详细错误:", err);
	} finally {
		if (conn) conn.release();
		await pool.end();
	}
}

insertLogs();
