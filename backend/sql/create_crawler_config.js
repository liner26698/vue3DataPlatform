const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function createTable() {
	let conn;
	try {
		conn = await mysql.createConnection({
			host: "localhost",
			user: "admin",
			password: "Admin@2025!",
			database: "vue3_data_platform"
		});

		console.log("✅ 数据库连接成功");

		// 读取 SQL 文件内容
		const sqlPath = path.join(__dirname, "./server/sql/crawler_config_schema.sql");
		const sql = fs.readFileSync(sqlPath, "utf8");

		// 分割 SQL 语句（以分号分割）
		const statements = sql.split(";").filter(stmt => stmt.trim());

		for (const statement of statements) {
			if (statement.trim()) {
				try {
					await conn.execute(statement);
					console.log("✅ 执行 SQL 语句成功");
				} catch (err) {
					if (err.message.includes("already exists")) {
						console.log("⚠️  表已存在，跳过创建");
					} else {
						console.error("❌ 执行失败:", err.message);
						throw err;
					}
				}
			}
		}

		console.log("✅ 爬虫配置表创建成功！");
	} catch (err) {
		console.error("❌ 错误:", err.message);
		process.exit(1);
	} finally {
		if (conn) await conn.end();
	}
}

createTable();
