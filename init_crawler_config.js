const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function initCrawlerConfig() {
	let conn;
	try {
		// 数据库连接配置
		const config = {
			host: "8.166.130.216",
			user: "admin",
			password: "Admin@2025!",
			database: "vue3"
		};

		console.log("================================");
		console.log("🚀 开始初始化爬虫配置表...");
		console.log("================================\n");
		console.log("📋 数据库配置:");
		console.log(`  Host: ${config.host}`);
		console.log(`  User: ${config.user}`);
		console.log(`  Database: ${config.database}\n`);

		// 创建连接
		conn = await mysql.createConnection(config);
		console.log("✅ 数据库连接成功\n");

		// 读取 SQL 文件
		const sqlFile = path.join(__dirname, "crawler_config_schema.sql");
		const sql = fs.readFileSync(sqlFile, "utf8");

		// 分割 SQL 语句
		const statements = sql.split(";").filter(s => s.trim());

		console.log(`📝 开始执行 ${statements.length} 个 SQL 语句...\n`);

		for (let i = 0; i < statements.length; i++) {
			const stmt = statements[i].trim();
			if (stmt) {
				try {
					await conn.execute(stmt);
					if (i < 3) console.log(`✅ SQL 语句 ${i + 1} 执行成功`);
				} catch (err) {
					// 表已存在不算错误
					if (err.message.includes("already exists")) {
						console.log(`⚠️  表已存在，跳过创建`);
					} else {
						throw err;
					}
				}
			}
		}

		console.log("\n================================");
		console.log("✅ 爬虫配置表创建成功！");
		console.log("================================\n");
		console.log("📊 已创建表: crawler_config");
		console.log("📝 已导入默认配置:");
		console.log("  • 游戏爬虫 (game_info, 每天03:00)");
		console.log("  • 热门话题 (hot_topics, 每天00:00/12:00/18:00)");
		console.log("  • AI工具库 (ai_info, 手动)");
		console.log("\n💡 查看配置: SELECT * FROM crawler_config;");
		console.log('💡 修改配置: UPDATE crawler_config SET schedule_time = "02:00" WHERE spider_name = "游戏爬虫";');
	} catch (err) {
		console.error("\n❌ 错误:", err.message);
		console.error("\n请检查:");
		console.error("  1. 数据库连接信息是否正确");
		console.error("  2. 数据库是否存在");
		console.error("  3. 网络连接是否正常");
		process.exit(1);
	} finally {
		if (conn) await conn.end();
	}
}

initCrawlerConfig();
