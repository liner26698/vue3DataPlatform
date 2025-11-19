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
		connection.release();
	}
});
