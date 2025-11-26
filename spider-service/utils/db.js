/**
 * 数据库连接模块 - 独立爬虫服务用
 * 连接到主项目的数据库
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
	host: process.env.DB_HOST || 'localhost',
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || 'root',
	database: process.env.DB_NAME || 'data_platform',
	port: process.env.DB_PORT || 3306,
	connectionLimit: 10,
	enableKeepAlive: true,
	keepAliveInitialDelayMs: 0,
	waitForConnections: true,
	queueLimit: 0
});

// 数据库连接成功消息
pool.getConnection().then(() => {
	console.log('✅ 数据库连接成功');
}).catch(error => {
	console.error('❌ 数据库连接失败:', error.message);
	process.exit(1);
});

// 查询数据库
async function query(sql, values = []) {
	const connection = await pool.getConnection();
	try {
		console.log('📝 数据库查询成功');
		const [results] = await connection.execute(sql, values);
		return results;
	} catch (error) {
		console.error('❌ 数据库查询错误:', error.message);
		throw error;
	} finally {
		connection.release();
	}
}

module.exports = {
	query,
	pool
};
