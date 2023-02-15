// db.js
let mysql = require("mysql");

// iissjj
// let pool = mysql.createPool({
// 	host: "10.0.132.54",
// 	user: "root", //用户名
// 	password: "ssitg@admin1233", //密码
// 	database: "zjcp_isj_visitor", // 数据库名称
// 	port: "3306" //端口号
// });

// maowei
let pool = mysql.createPool({
	host: "118.31.19.29",
	user: "root", //用户名
	password: "123456", //密码
	database: "vue3", // 数据库名称
	port: "9534" //端口号
});

function query(sql) {
	return new Promise((resolve, reject) => {
		pool.getConnection(function (req, connection) {
			pool.query(sql, function (err, result) {
				if (err) {
					console.log("------------------------------------- 错误信息: ------------------------------------- : ", err);
					reject(err);
				} else {
					console.log("------------------------------------- 正常返回信息: ------------------------------------- : ", result);
					resolve(result);
				}
				// 释放连接池
				connection.release();
			});
		});
	});
}

exports.query = query;
